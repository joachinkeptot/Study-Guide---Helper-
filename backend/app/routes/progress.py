"""
Progress tracking routes - View stats, history, and topic mastery.
"""

from flask import request, jsonify, current_app
from sqlalchemy import func, desc

from app import db
from app.models import (
    StudyGuide, Topic, Problem, PracticeSession,
    ProblemAttempt, TopicProgress
)
from app.routes import api_bp
from app.routes.auth import token_required


@api_bp.route('/progress/overview', methods=['GET'])
@token_required
def get_progress_overview(current_user):
    """
    Get overall progress statistics for the user.
    """
    try:
        # Total study guides
        total_guides = StudyGuide.query.filter_by(user_id=current_user.id).count()
        
        # Total practice sessions
        total_sessions = PracticeSession.query.filter_by(user_id=current_user.id).count()
        
        # Completed sessions
        completed_sessions = PracticeSession.query.filter(
            PracticeSession.user_id == current_user.id,
            PracticeSession.ended_at.isnot(None)
        ).count()
        
        # Total problems attempted
        total_attempts = ProblemAttempt.query.join(PracticeSession).filter(
            PracticeSession.user_id == current_user.id
        ).count()
        
        # Total correct answers
        correct_attempts = ProblemAttempt.query.join(PracticeSession).filter(
            PracticeSession.user_id == current_user.id,
            ProblemAttempt.is_correct == True
        ).count()
        
        # Overall accuracy
        overall_accuracy = round(correct_attempts / total_attempts * 100, 2) if total_attempts > 0 else 0
        
        # Topics mastered
        mastered_topics = TopicProgress.query.filter_by(
            user_id=current_user.id,
            mastered=True
        ).count()
        
        # Total topics
        total_topics = db.session.query(Topic).join(StudyGuide).filter(
            StudyGuide.user_id == current_user.id
        ).count()
        
        # Recent activity (last 7 days)
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        recent_sessions = PracticeSession.query.filter(
            PracticeSession.user_id == current_user.id,
            PracticeSession.started_at >= week_ago
        ).count()
        
        recent_problems = ProblemAttempt.query.join(PracticeSession).filter(
            PracticeSession.user_id == current_user.id,
            ProblemAttempt.attempted_at >= week_ago
        ).count()
        
        # Average session performance
        avg_session_accuracy = db.session.query(
            func.avg(
                func.cast(ProblemAttempt.is_correct, db.Integer)
            ) * 100
        ).join(PracticeSession).filter(
            PracticeSession.user_id == current_user.id
        ).scalar() or 0
        
        return jsonify({
            'overview': {
                'total_study_guides': total_guides,
                'total_practice_sessions': total_sessions,
                'completed_sessions': completed_sessions,
                'total_problems_attempted': total_attempts,
                'total_correct_answers': correct_attempts,
                'overall_accuracy': overall_accuracy,
                'topics_mastered': mastered_topics,
                'total_topics': total_topics,
                'mastery_percentage': round(mastered_topics / total_topics * 100, 2) if total_topics > 0 else 0,
                'recent_activity': {
                    'sessions_last_7_days': recent_sessions,
                    'problems_last_7_days': recent_problems
                },
                'average_session_accuracy': round(avg_session_accuracy, 2)
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Progress overview error: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching progress overview'}), 500


@api_bp.route('/progress/guide/<int:guide_id>', methods=['GET'])
@token_required
def get_guide_progress(current_user, guide_id):
    """
    Get progress per topic for a specific study guide.
    """
    try:
        # Verify guide belongs to user
        guide = StudyGuide.query.filter_by(
            id=guide_id,
            user_id=current_user.id
        ).first()
        
        if not guide:
            return jsonify({'error': 'Study guide not found'}), 404
        
        # Get topics with progress
        topics = Topic.query.filter_by(study_guide_id=guide_id).order_by(Topic.order_index).all()
        
        topic_progress_list = []
        for topic in topics:
            # Get progress record
            progress = TopicProgress.query.filter_by(
                user_id=current_user.id,
                topic_id=topic.id
            ).first()
            
            if progress:
                progress_data = progress.to_dict()
            else:
                progress_data = {
                    'id': None,
                    'user_id': current_user.id,
                    'topic_id': topic.id,
                    'problems_attempted': 0,
                    'problems_correct': 0,
                    'current_confidence': 0.0,
                    'mastered': False,
                    'last_practiced': None,
                    'accuracy': 0
                }
            
            # Add topic info
            progress_data['topic'] = {
                'id': topic.id,
                'name': topic.name,
                'description': topic.description,
                'problem_count': topic.problems.count()
            }
            
            topic_progress_list.append(progress_data)
        
        # Guide-level stats
        total_problems_attempted = sum(p['problems_attempted'] for p in topic_progress_list)
        total_problems_correct = sum(p['problems_correct'] for p in topic_progress_list)
        guide_accuracy = round(
            total_problems_correct / total_problems_attempted * 100, 2
        ) if total_problems_attempted > 0 else 0
        
        topics_mastered = sum(1 for p in topic_progress_list if p['mastered'])
        
        return jsonify({
            'guide': guide.to_dict(),
            'progress': {
                'topics': topic_progress_list,
                'overall_accuracy': guide_accuracy,
                'topics_mastered': topics_mastered,
                'total_topics': len(topics),
                'mastery_percentage': round(topics_mastered / len(topics) * 100, 2) if topics else 0
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Guide progress error: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching guide progress'}), 500


@api_bp.route('/progress/history', methods=['GET'])
@token_required
def get_practice_history(current_user):
    """
    Get recent practice sessions with stats.
    
    Query parameters:
    - limit: Number of sessions to return (default: 10)
    - offset: Offset for pagination (default: 0)
    """
    try:
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Validate pagination
        if limit < 1 or limit > 50:
            limit = 10
        if offset < 0:
            offset = 0
        
        # Get sessions
        sessions_query = PracticeSession.query.filter_by(
            user_id=current_user.id
        ).order_by(desc(PracticeSession.started_at))
        
        total_count = sessions_query.count()
        sessions = sessions_query.limit(limit).offset(offset).all()
        
        # Build session history
        history = []
        for session in sessions:
            attempts = session.problem_attempts.all()
            total_attempts = len(attempts)
            correct_attempts = sum(1 for a in attempts if a.is_correct)
            
            session_data = session.to_dict()
            session_data['guide'] = {
                'id': session.study_guide.id,
                'title': session.study_guide.title
            }
            session_data['stats'] = {
                'total_problems': total_attempts,
                'correct_answers': correct_attempts,
                'accuracy': round(correct_attempts / total_attempts * 100, 2) if total_attempts > 0 else 0
            }
            
            if session.ended_at:
                duration = (session.ended_at - session.started_at).total_seconds() / 60
                session_data['stats']['duration_minutes'] = round(duration, 2)
            
            history.append(session_data)
        
        return jsonify({
            'history': history,
            'total': total_count,
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Practice history error: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching practice history'}), 500
