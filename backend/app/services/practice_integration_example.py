"""
Example integration of problem_selector service with practice API endpoints.

This file demonstrates how to integrate the spaced repetition algorithm
into your practice session endpoints.
"""

from flask import Blueprint, request, jsonify
from app import db
from app.models import Problem, PracticeSession, ProblemAttempt
from app.services.problem_selector import (
    get_next_problem, 
    update_confidence,
    get_topic_weights
)

# Example blueprint (add to your existing api blueprint)
practice_api = Blueprint('practice_enhanced', __name__)


@practice_api.route('/practice/start-session', methods=['POST'])
def start_session():
    """
    Start a new practice session.
    
    Request body:
    {
        "user_id": 1,
        "study_guide_id": 5,
        "topic_ids": [10, 11, 12]  # Optional: specific topics
    }
    """
    data = request.json
    user_id = data['user_id']
    study_guide_id = data['study_guide_id']
    
    # Create new practice session
    session = PracticeSession(
        user_id=user_id,
        study_guide_id=study_guide_id
    )
    db.session.add(session)
    db.session.commit()
    
    # Get topic IDs if not provided
    topic_ids = data.get('topic_ids')
    if not topic_ids:
        from app.models import Topic
        topics = Topic.query.filter_by(study_guide_id=study_guide_id).all()
        topic_ids = [t.id for t in topics]
    
    # Get first problem
    result = get_next_problem(user_id, session.id, topic_ids)
    
    if not result:
        return jsonify({
            'session_id': session.id,
            'message': 'No problems available'
        }), 404
    
    problem, topic = result
    
    return jsonify({
        'session_id': session.id,
        'problem': problem.to_dict(),
        'topic': topic.to_dict(),
        'current_index': 1
    })


@practice_api.route('/practice/next-problem', methods=['POST'])
def next_problem():
    """
    Get the next problem in a practice session.
    
    Request body:
    {
        "user_id": 1,
        "session_id": 5,
        "topic_ids": [10, 11, 12]
    }
    """
    data = request.json
    user_id = data['user_id']
    session_id = data['session_id']
    topic_ids = data['topic_ids']
    
    # Get next problem using spaced repetition
    result = get_next_problem(user_id, session_id, topic_ids)
    
    if not result:
        return jsonify({
            'message': 'No more problems available for this session',
            'session_complete': True
        }), 200
    
    problem, topic = result
    
    # Get current progress count
    attempt_count = ProblemAttempt.query.filter_by(
        session_id=session_id
    ).count()
    
    return jsonify({
        'problem': problem.to_dict(),
        'topic': topic.to_dict(),
        'current_index': attempt_count + 1
    })


@practice_api.route('/practice/submit-answer', methods=['POST'])
def submit_answer():
    """
    Submit an answer and get feedback with updated confidence.
    
    Request body:
    {
        "user_id": 1,
        "session_id": 5,
        "problem_id": 100,
        "user_answer": "A",
        "confidence_rating": 3  # 1-3 scale (optional)
    }
    """
    data = request.json
    user_id = data['user_id']
    session_id = data['session_id']
    problem_id = data['problem_id']
    user_answer = data['user_answer']
    user_confidence = data.get('confidence_rating')
    
    # Validate confidence rating
    if user_confidence and user_confidence not in [1, 2, 3]:
        return jsonify({'error': 'confidence_rating must be 1, 2, or 3'}), 400
    
    # Get problem
    problem = Problem.query.get(problem_id)
    if not problem:
        return jsonify({'error': 'Problem not found'}), 404
    
    # Check answer
    is_correct = problem.correct_answer.strip().lower() == user_answer.strip().lower()
    
    # Generate feedback (could use LLM here)
    feedback = generate_feedback(problem, user_answer, is_correct)
    
    # Record attempt
    attempt = ProblemAttempt(
        session_id=session_id,
        problem_id=problem_id,
        user_answer=user_answer,
        is_correct=is_correct,
        confidence_rating=user_confidence,
        feedback=feedback
    )
    db.session.add(attempt)
    db.session.commit()
    
    # Update confidence using spaced repetition
    progress = update_confidence(
        user_id=user_id,
        topic_id=problem.topic_id,
        was_correct=is_correct,
        user_confidence=user_confidence
    )
    
    return jsonify({
        'is_correct': is_correct,
        'correct_answer': problem.correct_answer,
        'explanation': problem.explanation,
        'feedback': feedback,
        'topic_progress': {
            'confidence': round(progress.current_confidence * 100, 1),
            'mastered': progress.mastered,
            'problems_attempted': progress.problems_attempted,
            'problems_correct': progress.problems_correct,
            'accuracy': round(progress.problems_correct / progress.problems_attempted * 100, 1)
        }
    })


