"""
Problem selection service with spaced repetition logic.

This service implements intelligent problem selection based on:
- Topic confidence levels (lower confidence = higher priority)
- Time since last attempt (spaced repetition)
- Problem history (avoid immediate repeats)
- User performance and self-reported confidence
"""

from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from sqlalchemy import func, and_, or_
from app import db
from app.models import (
    Problem, Topic, TopicProgress, ProblemAttempt, 
    PracticeSession, User
)
import random


# Configuration Constants
class SpacedRepetitionConfig:
    """Configuration for spaced repetition algorithm"""
    
    # Mastery threshold (0.0 - 1.0)
    MASTERY_THRESHOLD = 0.75
    
    # Exponential moving average weight for new results (0.0 - 1.0)
    # Higher = more weight on recent performance
    EMA_ALPHA = 0.3
    
    # Time decay factor for problem freshness (days)
    TIME_DECAY_DAYS = 7
    
    # Ratio of new vs review problems (0.0 - 1.0)
    # 0.3 = 30% new problems, 70% review
    NEW_PROBLEM_RATIO = 0.3
    
    # Confidence boost for correct answers
    CONFIDENCE_BOOST_CORRECT = 0.15
    
    # Confidence penalty for incorrect answers
    CONFIDENCE_PENALTY_INCORRECT = 0.10
    
    # User confidence rating weights (1-3 scale)
    USER_CONFIDENCE_WEIGHTS = {
        1: 0.7,   # Not confident - reduce boost
        2: 1.0,   # Neutral - normal
        3: 1.3    # Very confident - increase boost
    }
    
    # Minimum time between same problem attempts (minutes)
    MIN_REPEAT_INTERVAL = 30


def get_next_problem(
    user_id: int,
    session_id: int,
    topic_ids: List[int],
    exclude_problem_ids: Optional[List[int]] = None
) -> Optional[Tuple[Problem, Topic]]:
    """
    Select the next problem for the user based on spaced repetition logic.
    
    Args:
        user_id: ID of the user
        session_id: ID of the current practice session
        topic_ids: List of topic IDs to choose from
        exclude_problem_ids: Optional list of problem IDs to exclude
    
    Returns:
        Tuple of (Problem, Topic) or None if no suitable problem found
    """
    if not topic_ids:
        return None
    
    exclude_problem_ids = exclude_problem_ids or []
    
    # Get problems already attempted in this session
    session_problem_ids = db.session.query(ProblemAttempt.problem_id).filter(
        ProblemAttempt.session_id == session_id
    ).all()
    session_problem_ids = [pid[0] for pid in session_problem_ids]
    exclude_problem_ids.extend(session_problem_ids)
    
    # Select topic based on weighted confidence
    selected_topic_id = _select_topic_by_confidence(user_id, topic_ids)
    if not selected_topic_id:
        return None
    
    # Get topic
    topic = Topic.query.get(selected_topic_id)
    if not topic:
        return None
    
    # Decide whether to pick a new or review problem
    should_pick_new = random.random() < SpacedRepetitionConfig.NEW_PROBLEM_RATIO
    
    # Try to get appropriate problem
    problem = None
    if should_pick_new:
        problem = _get_new_problem(user_id, selected_topic_id, exclude_problem_ids)
    
    if not problem:
        # Fall back to review problem or if new problem not available
        problem = _get_review_problem(user_id, selected_topic_id, exclude_problem_ids)
    
    if not problem:
        # Last resort: any problem from this topic not in exclusion list
        problem = Problem.query.filter(
            Problem.topic_id == selected_topic_id,
            ~Problem.id.in_(exclude_problem_ids) if exclude_problem_ids else True
        ).first()
    
    if problem:
        return (problem, topic)
    
    return None


