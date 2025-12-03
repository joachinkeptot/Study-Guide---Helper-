import os
import requests
from flask import Blueprint, request, jsonify

claude_bp = Blueprint('claude', __name__)

CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY')
CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
CLAUDE_MODEL = 'claude-2.1'

@claude_bp.route('/claude', methods=['POST'])
def call_claude():
    data = request.get_json()
    prompt = data.get('prompt')
    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400

    headers = {
        'x-api-key': CLAUDE_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
    }
    payload = {
        'model': CLAUDE_MODEL,
        'max_tokens': 1024,
        'messages': [
            {'role': 'user', 'content': prompt}
        ]
    }
    try:
        response = requests.post(CLAUDE_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        return jsonify(response.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500