@practice_api.route('/practice/end-session', methods=['POST'])
def end_session():
    """
    End a practice session and return summary.
    
    Request body:
    {
        "session_id": 5
    }
    """
    from datetime import datetime
    
    data = request.json
    session_id = data['session_id']
    
    # Get session
    session = PracticeSession.query.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # End session
    session.ended_at = datetime.utcnow()
    db.session.commit()
    
    # Calculate summary
    attempts = ProblemAttempt.query.filter_by(session_id=session_id).all()
    
    total_problems = len(attempts)
    correct_answers = sum(1 for a in attempts if a.is_correct)
    accuracy = round(correct_answers / total_problems * 100, 1) if total_problems > 0 else 0
    
    duration_minutes = 0
    if session.ended_at and session.started_at:
        duration_minutes = (session.ended_at - session.started_at).seconds // 60
    
    return jsonify({
        'session_id': session_id,
        'summary': {
            'total_problems': total_problems,
            'correct_answers': correct_answers,
            'accuracy': accuracy,
            'duration_minutes': duration_minutes,
            'started_at': session.started_at.isoformat(),
            'ended_at': session.ended_at.isoformat()
        }
    })


@practice_api.route('/practice/topic-recommendations', methods=['GET'])
def topic_recommendations():
    """
    Get recommended topics based on user progress.
    
    Query params:
    - user_id: User ID
    - study_guide_id: Study guide ID
    """
    user_id = request.args.get('user_id', type=int)
    study_guide_id = request.args.get('study_guide_id', type=int)
    
    if not user_id or not study_guide_id:
        return jsonify({'error': 'user_id and study_guide_id required'}), 400
    
    # Get all topics for the study guide
    from app.models import Topic
    topics = Topic.query.filter_by(study_guide_id=study_guide_id).all()
    topic_ids = [t.id for t in topics]
    
    # Get topic weights (lower confidence = higher weight)
    weights = get_topic_weights(user_id, topic_ids)
    
    # Sort topics by weight (descending)
    sorted_topics = sorted(
        [(tid, weights.get(tid, 0)) for tid in topic_ids],
        key=lambda x: x[1],
        reverse=True
    )
    
    # Get topic details
    from app.models import TopicProgress
    recommendations = []
    for topic_id, weight in sorted_topics[:5]:  # Top 5
        topic = Topic.query.get(topic_id)
        progress = TopicProgress.query.filter_by(
            user_id=user_id,
            topic_id=topic_id
        ).first()
        
        recommendations.append({
            'topic': topic.to_dict(),
            'priority_score': round(weight, 2),
            'confidence': round(progress.current_confidence * 100, 1) if progress else 0,
            'mastered': progress.mastered if progress else False,
            'problems_available': topic.problems.count()
        })
    
    return jsonify({
        'recommendations': recommendations
    })


def generate_feedback(problem, user_answer, is_correct):
    """
    Generate feedback for a problem attempt.
    
    In production, this could use an LLM to generate personalized feedback.
    """
    if is_correct:
        return f"Correct! {problem.explanation}"
    else:
        return f"Incorrect. The correct answer is: {problem.correct_answer}. {problem.explanation}"


# Example of how to register this blueprint
# In your app/__init__.py or app/routes/__init__.py:
# 
# from app.services.practice_integration_example import practice_api
# app.register_blueprint(practice_api, url_prefix='/api')
