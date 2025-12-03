"""
Study guides routes - Upload, manage, and view study guides.
"""

from flask import request, jsonify, current_app
from werkzeug.utils import secure_filename
import os

from app import db
from app.models import StudyGuide, Topic, Problem, ProblemType
from app.routes import api_bp
from app.routes.auth import token_required
from app.services.document_parser import DocumentParser
from app.services.llm_adapter import get_default_provider


# Allowed file extensions
ALLOWED_EXTENSIONS = {'.pdf', '.txt', '.md', '.docx', '.doc', '.png', '.jpg', '.jpeg', '.tiff', '.bmp'}


def allowed_file(filename):
    """Check if file extension is allowed."""
    from pathlib import Path
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


@api_bp.route('/guides/upload', methods=['POST'])
@token_required
def upload_guide(current_user):
    """
    Upload and parse a study guide.
    
    Expected form-data:
    - file: The document file
    - title: (optional) Guide title, defaults to filename
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({
                'error': f'File type not supported. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
        
        # Get title
        title = request.form.get('title', '').strip()
        if not title:
            # Use filename without extension as title
            from pathlib import Path
            title = Path(file.filename).stem
        
        # Read file content
        file_content = file.read()
        filename = secure_filename(file.filename)
        
        # Parse document
        parser = DocumentParser()
        
        try:
            parsed_data = parser.parse_and_structure(
                file_content=file_content,
                filename=filename,
                use_llm=True
            )
        except Exception as parse_error:
            current_app.logger.error(f"Document parsing error: {str(parse_error)}")
            return jsonify({
                'error': 'Failed to parse document',
                'details': str(parse_error)
            }), 422
        
        # Create study guide
        study_guide = StudyGuide(
            user_id=current_user.id,
            title=title,
            original_filename=filename,
            parsed_content=parsed_data
        )
        
        db.session.add(study_guide)
        db.session.flush()  # Get the study_guide.id
        
        # Create topics from parsed data
        topics_data = parsed_data.get('topics', [])
        
        for idx, topic_data in enumerate(topics_data):
            topic = Topic(
                study_guide_id=study_guide.id,
                name=topic_data.get('name', f'Topic {idx + 1}'),
                description=topic_data.get('description', ''),
                order_index=idx
            )
            db.session.add(topic)
            db.session.flush()  # Get the topic.id
            
            # Generate problems for this topic using LLM
            try:
                llm_provider = get_default_provider()
                problems_list = llm_provider.generate_problems(
                    topic=topic.name,
                    num_problems=5,
                    difficulty=topic_data.get('difficulty', 'intermediate')
                )
                
                # Create problem records
                for problem_data in problems_list:
                    problem_type_str = problem_data.get('type', 'short_answer')
                    
                    # Map problem type string to enum
                    type_mapping = {
                        'multiple_choice': ProblemType.MULTIPLE_CHOICE,
                        'short_answer': ProblemType.SHORT_ANSWER,
                        'problem_solving': ProblemType.FREE_RESPONSE,
                        'free_response': ProblemType.FREE_RESPONSE
                    }
                    
                    problem_type = type_mapping.get(problem_type_str, ProblemType.SHORT_ANSWER)
                    
                    problem = Problem(
                        topic_id=topic.id,
                        question_text=problem_data.get('question', ''),
                        problem_type=problem_type,
                        options=problem_data.get('options'),
                        correct_answer=problem_data.get('correct_answer', ''),
                        explanation=problem_data.get('explanation', '')
                    )
                    db.session.add(problem)
                    
            except Exception as llm_error:
                current_app.logger.warning(f"Problem generation error for topic {topic.name}: {str(llm_error)}")
                # Continue without problems - they can be generated later
        
        db.session.commit()
        
        return jsonify({
            'message': 'Study guide uploaded and processed successfully',
            'guide': study_guide.to_dict(include_topics=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Upload guide error: {str(e)}")
        return jsonify({'error': 'An error occurred while processing the guide'}), 500


@api_bp.route('/guides', methods=['GET'])
@token_required
def list_guides(current_user):
    """
    List all study guides for the current user.
    
    Query parameters:
    - limit: Number of guides per page (default: 20)
    - offset: Offset for pagination (default: 0)
    """
    try:
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Validate pagination parameters
        if limit < 1 or limit > 100:
            limit = 20
        if offset < 0:
            offset = 0
        
        # Query guides
        guides_query = StudyGuide.query.filter_by(user_id=current_user.id).order_by(StudyGuide.created_at.desc())
        total_count = guides_query.count()
        guides = guides_query.limit(limit).offset(offset).all()
        
        return jsonify({
            'guides': [guide.to_dict() for guide in guides],
            'total': total_count,
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"List guides error: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching guides'}), 500


@api_bp.route('/guides/<int:guide_id>', methods=['GET'])
@token_required
def get_guide(current_user, guide_id):
    """
    Get a specific study guide with topics.
    """
    try:
        guide = StudyGuide.query.filter_by(id=guide_id, user_id=current_user.id).first()
        
        if not guide:
            return jsonify({'error': 'Study guide not found'}), 404
        
        return jsonify({
            'guide': guide.to_dict(include_topics=True)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get guide error: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching the guide'}), 500


@api_bp.route('/guides/<int:guide_id>', methods=['DELETE'])
@token_required
def delete_guide(current_user, guide_id):
    """
    Delete a study guide and all associated data.
    """
    try:
        guide = StudyGuide.query.filter_by(id=guide_id, user_id=current_user.id).first()
        
        if not guide:
            return jsonify({'error': 'Study guide not found'}), 404
        
        db.session.delete(guide)
        db.session.commit()
        
        return jsonify({'message': 'Study guide deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Delete guide error: {str(e)}")
        return jsonify({'error': 'An error occurred while deleting the guide'}), 500


@api_bp.route('/guides/<int:guide_id>/topics', methods=['POST'])
@token_required
def add_topic_to_guide(current_user, guide_id):
    """
    Manually add a topic to a study guide.
    
    Expected JSON:
    {
        "name": "Topic Name",
        "description": "Optional description",
        "generate_problems": true  // Optional, default false
    }
    """
    try:
        # Verify guide belongs to user
        guide = StudyGuide.query.filter_by(id=guide_id, user_id=current_user.id).first()
        
        if not guide:
            return jsonify({'error': 'Study guide not found'}), 404
        
        data = request.get_json()
        
        if not data or not data.get('name'):
            return jsonify({'error': 'Topic name is required'}), 400
        
        # Get max order index for this guide
        max_order = db.session.query(db.func.max(Topic.order_index)).filter_by(
            study_guide_id=guide_id
        ).scalar()
        
        # Create topic
        topic = Topic(
            study_guide_id=guide_id,
            name=data['name'].strip(),
            description=data.get('description', '').strip(),
            order_index=(max_order or 0) + 1
        )
        
        db.session.add(topic)
        db.session.flush()  # Get topic.id
        
        # Optionally generate problems for this topic
        if data.get('generate_problems', False):
            try:
                llm_provider = get_default_provider()
                
                # Use guide's parsed content for context if available
                context = ""
                if guide.parsed_content and guide.parsed_content.get('raw_text'):
                    context = guide.parsed_content.get('raw_text', '')[:2000]
                
                # Generate problems with context
                difficulty = data.get('difficulty', 'intermediate')
                problems_list = llm_provider.generate_problems(
                    topic=f"{topic.name}\n\nContext: {context}",
                    num_problems=data.get('num_problems', 5),
                    difficulty=difficulty
                )
                
                # Create problem records
                for problem_data in problems_list:
                    problem_type_str = problem_data.get('type', 'short_answer')
                    
                    type_mapping = {
                        'multiple_choice': ProblemType.MULTIPLE_CHOICE,
                        'short_answer': ProblemType.SHORT_ANSWER,
                        'problem_solving': ProblemType.FREE_RESPONSE,
                        'free_response': ProblemType.FREE_RESPONSE
                    }
                    
                    problem_type = type_mapping.get(problem_type_str, ProblemType.SHORT_ANSWER)
                    
                    problem = Problem(
                        topic_id=topic.id,
                        question_text=problem_data.get('question', ''),
                        problem_type=problem_type,
                        options=problem_data.get('options'),
                        correct_answer=problem_data.get('correct_answer', ''),
                        explanation=problem_data.get('explanation', ''),
                        hints=problem_data.get('hints', [])
                    )
                    db.session.add(problem)
                    
            except Exception as llm_error:
                current_app.logger.warning(f"Problem generation error: {str(llm_error)}")
                # Continue without problems
        
        db.session.commit()
        
        return jsonify({
            'message': 'Topic added successfully',
            'topic': topic.to_dict(include_problems=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Add topic error: {str(e)}")
        return jsonify({'error': 'An error occurred while adding the topic'}), 500
