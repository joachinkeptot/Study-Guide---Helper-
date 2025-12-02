# Study Helper App

A full-stack study helper application built as a monorepo with SvelteKit frontend and Flask backend.

## 🏗️ Project Structure

```
Study-Guide---Helper-/
├── frontend/              # SvelteKit application
│   ├── src/
│   │   ├── routes/       # SvelteKit routes
│   │   ├── lib/          # Shared components and utilities
│   │   ├── app.html      # HTML template
│   │   └── app.d.ts      # TypeScript declarations
│   ├── static/           # Static assets
│   ├── package.json
│   ├── svelte.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── .env.example
│   ├── .gitignore
│   └── README.md
│
├── backend/              # Flask API
│   ├── app/
│   │   ├── __init__.py   # Application factory
│   │   ├── config.py     # Configuration classes
│   │   ├── models.py     # Database models
│   │   ├── main/         # Main blueprint
│   │   └── api/          # API blueprint
│   ├── run.py            # Application entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── .gitignore
│   └── README.md
│
├── .gitignore            # Root gitignore
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **Python** 3.8 or higher
- **npm** or **pnpm**
- **pip**

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your backend API URL (default: http://localhost:5000)
```

4. Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Set up environment variables:

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

### Study Guides

- Upload and parse study materials
- AI-generated study guides
- Topic organization
- Progress tracking

### Practice Sessions

- Interactive question-answering
- Instant feedback
- Difficulty levels
- Session history

### Progress Tracking

- Overall statistics
- Session analytics
- Performance insights
- Historical data

## 🎨 Frontend Routes

- `/` - Landing page (redirects to dashboard if authenticated)
- `/login` - User login
- `/register` - User registration
- `/dashboard` - Study guides overview (protected)
- `/guide/[id]` - View guide and start practice (protected)
- `/practice/[sessionId]` - Active practice session (protected)
- `/progress` - Progress overview (protected)
- `DELETE /api/cards/<id>` - Delete card

## 🚢 Deployment

### Frontend (Vercel)

The frontend is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set the root directory to `frontend`
3. Vercel will automatically detect SvelteKit and configure the build settings
4. Add environment variables in Vercel dashboard
5. Deploy!

### Backend

The backend can be deployed to various platforms:

- **Heroku**: Use the Procfile pattern
- **Railway**: Auto-detects Flask applications
- **AWS/GCP/Azure**: Use Docker or platform-specific deployment methods

Make sure to:

- Set all environment variables
- Use a production database (PostgreSQL recommended)
- Set `FLASK_ENV=production`
- Use a proper WSGI server like Gunicorn

## 🔧 Development

### Running Both Services

You can run both frontend and backend simultaneously in separate terminals:

**Terminal 1 (Backend):**

```bash
cd backend
source venv/bin/activate
python run.py
```

**Terminal 2 (Frontend):**

```bash
cd frontend
npm run dev
```

### Building for Production

**Frontend:**

```bash
cd frontend
npm run build
npm run preview  # Preview production build
```

**Backend:**

## 📝 Environment Variables

### Frontend (.env)

```
VITE_API_BASE_URL=http://localhost:5000
```

### Backend (.env)

````
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///instance/app.db
``` Backend (.env)

````

FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///app.db

```

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
```
