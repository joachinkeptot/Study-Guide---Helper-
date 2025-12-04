# AI Study Practice 🎯

Simple AI-powered practice problem generator for exam prep.

## What It Does

Type any topic → Get instant AI-generated multiple choice questions → Answer → Get feedback → Keep practicing

## Quick Start

```bash
# 1. Start the app
cd frontend
npm run dev

# 2. Go to http://localhost:10000

# 3. Login/Register

# 4. Click "Practice" and start studying!
```

## How to Use

1. **Enter a topic** - e.g., "Calculus derivatives", "Spanish verbs", "Chemistry bonds"
2. **Click "Generate Problem"** - AI creates a unique question
3. **Select your answer** - Multiple choice options
4. **Get instant feedback** - Explanation included
5. **Click "Next Problem"** - Keep practicing the same topic
6. **Or "Change Topic"** - Switch to something else

## Features

✅ Unlimited AI-generated problems  
✅ Any topic you want  
✅ Multiple choice format  
✅ Instant explanations  
✅ No setup complexity  
✅ Works offline after load

## Tech Stack

- Frontend: SvelteKit
- Backend: Supabase Edge Functions
- AI: Claude Haiku 4.5

```bash
cp .env.example .env
# Edit .env with your configuration (SECRET_KEY, DATABASE_URL, etc.)
```

5. Initialize the database:

```bash
python init_db.py
```

6. Start the Flask server:

```bash
python run.py
```

The backend will be available at `http://localhost:5000`

## 🛠️ Tech Stack

### Frontend

- **SvelteKit** - Full-stack framework for building web applications
- **TailwindCSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server

### Backend

- **Flask** - Lightweight web framework
- **Flask-SQLAlchemy** - ORM for database operations
- **Flask-Migrate** - Database migrations
- **Flask-CORS** - Cross-origin resource sharing
- **Flask-JWT-Extended** - JWT authentication
- **python-dotenv** - Environment variable management

## 📊 Database Models

- **User**: User accounts with authentication
- **StudyGuide**: Study materials and content
- **Topic**: Subject areas for organization
- **Problem**: Practice questions
- **PracticeSession**: Active practice sessions
- **Answer**: User responses to practice problems

## 🔌 Key Features

### Authentication

- JWT-based authentication
- Secure password hashing
- Token refresh mechanism
- Protected routes

## That's It!

Super simple. Just for you. Good luck on your exam! 🎓
