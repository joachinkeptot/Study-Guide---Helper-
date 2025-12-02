"""
Routes package initialization.
"""

from flask import Blueprint

# Create main API blueprint
api_bp = Blueprint('api', __name__)

# Import routes to register them with the blueprint
from app.routes import auth, study_guides, practice, progress
