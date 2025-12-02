from flask import jsonify, request
from app.api import api_bp
from app import db
from app.models import Problem, Topic, ProblemType


@api_bp.route('/problems', methods=['GET'])
def get_problems():
    """Get all problems, optionally filtered by topic"""
    topic_id = request.args.get('topic_id', type=int)
    
    if topic_id:
        problems = Problem.query.filter_by(topic_id=topic_id).all()
    else:
        problems = Problem.query.all()
    
    # Include answer only if requested
    include_answer = request.args.get('include_answer', 'false').lower() == 'true'
    return jsonify([problem.to_dict(include_answer=include_answer) for problem in problems]), 200


@api_bp.route('/problems/<int:problem_id>', methods=['GET'])
def get_problem(problem_id):
    """Get a specific problem"""
    include_answer = request.args.get('include_answer', 'false').lower() == 'true'
    problem = Problem.query.get_or_404(problem_id)
    return jsonify(problem.to_dict(include_answer=include_answer)), 200


@api_bp.route('/problems', methods=['POST'])
def create_problem():
    """Create a new problem"""
    data = request.get_json()
    
    required_fields = ['question_text', 'problem_type', 'correct_answer', 'topic_id']
    if not data or not all(field in data for field in required_fields):
        return jsonify({'error': f'Required fields: {", ".join(required_fields)}'}), 400
    
    # Verify topic exists
    topic = Topic.query.get(data['topic_id'])
    if not topic:
        return jsonify({'error': 'Topic not found'}), 404
    
    # Validate problem type
    try:
        problem_type = ProblemType(data['problem_type'])
    except ValueError:
        valid_types = [pt.value for pt in ProblemType]
        return jsonify({'error': f'Invalid problem_type. Must be one of: {", ".join(valid_types)}'}), 400
    
    # Validate options for multiple choice
    if problem_type == ProblemType.MULTIPLE_CHOICE and not data.get('options'):
        return jsonify({'error': 'Options are required for multiple choice problems'}), 400
    
    problem = Problem(
        topic_id=data['topic_id'],
        question_text=data['question_text'],
        problem_type=problem_type,
        options=data.get('options'),
        correct_answer=data['correct_answer'],
        explanation=data.get('explanation')
    )
    db.session.add(problem)
    db.session.commit()
    
    return jsonify(problem.to_dict(include_answer=True)), 201


@api_bp.route('/problems/<int:problem_id>', methods=['PUT'])
def update_problem(problem_id):
    """Update a problem"""
    problem = Problem.query.get_or_404(problem_id)
    data = request.get_json()
    
    if data.get('question_text'):
        problem.question_text = data['question_text']
    if data.get('problem_type'):
        try:
            problem.problem_type = ProblemType(data['problem_type'])
        except ValueError:
            valid_types = [pt.value for pt in ProblemType]
            return jsonify({'error': f'Invalid problem_type. Must be one of: {", ".join(valid_types)}'}), 400
    if data.get('options') is not None:
        problem.options = data['options']
    if data.get('correct_answer'):
        problem.correct_answer = data['correct_answer']
    if data.get('explanation') is not None:
        problem.explanation = data['explanation']
    
    db.session.commit()
    return jsonify(problem.to_dict(include_answer=True)), 200


@api_bp.route('/problems/<int:problem_id>', methods=['DELETE'])
def delete_problem(problem_id):
    """Delete a problem"""
    problem = Problem.query.get_or_404(problem_id)
    db.session.delete(problem)
    db.session.commit()
    return jsonify({'message': 'Problem deleted successfully'}), 200
