"""
Practice routes - Start sessions, get problems, submit answers, track progress.
"""

from flask import request, jsonify, current_app
from datetime import datetime
import random

from app import db
from app.models import (
    StudyGuide, Topic, Problem, PracticeSession, 
    ProblemAttempt, TopicProgress
)
from app.routes import api_bp
from app.routes.auth import token_required
from app.services.llm_adapter import get_default_provider


@api_bp.route('/practice/start', methods=['POST'])
@token_required
def start_practice_session(current_user):
    """
    Start a new practice session.
    
    Expected JSON:
    {
        "guide_id": 1,
        "topic_ids": [1, 2, 3]  // optional, if omitted uses all topics
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        guide_id = data.get('guide_id')
        topic_ids = data.get('topic_ids')
        
        if not guide_id:
            return jsonify({'error': 'guide_id is required'}), 400
        
        # Verify guide belongs to user
        guide = StudyGuide.query.filter_by(id=guide_id, user_id=current_user.id).first()
        if not guide:
            return jsonify({'error': 'Study guide not found'}), 404
        
        # Create session
        session = PracticeSession(
            user_id=current_user.id,
            study_guide_id=guide_id
        )
        
        db.session.add(session)
        db.session.commit()

        # Auto-generate problems if none exist for the guide's topics
        try:
            topics = Topic.query.filter_by(study_guide_id=guide_id).all()
            # If the guide has no topics yet, create a default topic to enable practice
            if not topics:
                default_topic = Topic(
                    study_guide_id=guide_id,
                    name=guide.title or "General",
                    description="Auto-created topic from study guide",
                    order_index=0
                )
                db.session.add(default_topic)
                db.session.commit()
                topics = [default_topic]

            total_existing = sum(t.problems.count() for t in topics)
            if total_existing == 0 and topics:
                # Try LLM generation first
                try:
                    llm_provider = get_default_provider()
                    for topic in topics:
                        generated = llm_provider.generate_problems(
                            topic=topic.name,
                            num_problems=5,
                            difficulty="intermediate"
                        )
                        for gp in generated:
                            problem_type_str = gp.get("type", "multiple_choice")
                            from app.models import Problem, ProblemType
                            try:
                                problem_type = ProblemType(problem_type_str)
                            except Exception:
                                problem_type = ProblemType.MULTIPLE_CHOICE

                            options = gp.get("options") if problem_type == ProblemType.MULTIPLE_CHOICE else None
                            hints = gp.get("hints") or []

                            p = Problem(
                                topic_id=topic.id,
                                question_text=gp.get("question") or gp.get("prompt") or "",
                                problem_type=problem_type,
                                options=options,
                                correct_answer=gp.get("correct_answer") or "",
                                explanation=gp.get("explanation") or None,
                                hints=hints,
                            )
                            if p.question_text and p.correct_answer:
                                db.session.add(p)
                    db.session.commit()
                except Exception as llm_err:
                    current_app.logger.warning(f"LLM generation unavailable, using fallback: {llm_err}")
                    # Fallback: generate simple problems from raw_text
                    from app.models import Problem, ProblemType
                    sg: StudyGuide = StudyGuide.query.get(guide_id)
                    raw_text = None
                    if sg and sg.parsed_content and isinstance(sg.parsed_content, dict):
                        raw_text = sg.parsed_content.get("raw_text")

                    # Basic heuristic: create 5 recall questions per topic using sentences
                    base_sentences = []
                    if raw_text:
                        # Split by lines and filter reasonable length
                        lines = [l.strip() for l in raw_text.splitlines()]
                        base_sentences = [l for l in lines if 30 <= len(l) <= 200][:50]

                    for topic in topics:
                        created = 0
                        idx = 0
                        while created < 5 and idx < len(base_sentences):
                            sentence = base_sentences[idx]
                            idx += 1
                            if not sentence:
                                continue
                            question = f"Recall: {sentence}"
                            # Simple multiple-choice with one correct answer and 3 distractors
                            correct = "True"
                            options = ["True", "False", "Not sure", "Skip"]
                            hints = [
                                "Focus on the key phrase in the statement.",
                                "Consider if the statement matches what you studied.",
                                "Break the sentence into parts and verify each part."
                            ]
                            p = Problem(
                                topic_id=topic.id,
                                question_text=question,
                                problem_type=ProblemType.MULTIPLE_CHOICE,
                                options=options,
                                correct_answer=correct,
                                explanation="This is a simple recall check from the uploaded guide.",
                                hints=hints,
                            )
                            db.session.add(p)
                            created += 1
                        # If no text, create generic math/stat placeholder questions
                        if created == 0:
                            placeholders = [
                                ("What is the definition of the main concept?", "It depends on the topic."),
                                ("Choose the correct formula application.", "True"),
                                ("Identify the correct method to solve the problem.", "True"),
                                ("Select the correct property used here.", "True"),
                                ("Is the following statement correct?", "True"),
                            ]
                            for q, ans in placeholders:
                                hints = [
                                    "Recall the concept from your notes.",
                                    "Think of a worked example.",
                                    "Match the method to the problem type."
                                ]
                                p = Problem(
                                    topic_id=topic.id,
                                    question_text=q,
                                    problem_type=ProblemType.MULTIPLE_CHOICE,
                                    options=["True", "False", "Unsure", "Skip"],
                                    correct_answer=ans,
                                    explanation="Generic practice placeholder.",
                                    hints=hints,
                                )
                                db.session.add(p)
                    db.session.commit()
        except Exception as gen_err:
            current_app.logger.warning(f"Problem generation skipped: {gen_err}")
        
        return jsonify({
            'message': 'Practice session started',
            'session': session.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Start session error: {str(e)}")
        return jsonify({'error': 'An error occurred while starting the session'}), 500


@api_bp.route('/practice/next-problem', methods=['GET'])
@token_required
def get_next_problem(current_user):
    """
    Get the next problem for practice (weighted by confidence).
    
    Query parameters:
    - session_id: Active session ID
    - topic_ids: (optional) Comma-separated topic IDs to filter
    """
    try:
        session_id = request.args.get('session_id', type=int)
        
        if not session_id:
            return jsonify({'error': 'session_id is required'}), 400
        
        # Verify session belongs to user
        session = PracticeSession.query.filter_by(
            id=session_id, 
            user_id=current_user.id
        ).first()
        
        if not session:
            return jsonify({'error': 'Practice session not found'}), 404
        
        if session.ended_at:
            return jsonify({'error': 'This session has already ended'}), 400
        
        # Get topic IDs to filter
        topic_ids_param = request.args.get('topic_ids')
        if topic_ids_param:
            try:
                topic_ids = [int(id.strip()) for id in topic_ids_param.split(',')]
            except ValueError:
                return jsonify({'error': 'Invalid topic_ids format'}), 400
        else:
            # Get all topics for this guide
            topics = Topic.query.filter_by(study_guide_id=session.study_guide_id).all()
            topic_ids = [t.id for t in topics]
        
        # Get problems from selected topics
        problems = Problem.query.filter(Problem.topic_id.in_(topic_ids)).all()
        
        if not problems:
            return jsonify({'error': 'No problems available for selected topics'}), 404
        
        # Get problems already attempted in this session
        attempted_problem_ids = [
            attempt.problem_id 
            for attempt in session.problem_attempts
        ]
        
        # Filter out already attempted problems
        available_problems = [p for p in problems if p.id not in attempted_problem_ids]
        
        # If all problems attempted, allow repeating with lower weight
        if not available_problems:
            available_problems = problems
        
        # Weight problems by user's confidence (lower confidence = higher weight)
        weighted_problems = []
        for problem in available_problems:
            # Get topic progress
            topic_progress = TopicProgress.query.filter_by(
                user_id=current_user.id,
                topic_id=problem.topic_id
            ).first()
            
            # Weight: problems from low-confidence topics appear more often
            if topic_progress:
                weight = max(1, int((1 - topic_progress.current_confidence) * 10))
            else:
                weight = 5  # Default weight for new topics
            
            weighted_problems.extend([problem] * weight)
        
        # Select random problem
        selected_problem = random.choice(weighted_problems)
        
        return jsonify({
            'problem': selected_problem.to_dict(include_answer=False, include_hints=True),
            'session_id': session_id
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get next problem error: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching the problem'}), 500


@api_bp.route('/practice/submit', methods=['POST'])
@token_required
def submit_answer(current_user):
    """
    Submit an answer and get feedback.
    
    Expected JSON:
    {
        "session_id": 1,
        "problem_id": 1,
        "answer": "user's answer"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        session_id = data.get('session_id')
        problem_id = data.get('problem_id')
        user_answer = data.get('answer', '').strip()
        
        if not session_id or not problem_id:
            return jsonify({'error': 'session_id and problem_id are required'}), 400
        
        # Verify session
        session = PracticeSession.query.filter_by(
            id=session_id,
            user_id=current_user.id
        ).first()
        
        if not session:
            return jsonify({'error': 'Practice session not found'}), 404
        
        if session.ended_at:
            return jsonify({'error': 'This session has already ended'}), 400
        
        # Get problem
        problem = Problem.query.get(problem_id)
        if not problem:
            return jsonify({'error': 'Problem not found'}), 404
        
        # Evaluate answer using LLM
        try:
            llm_provider = get_default_provider()
            evaluation = llm_provider.evaluate_answer(
                problem=problem.question_text,
                user_answer=user_answer,
                correct_answer=problem.correct_answer
            )
            
            is_correct = evaluation.get('is_correct', False)
            feedback = evaluation.get('feedback', 'No feedback available')
            score = evaluation.get('score', 0)
            
        except Exception as llm_error:
            current_app.logger.warning(f"LLM evaluation error: {str(llm_error)}")
            # Fallback to simple comparison
            is_correct = user_answer.lower().strip() == problem.correct_answer.lower().strip()
            feedback = f"{'Correct!' if is_correct else 'Incorrect.'} The correct answer is: {problem.correct_answer}"
            score = 100 if is_correct else 0
        
        # Record attempt
        attempt = ProblemAttempt(
            session_id=session_id,
            problem_id=problem_id,
            user_answer=user_answer,
            is_correct=is_correct,
            feedback=feedback
        )
        
        db.session.add(attempt)
        
        # Update topic progress
        topic_progress = TopicProgress.query.filter_by(
            user_id=current_user.id,
            topic_id=problem.topic_id
        ).first()
        
        if not topic_progress:
            topic_progress = TopicProgress(
                user_id=current_user.id,
                topic_id=problem.topic_id
            )
            db.session.add(topic_progress)
        
        topic_progress.problems_attempted += 1
        if is_correct:
            topic_progress.problems_correct += 1
        
        # Update confidence (weighted average)
        new_confidence = 1.0 if is_correct else 0.0
        if topic_progress.problems_attempted == 1:
            topic_progress.current_confidence = new_confidence
        else:
            # Exponential moving average with alpha=0.3
            topic_progress.current_confidence = (
                0.7 * topic_progress.current_confidence + 0.3 * new_confidence
            )
        
        topic_progress.last_practiced = datetime.utcnow()
        
        # Check if mastered (>80% accuracy and >5 attempts)
        if topic_progress.problems_attempted >= 5:
            accuracy = topic_progress.problems_correct / topic_progress.problems_attempted
            topic_progress.mastered = accuracy >= 0.8
        
        db.session.commit()
        
        return jsonify({
            'message': 'Answer submitted successfully',
            'attempt': attempt.to_dict(),
            'is_correct': is_correct,
            'feedback': feedback,
            'score': score,
            'correct_answer': problem.correct_answer if not is_correct else None,
            'explanation': problem.explanation,
            'topic_progress': topic_progress.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Submit answer error: {str(e)}")
        return jsonify({'error': 'An error occurred while submitting the answer'}), 500


@api_bp.route('/practice/end', methods=['POST'])
@token_required
def end_practice_session(current_user):
    """
    End a practice session and get summary.
    
    Expected JSON:
    {
        "session_id": 1
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'session_id is required'}), 400
        
        # Verify session
        session = PracticeSession.query.filter_by(
            id=session_id,
            user_id=current_user.id
        ).first()
        
        if not session:
            return jsonify({'error': 'Practice session not found'}), 404
        
        if session.ended_at:
            return jsonify({'error': 'This session has already ended'}), 400
        
        # End session
        session.ended_at = datetime.utcnow()
        
        # Calculate summary
        attempts = session.problem_attempts.all()
        total_attempts = len(attempts)
        correct_attempts = sum(1 for a in attempts if a.is_correct)
        
        # Get topic breakdown
        topic_stats = {}
        for attempt in attempts:
            topic_id = attempt.problem.topic_id
            if topic_id not in topic_stats:
                topic_stats[topic_id] = {
                    'topic_name': attempt.problem.topic.name,
                    'total': 0,
                    'correct': 0
                }
            topic_stats[topic_id]['total'] += 1
            if attempt.is_correct:
                topic_stats[topic_id]['correct'] += 1
        
        db.session.commit()
        
        return jsonify({
            'message': 'Practice session ended',
            'session': session.to_dict(include_attempts=True),
            'summary': {
                'total_problems': total_attempts,
                'correct_answers': correct_attempts,
                'accuracy': round(correct_attempts / total_attempts * 100, 2) if total_attempts > 0 else 0,
                'duration_minutes': round((session.ended_at - session.started_at).total_seconds() / 60, 2),
                'topic_breakdown': list(topic_stats.values())
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"End session error: {str(e)}")
        return jsonify({'error': 'An error occurred while ending the session'}), 500


@api_bp.route('/practice/confidence', methods=['POST'])
@token_required
def update_confidence(current_user):
    """
    Update confidence rating for a problem attempt.
    
    Expected JSON:
    {
        "attempt_id": 1,
        "confidence_rating": 3  // 1-3 scale
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        attempt_id = data.get('attempt_id')
        confidence_rating = data.get('confidence_rating')
        
        if not attempt_id or confidence_rating is None:
            return jsonify({'error': 'attempt_id and confidence_rating are required'}), 400
        
        if confidence_rating not in [1, 2, 3]:
            return jsonify({'error': 'confidence_rating must be 1, 2, or 3'}), 400
        
        # Get attempt
        attempt = ProblemAttempt.query.join(PracticeSession).filter(
            ProblemAttempt.id == attempt_id,
            PracticeSession.user_id == current_user.id
        ).first()
        
        if not attempt:
            return jsonify({'error': 'Attempt not found'}), 404
        
        # Update confidence
        attempt.confidence_rating = confidence_rating
        db.session.commit()
        
        return jsonify({
            'message': 'Confidence rating updated',
            'attempt': attempt.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Update confidence error: {str(e)}")
        return jsonify({'error': 'An error occurred while updating confidence'}), 500
