# Study Helper - Backend

Flask REST API for the Study Helper application with a modular blueprint structure.

## Tech Stack

- **Flask**: Web framework
- **Flask-SQLAlchemy**: ORM for database operations
- **Flask-Migrate**: Database migrations
- **Flask-CORS**: Cross-origin resource sharing
- **python-dotenv**: Environment variable management

## Getting Started

### Prerequisites

- Python 3.8 or higher
- pip

### Installation

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize the database:

```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

### Development

```bash
python run.py
```

The API will be available at `http://localhost:5000`

## Project Structure

```
backend/
├── app/
│   ├── __init__.py          # Application factory
│   ├── config.py            # Configuration classes
│   ├── models.py            # Database models (7 models)
│   ├── main/                # Main blueprint (health checks, etc.)
│   │   ├── __init__.py
│   │   └── routes.py
│   └── api/                 # API blueprint (REST endpoints)
│       ├── __init__.py
│       ├── users.py
│       ├── study_guides.py
│       ├── topics.py
│       ├── problems.py
│       └── practice.py
├── migrations/              # Database migrations
├── run.py                   # Application entry point
├── init_db.py              # Database initialization script
├── requirements.txt         # Python dependencies
└── .env.example            # Environment variables template
```

## API Endpoints

### Health Check

- `GET /` - API information
- `GET /health` - Health check

### Users

- `GET /api/users` - Get all users
- `GET /api/users/<id>` - Get specific user
- `POST /api/users` - Create user (requires email and password)
- `PUT /api/users/<id>` - Update user
- `DELETE /api/users/<id>` - Delete user

### Study Guides

- `GET /api/study-guides?user_id=<id>` - Get study guides (filtered by user)
- `GET /api/study-guides/<id>?include_topics=true` - Get specific study guide
- `POST /api/study-guides` - Create study guide
- `PUT /api/study-guides/<id>` - Update study guide
- `DELETE /api/study-guides/<id>` - Delete study guide

### Topics

- `GET /api/topics?study_guide_id=<id>` - Get topics (filtered by study guide)
- `GET /api/topics/<id>?include_problems=true` - Get specific topic
- `POST /api/topics` - Create topic (auto-assigns order)
- `PUT /api/topics/<id>` - Update topic
- `DELETE /api/topics/<id>` - Delete topic

### Problems

- `GET /api/problems?topic_id=<id>&include_answer=true` - Get problems
- `GET /api/problems/<id>?include_answer=true` - Get specific problem
- `POST /api/problems` - Create problem
- `PUT /api/problems/<id>` - Update problem
- `DELETE /api/problems/<id>` - Delete problem

### Practice & Progress

- `GET /api/practice-sessions?user_id=<id>` - Get practice sessions
- `GET /api/practice-sessions/<id>?include_attempts=true` - Get specific session
- `POST /api/practice-sessions` - Start new practice session
- `PUT /api/practice-sessions/<id>/end` - End practice session
- `POST /api/problem-attempts` - Record problem attempt (auto-updates progress)
- `GET /api/topic-progress?user_id=<id>&topic_id=<id>` - Get topic progress

## Database Models

- **User**: User authentication and profile (`id`, `email`, `password_hash`, `created_at`)
- **StudyGuide**: Study guide documents (`id`, `user_id`, `title`, `original_filename`, `parsed_content`, `created_at`)
- **Topic**: Organized sections within guides (`id`, `study_guide_id`, `name`, `description`, `order_index`)
- **Problem**: Practice problems (`id`, `topic_id`, `question_text`, `problem_type`, `options`, `correct_answer`, `explanation`)
- **PracticeSession**: User practice sessions (`id`, `user_id`, `study_guide_id`, `started_at`, `ended_at`)
- **ProblemAttempt**: Individual problem attempts (`id`, `session_id`, `problem_id`, `user_answer`, `is_correct`, `confidence_rating`, `feedback`, `attempted_at`)
- **TopicProgress**: User progress tracking (`id`, `user_id`, `topic_id`, `problems_attempted`, `problems_correct`, `current_confidence`, `mastered`, `last_practiced`)

## Features

- ✅ Comprehensive relational database schema with 7 models
- ✅ Strategic indexes for query performance
- ✅ Automatic progress tracking and mastery detection
- ✅ Password hashing with Werkzeug
- ✅ JSON fields for flexible data storage
- ✅ Enum types for problem categorization
- ✅ Cascading deletes for data integrity

## Environment Variables

See `.env.example` for required environment variables:

- `FLASK_ENV`: Environment (development/production)
- `SECRET_KEY`: Secret key for session management
- `DATABASE_URL`: Database connection string
