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

### Production Deployment

For complete deployment instructions, see **[DEPLOYMENT.md](./DEPLOYMENT.md)** which covers:

- 🗄️ **Database**: Supabase PostgreSQL setup
- 🚂 **Backend**: Railway or Render deployment
- ⚡ **Frontend**: Vercel deployment
- 🔐 **Security**: Environment variables and CORS configuration
- 🔄 **Migrations**: Database setup and updates
- 🐛 **Troubleshooting**: Common issues and solutions

### Quick Deploy Links

- **Frontend (Vercel)**: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/Study-Guide-Helper&project-name=study-guide-helper&root-directory=frontend)
- **Backend (Railway)**: [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

### Local Development with Docker

For the easiest local setup with all services (database, backend, frontend):

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

See **[DOCKER_GUIDE.md](./DOCKER_GUIDE.md)** for more Docker commands.

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

```env
PUBLIC_API_URL=http://localhost:5000
PUBLIC_DEBUG=true
```

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

````
### Backend (.env)

```env
FLASK_ENV=development
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-key
DATABASE_URL=sqlite:///app.db
CORS_ORIGINS=http://localhost:5173
````

See `.env.example` files in each directory for complete variable lists.

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[DOCKER_GUIDE.md](./DOCKER_GUIDE.md)** - Docker Compose commands
- **[backend/README.md](./backend/README.md)** - Backend API documentation
- **[frontend/README.md](./frontend/README.md)** - Frontend documentation

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
