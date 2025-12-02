from flask import jsonify, request
from app.api import api_bp
from app import db
from app.models import PracticeSession, ProblemAttempt, TopicProgress, User, StudyGuide, Problem, Topic
from datetime import datetime


@api_bp.route('/practice-sessions', methods=['GET'])
def get_practice_sessions():
    """Get practice sessions, optionally filtered by user"""
    user_id = request.args.get('user_id', type=int)
    
    if user_id:
        sessions = PracticeSession.query.filter_by(user_id=user_id).order_by(
            PracticeSession.started_at.desc()
        ).all()
    else:
        sessions = PracticeSession.query.order_by(PracticeSession.started_at.desc()).all()
    
    return jsonify([session.to_dict() for session in sessions]), 200


@api_bp.route('/practice-sessions/<int:session_id>', methods=['GET'])
def get_practice_session(session_id):
    """Get a specific practice session"""
    include_attempts = request.args.get('include_attempts', 'false').lower() == 'true'
    session = PracticeSession.query.get_or_404(session_id)
    return jsonify(session.to_dict(include_attempts=include_attempts)), 200


@api_bp.route('/practice-sessions', methods=['POST'])
def create_practice_session():
    """Start a new practice session"""
    data = request.get_json()
    
    if not data or not data.get('user_id') or not data.get('study_guide_id'):
        return jsonify({'error': 'user_id and study_guide_id are required'}), 400
    
    # Verify user and study guide exist
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    study_guide = StudyGuide.query.get(data['study_guide_id'])
    if not study_guide:
        return jsonify({'error': 'Study guide not found'}), 404
    
    session = PracticeSession(
        user_id=data['user_id'],
        study_guide_id=data['study_guide_id']
    )
    db.session.add(session)
    db.session.commit()
    
    return jsonify(session.to_dict()), 201


@api_bp.route('/practice-sessions/<int:session_id>/end', methods=['PUT'])
def end_practice_session(session_id):
    """End a practice session"""
    session = PracticeSession.query.get_or_404(session_id)
    
    if session.ended_at:
        return jsonify({'error': 'Session already ended'}), 400
    
    session.ended_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(session.to_dict(include_attempts=True)), 200


@api_bp.route('/practice-sessions/<int:session_id>', methods=['DELETE'])
def delete_practice_session(session_id):
    """Delete a practice session"""
    session = PracticeSession.query.get_or_404(session_id)
    db.session.delete(session)
    db.session.commit()
    return jsonify({'message': 'Practice session deleted successfully'}), 200


@api_bp.route('/problem-attempts', methods=['POST'])
def create_problem_attempt():
    """Record a problem attempt"""
    data = request.get_json()
    
    required_fields = ['session_id', 'problem_id', 'user_answer', 'is_correct']
    if not data or not all(field in data for field in required_fields):
        return jsonify({'error': f'Required fields: {", ".join(required_fields)}'}), 400
    
    # Verify session and problem exist
    session = PracticeSession.query.get(data['session_id'])
    if not session:
        return jsonify({'error': 'Practice session not found'}), 404
    
    problem = Problem.query.get(data['problem_id'])
    if not problem:
        return jsonify({'error': 'Problem not found'}), 404
    
    # Validate confidence rating
    confidence = data.get('confidence_rating')
    if confidence is not None and (confidence < 1 or confidence > 3):
        return jsonify({'error': 'Confidence rating must be between 1 and 3'}), 400
    
    attempt = ProblemAttempt(
        session_id=data['session_id'],
        problem_id=data['problem_id'],
        user_answer=data['user_answer'],
        is_correct=data['is_correct'],
        confidence_rating=confidence,
        feedback=data.get('feedback')
    )
    db.session.add(attempt)
    
    # Update topic progress
    topic = problem.topic
    progress = TopicProgress.query.filter_by(
        user_id=session.user_id,
        topic_id=topic.id
    ).first()
    
    if not progress:
        progress = TopicProgress(
            user_id=session.user_id,
            topic_id=topic.id,
            problems_attempted=0,
            problems_correct=0,
            current_confidence=0.0
        )
        db.session.add(progress)
    
    progress.problems_attempted += 1
    if data['is_correct']:
        progress.problems_correct += 1
    progress.last_practiced = datetime.utcnow()
    
    # Update confidence (simple weighted average)
    if confidence:
        confidence_score = confidence / 3.0  # Normalize to 0-1
        if progress.current_confidence == 0:
            progress.current_confidence = confidence_score
        else:
            # Weighted average: 70% old, 30% new
            progress.current_confidence = (progress.current_confidence * 0.7) + (confidence_score * 0.3)
    
    # Check mastery (e.g., 80% accuracy and confidence > 0.7)
    accuracy = progress.problems_correct / progress.problems_attempted
    if accuracy >= 0.8 and progress.current_confidence >= 0.7 and progress.problems_attempted >= 5:
        progress.mastered = True
    
    db.session.commit()
    
    return jsonify(attempt.to_dict()), 201


@api_bp.route('/topic-progress', methods=['GET'])
def get_topic_progress():
    """Get topic progress for a user"""
    user_id = request.args.get('user_id', type=int)
    topic_id = request.args.get('topic_id', type=int)
    
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    
    query = TopicProgress.query.filter_by(user_id=user_id)
    
    if topic_id:
        progress = query.filter_by(topic_id=topic_id).first_or_404()
        return jsonify(progress.to_dict()), 200
    else:
        progress_list = query.all()
        return jsonify([p.to_dict() for p in progress_list]), 200