def _select_topic_by_confidence(user_id: int, topic_ids: List[int]) -> Optional[int]:
    """
    Select a topic weighted by inverse confidence (lower confidence = higher priority).
    
    Args:
        user_id: ID of the user
        topic_ids: List of topic IDs to choose from
    
    Returns:
        Selected topic ID or None
    """
    # Get progress for all topics
    progress_records = TopicProgress.query.filter(
        TopicProgress.user_id == user_id,
        TopicProgress.topic_id.in_(topic_ids)
    ).all()
    
    # Create progress dict
    progress_map = {p.topic_id: p for p in progress_records}
    
    # Calculate weights (inverse confidence)
    weights = []
    valid_topics = []
    
    for topic_id in topic_ids:
        progress = progress_map.get(topic_id)
        
        if progress:
            # Inverse confidence: lower confidence = higher weight
            # Add 0.1 to avoid zero weight
            confidence = progress.current_confidence
            weight = (1.0 - confidence) + 0.1
            
            # Boost weight for topics not practiced recently
            if progress.last_practiced:
                days_since = (datetime.utcnow() - progress.last_practiced).days
                time_boost = min(days_since / SpacedRepetitionConfig.TIME_DECAY_DAYS, 1.0)
                weight *= (1.0 + time_boost)
        else:
            # No progress yet - high priority for new topics
            weight = 2.0
        
        weights.append(weight)
        valid_topics.append(topic_id)
    
    if not valid_topics:
        return None
    
    # Weighted random selection
    total_weight = sum(weights)
    normalized_weights = [w / total_weight for w in weights]
    
    selected_topic = random.choices(valid_topics, weights=normalized_weights, k=1)[0]
    return selected_topic


def _get_new_problem(
    user_id: int,
    topic_id: int,
    exclude_problem_ids: List[int]
) -> Optional[Problem]:
    """
    Get a problem the user has never attempted.
    
    Args:
        user_id: ID of the user
        topic_id: ID of the topic
        exclude_problem_ids: List of problem IDs to exclude
    
    Returns:
        Problem or None
    """
    # Get all problem IDs the user has attempted
    attempted_problem_ids = db.session.query(ProblemAttempt.problem_id).join(
        PracticeSession
    ).filter(
        PracticeSession.user_id == user_id,
        ProblemAttempt.problem_id == Problem.id,
        Problem.topic_id == topic_id
    ).distinct().all()
    
    attempted_problem_ids = [pid[0] for pid in attempted_problem_ids]
    all_excluded = list(set(exclude_problem_ids + attempted_problem_ids))
    
    # Get a problem not yet attempted
    problem = Problem.query.filter(
        Problem.topic_id == topic_id,
        ~Problem.id.in_(all_excluded) if all_excluded else True
    ).order_by(func.random()).first()
    
    return problem


def _get_review_problem(
    user_id: int,
    topic_id: int,
    exclude_problem_ids: List[int]
) -> Optional[Problem]:
    """
    Get a problem for review, prioritizing incorrect answers and old attempts.
    
    Args:
        user_id: ID of the user
        topic_id: ID of the topic
        exclude_problem_ids: List of problem IDs to exclude
    
    Returns:
        Problem or None
    """
    # Subquery for latest attempt per problem
    latest_attempts = db.session.query(
        ProblemAttempt.problem_id,
        func.max(ProblemAttempt.attempted_at).label('last_attempt'),
        func.count(ProblemAttempt.id).label('attempt_count'),
        func.sum(func.cast(ProblemAttempt.is_correct, db.Integer)).label('correct_count')
    ).join(
        PracticeSession
    ).filter(
        PracticeSession.user_id == user_id,
        ProblemAttempt.problem_id == Problem.id,
        Problem.topic_id == topic_id,
        ~ProblemAttempt.problem_id.in_(exclude_problem_ids) if exclude_problem_ids else True
    ).group_by(
        ProblemAttempt.problem_id
    ).subquery()
    
    # Get problems with their attempt stats
    problems_with_stats = db.session.query(
        Problem,
        latest_attempts.c.last_attempt,
        latest_attempts.c.attempt_count,
        latest_attempts.c.correct_count
    ).join(
        latest_attempts,
        Problem.id == latest_attempts.c.problem_id
    ).filter(
        Problem.topic_id == topic_id
    ).all()
    
    if not problems_with_stats:
        return None
    
    # Filter out problems attempted too recently
    min_time = datetime.utcnow() - timedelta(
        minutes=SpacedRepetitionConfig.MIN_REPEAT_INTERVAL
    )
    eligible_problems = [
        (p, last_attempt, attempt_count, correct_count)
        for p, last_attempt, attempt_count, correct_count in problems_with_stats
        if last_attempt < min_time
    ]
    
    if not eligible_problems:
        return None
    
    # Calculate priority scores
    scored_problems = []
    for problem, last_attempt, attempt_count, correct_count in eligible_problems:
        # Base score: incorrect answers get higher priority
        incorrect_count = attempt_count - (correct_count or 0)
        score = incorrect_count * 2.0
        
        # Time factor: older attempts get higher priority
        days_since = (datetime.utcnow() - last_attempt).days
        time_factor = min(days_since / SpacedRepetitionConfig.TIME_DECAY_DAYS, 1.0)
        score *= (1.0 + time_factor)
        
        # If never answered correctly, boost priority
        if correct_count == 0:
            score *= 1.5
        
        scored_problems.append((problem, score))
    
    # Weight-based selection
    problems = [p for p, _ in scored_problems]
    scores = [s for _, s in scored_problems]
    total_score = sum(scores)
    
    if total_score == 0:
        return random.choice(problems)
    
    weights = [s / total_score for s in scores]
    selected_problem = random.choices(problems, weights=weights, k=1)[0]
    
    return selected_problem


