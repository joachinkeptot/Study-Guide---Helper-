from flask import jsonify
from app.main import main_bp
from app.services.llm_adapter import get_default_provider


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


@main_bp.route('/health/llm')
def health_llm():
    """LLM connectivity health check.

    Performs a tiny generation request to validate provider setup, API key,
    and network. Returns JSON with provider name, model, and a short echo.
    """
    try:
        provider = get_default_provider()
        # Ask provider to return a minimal valid JSON echo
        resp = provider.generate(
            prompt='{"echo":"ok"}',
            system_message='Respond ONLY with valid JSON',
            temperature=0.0,
            max_tokens=20,
        )
        return jsonify({
            'status': 'ok',
            'provider': type(provider).__name__,
            'model': getattr(provider, 'model', None),
            'response': resp,
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
        }), 500
