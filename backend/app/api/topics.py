from flask import jsonify, request
from app.api import api_bp
from app import db
from app.models import Topic, StudyGuide


@api_bp.route('/topics', methods=['GET'])
def get_topics():
    """Get all topics, optionally filtered by study guide"""
    study_guide_id = request.args.get('study_guide_id', type=int)
    
    if study_guide_id:
        topics = Topic.query.filter_by(study_guide_id=study_guide_id).order_by(Topic.order_index).all()
    else:
        topics = Topic.query.order_by(Topic.study_guide_id, Topic.order_index).all()
    
    return jsonify([topic.to_dict() for topic in topics]), 200


@api_bp.route('/topics/<int:topic_id>', methods=['GET'])
def get_topic(topic_id):
    """Get a specific topic"""
    include_problems = request.args.get('include_problems', 'false').lower() == 'true'
    topic = Topic.query.get_or_404(topic_id)
    return jsonify(topic.to_dict(include_problems=include_problems)), 200


@api_bp.route('/topics', methods=['POST'])
def create_topic():
    """Create a new topic"""
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('study_guide_id'):
        return jsonify({'error': 'Name and study_guide_id are required'}), 400
    
    # Verify study guide exists
    study_guide = StudyGuide.query.get(data['study_guide_id'])
    if not study_guide:
        return jsonify({'error': 'Study guide not found'}), 404
    
    # Auto-assign order_index if not provided
    if 'order_index' not in data:
        max_order = db.session.query(db.func.max(Topic.order_index)).filter_by(
            study_guide_id=data['study_guide_id']
        ).scalar()
        data['order_index'] = (max_order or 0) + 1
    
    topic = Topic(
        name=data['name'],
        study_guide_id=data['study_guide_id'],
        description=data.get('description'),
        order_index=data['order_index']
    )
    db.session.add(topic)
    db.session.commit()
    
    return jsonify(topic.to_dict()), 201


@api_bp.route('/topics/<int:topic_id>', methods=['PUT'])
def update_topic(topic_id):
    """Update a topic"""
    topic = Topic.query.get_or_404(topic_id)
    data = request.get_json()
    
    if data.get('name'):
        topic.name = data['name']
    if data.get('description') is not None:
        topic.description = data['description']
    if data.get('order_index') is not None:
        topic.order_index = data['order_index']
    
    db.session.commit()
    return jsonify(topic.to_dict()), 200


@api_bp.route('/topics/<int:topic_id>', methods=['DELETE'])
def delete_topic(topic_id):
    """Delete a topic"""
    topic = Topic.query.get_or_404(topic_id)
    db.session.delete(topic)
    db.session.commit()
    return jsonify({'message': 'Topic deleted successfully'}), 200