def update_confidence(
    user_id: int,
    topic_id: int,
    was_correct: bool,
    user_confidence: Optional[int] = None
) -> TopicProgress:
    """
    Update topic confidence using exponential moving average.
    
    Args:
        user_id: ID of the user
        topic_id: ID of the topic
        was_correct: Whether the answer was correct
        user_confidence: User's self-reported confidence (1-3)
    
    Returns:
        Updated TopicProgress object
    """
    # Get or create progress record
    progress = TopicProgress.query.filter_by(
        user_id=user_id,
        topic_id=topic_id
    ).first()
    
    if not progress:
        progress = TopicProgress(
            user_id=user_id,
            topic_id=topic_id,
            problems_attempted=0,
            problems_correct=0,
            current_confidence=0.0,
            mastered=False
        )
        db.session.add(progress)
    
    # Update attempt counts
    progress.problems_attempted += 1
    if was_correct:
        progress.problems_correct += 1
    
    # Calculate confidence change
    if was_correct:
        confidence_change = SpacedRepetitionConfig.CONFIDENCE_BOOST_CORRECT
    else:
        confidence_change = -SpacedRepetitionConfig.CONFIDENCE_PENALTY_INCORRECT
    
    # Apply user confidence weight if provided
    if user_confidence and user_confidence in SpacedRepetitionConfig.USER_CONFIDENCE_WEIGHTS:
        weight = SpacedRepetitionConfig.USER_CONFIDENCE_WEIGHTS[user_confidence]
        confidence_change *= weight
    
    # Apply exponential moving average
    alpha = SpacedRepetitionConfig.EMA_ALPHA
    old_confidence = progress.current_confidence
    new_confidence = old_confidence + alpha * confidence_change
    
    # Clamp between 0 and 1
    progress.current_confidence = max(0.0, min(1.0, new_confidence))
    
    # Update mastery status
    if progress.current_confidence >= SpacedRepetitionConfig.MASTERY_THRESHOLD:
        progress.mastered = True
    else:
        progress.mastered = False
    
    # Update last practiced time
    progress.last_practiced = datetime.utcnow()
    
    db.session.commit()
    
    return progress


def get_topic_weights(user_id: int, topic_ids: List[int]) -> dict:
    """
    Get the selection weights for topics (for debugging/visualization).
    
    Args:
        user_id: ID of the user
        topic_ids: List of topic IDs
    
    Returns:
        Dictionary mapping topic_id to selection weight
    """
    progress_records = TopicProgress.query.filter(
        TopicProgress.user_id == user_id,
        TopicProgress.topic_id.in_(topic_ids)
    ).all()
    
    progress_map = {p.topic_id: p for p in progress_records}
    weights = {}
    
    for topic_id in topic_ids:
        progress = progress_map.get(topic_id)
        
        if progress:
            confidence = progress.current_confidence
            weight = (1.0 - confidence) + 0.1
            
            if progress.last_practiced:
                days_since = (datetime.utcnow() - progress.last_practiced).days
                time_boost = min(days_since / SpacedRepetitionConfig.TIME_DECAY_DAYS, 1.0)
                weight *= (1.0 + time_boost)
        else:
            weight = 2.0
        
        weights[topic_id] = weight
    
    return weights
