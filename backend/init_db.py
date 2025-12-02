#!/usr/bin/env python
"""
Script to initialize the database and create the initial migration.
Run this after setting up your virtual environment and installing requirements.
"""
import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from flask_migrate import init, migrate, upgrade

def init_database():
    """Initialize the database with migrations"""
    app = create_app('development')
    
    with app.app_context():
        # Check if migrations directory exists
        migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
        
        if not os.path.exists(migrations_dir):
            print("Initializing migrations directory...")
            init()
            print("✓ Migrations directory created")
        else:
            print("✓ Migrations directory already exists")
        
        # Create initial migration
        print("\nCreating initial migration...")
        migrate(message='Initial migration with all models')
        print("✓ Migration created")
        
        # Apply migration
        print("\nApplying migration to database...")
        upgrade()
        print("✓ Database schema created successfully!")
        
        print("\n" + "="*50)
        print("Database initialization complete!")
        print("="*50)

if __name__ == '__main__':
    init_database()
