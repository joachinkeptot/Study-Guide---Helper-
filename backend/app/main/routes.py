from flask import jsonify
from app.main import main_bp


@main_bp.route('/')
def index():
    """Root endpoint"""
    return jsonify({
        'message': 'Study Helper API',
        'version': '1.0.0',
        'status': 'active'
    })


@main_bp.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200
