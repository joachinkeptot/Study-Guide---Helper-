from flask import jsonify, request
from app.api import api_bp
from app import db
from app.models import StudyGuide, User


@api_bp.route('/study-guides', methods=['GET'])
def get_study_guides():
    """Get all study guides, optionally filtered by user"""
    user_id = request.args.get('user_id', type=int)
    
    if user_id:
        study_guides = StudyGuide.query.filter_by(user_id=user_id).all()
    else:
        study_guides = StudyGuide.query.all()
    
    return jsonify([sg.to_dict() for sg in study_guides]), 200


@api_bp.route('/study-guides/<int:guide_id>', methods=['GET'])
def get_study_guide(guide_id):
    """Get a specific study guide"""
    include_topics = request.args.get('include_topics', 'false').lower() == 'true'
    study_guide = StudyGuide.query.get_or_404(guide_id)
    return jsonify(study_guide.to_dict(include_topics=include_topics)), 200


@api_bp.route('/study-guides', methods=['POST'])
def create_study_guide():
    """Create a new study guide"""
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('user_id'):
        return jsonify({'error': 'Title and user_id are required'}), 400
    
    # Verify user exists
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    study_guide = StudyGuide(
        title=data['title'],
        user_id=data['user_id'],
        original_filename=data.get('original_filename'),
        parsed_content=data.get('parsed_content')
    )
    db.session.add(study_guide)
    db.session.commit()
    
    return jsonify(study_guide.to_dict()), 201


@api_bp.route('/study-guides/<int:guide_id>', methods=['PUT'])
def update_study_guide(guide_id):
    """Update a study guide"""
    study_guide = StudyGuide.query.get_or_404(guide_id)
    data = request.get_json()
    
    if data.get('title'):
        study_guide.title = data['title']
    if data.get('original_filename') is not None:
        study_guide.original_filename = data['original_filename']
    if data.get('parsed_content') is not None:
        study_guide.parsed_content = data['parsed_content']
    
    db.session.commit()
    return jsonify(study_guide.to_dict()), 200


@api_bp.route('/study-guides/<int:guide_id>', methods=['DELETE'])
def delete_study_guide(guide_id):
    """Delete a study guide"""
    study_guide = StudyGuide.query.get_or_404(guide_id)
    db.session.delete(study_guide)
    db.session.commit()
    return jsonify({'message': 'Study guide deleted successfully'}), 200
