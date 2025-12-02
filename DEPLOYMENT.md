# Study Guide Helper - Deployment Guide

This guide provides step-by-step instructions for deploying the Study Guide Helper application to production using modern cloud platforms.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Database Setup (Supabase)](#database-setup-supabase)
- [Backend Deployment (Railway)](#backend-deployment-railway)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Environment Variables Reference](#environment-variables-reference)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

```
┌─────────────────┐
│                 │
│  Vercel         │  ← Frontend (SvelteKit)
│  (Frontend)     │
│                 │
└────────┬────────┘
         │
         │ HTTPS/API Calls
         │
         ▼
┌─────────────────┐
│                 │
│  Railway/Render │  ← Backend (Flask API)
│  (Backend)      │
│                 │
└────────┬────────┘
         │
         │ PostgreSQL Connection
         │
         ▼
┌─────────────────┐
│                 │
│  Supabase       │  ← Database (PostgreSQL)
│  (Database)     │
│                 │
└─────────────────┘
```

---

## ✅ Prerequisites

Before you begin, ensure you have:

- [ ] GitHub account (for code repository)
- [ ] Vercel account (frontend hosting) - [signup](https://vercel.com/signup)
- [ ] Railway account (backend hosting) - [signup](https://railway.app)
  - _Alternative: Render account - [signup](https://render.com)_
- [ ] Supabase account (database) - [signup](https://supabase.com)
- [ ] Git installed locally
- [ ] Node.js 18+ installed
- [ ] Python 3.11+ installed

---

## 🐳 Local Development Setup

### Using Docker Compose (Recommended)

The easiest way to run everything locally:

```bash
# Clone the repository
git clone https://github.com/yourusername/Study-Guide-Helper.git
cd Study-Guide-Helper

# Start all services (backend, frontend, database)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Services Available:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432
- pgAdmin (optional): http://localhost:5050

**Default Credentials:**

- Database: `studyguide` / `studyguide_dev_password`
- pgAdmin: `admin@studyguide.local` / `admin`

### Manual Setup (Without Docker)

#### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your settings
# DATABASE_URL=sqlite:///app.db  (for local SQLite)

# Initialize database
flask db upgrade

# Run development server
python run.py
```

Backend will be available at http://localhost:5001

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env
# PUBLIC_API_URL=http://localhost:5001

# Run development server
npm run dev
```

Frontend will be available at http://localhost:5173

---

## 🗄️ Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in project details:
   - **Name:** study-guide-helper
   - **Database Password:** (Generate a strong password and save it!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier is sufficient to start
4. Click **"Create new project"** (takes ~2 minutes)

### Step 2: Get Connection String

1. In your Supabase project, go to **Settings** → **Database**
2. Scroll to **Connection String** section
3. Select **"URI"** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijk.supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password

### Step 3: Connection String Formats

**For Development (Direct Connection):**

```
postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres
```

**For Production (Pooled Connection - Recommended):**

```
postgresql://postgres:your_password@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true
```

**Important Notes:**

- Use port `5432` for direct connections
- Use port `6543` for connection pooling (recommended for production)
- Supabase provides both transaction pooling and session pooling

### Step 4: Configure Database

Supabase comes with PostgreSQL ready to use. No additional setup needed!

**Optional: Enable Extensions**

If you need specific PostgreSQL extensions:

1. Go to **Database** → **Extensions**
2. Enable extensions like `pg_trgm` for full-text search

---

## 🚀 Backend Deployment (Railway)

### Step 1: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Connect your GitHub account and select your repository
4. Railway will detect the backend automatically

### Step 2: Configure Backend Service

1. Click on your deployed service
2. Go to **Settings** tab
3. Configure the following:

**Root Directory:**

```
backend
```

**Build Command (if needed):**

```
pip install -r requirements.txt
```

**Start Command:**

```
gunicorn run:app --bind 0.0.0.0:$PORT
```

### Step 3: Add Environment Variables

In Railway, go to **Variables** tab and add:

```bash
# Flask Configuration
FLASK_ENV=production
SECRET_KEY=your-super-secret-key-min-32-chars
JWT_SECRET_KEY=your-jwt-secret-key-min-32-chars

# Database (from Supabase)
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true

# CORS (add your Vercel domain after frontend deployment)
CORS_ORIGINS=https://your-app.vercel.app

# Optional: AI API Keys
ANTHROPIC_API_KEY=your-key
OPENAI_API_KEY=your-key
```

**Generate Secure Keys:**

```bash
# On macOS/Linux:
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Or use an online generator
```

### Step 4: Run Database Migrations

1. In Railway, go to your service
2. Click **Settings** → **Deploy**
3. Add a **Deploy Hook** for migrations:

```bash
flask db upgrade && gunicorn run:app --bind 0.0.0.0:$PORT
```

Or run manually via Railway CLI:

```bash
railway run flask db upgrade
```

### Step 5: Get Backend URL

1. In Railway, go to **Settings** → **Networking**
2. Click **Generate Domain**
3. Copy the generated URL (e.g., `https://your-app.railway.app`)
4. Save this URL for frontend configuration

### Alternative: Deploy to Render

<details>
<summary>Click to expand Render deployment instructions</summary>

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** study-guide-helper-backend
   - **Root Directory:** `backend`
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn run:app --bind 0.0.0.0:$PORT`
5. Add environment variables (same as Railway)
6. Click **"Create Web Service"**
7. After deployment, run migrations in Shell:
   ```bash
   flask db upgrade
   ```

</details>

---

## 🎨 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

Ensure your `svelte.config.js` uses the Vercel adapter:

```javascript
import adapter from "@sveltejs/adapter-vercel";
```

This is already configured in the repository.

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Easiest)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** SvelteKit (auto-detected)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.svelte-kit` (auto-detected)

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# For production
vercel --prod
```

### Step 3: Configure Environment Variables

In Vercel Dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Add the following:

**Production:**

```bash
PUBLIC_API_URL=https://your-backend.railway.app
```

**Preview/Development (optional):**

```bash
PUBLIC_API_URL=https://your-backend-dev.railway.app
```

### Step 4: Update Backend CORS

Now that you have your Vercel URL, update the backend:

1. Go to Railway → Your Service → **Variables**
2. Update `CORS_ORIGINS`:
   ```
   https://your-app.vercel.app
   ```
3. Redeploy the backend service

### Step 5: Configure Custom Domain (Optional)

1. In Vercel, go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update backend CORS_ORIGINS with your custom domain

---

## 📝 Environment Variables Reference

### Backend Environment Variables

| Variable            | Description                    | Example                               | Required |
| ------------------- | ------------------------------ | ------------------------------------- | -------- |
| `FLASK_ENV`         | Environment mode               | `production`                          | ✅       |
| `SECRET_KEY`        | Flask secret key               | `32+ char random string`              | ✅       |
| `JWT_SECRET_KEY`    | JWT signing key                | `32+ char random string`              | ✅       |
| `DATABASE_URL`      | PostgreSQL connection string   | `postgresql://user:pass@host:5432/db` | ✅       |
| `CORS_ORIGINS`      | Allowed frontend URLs          | `https://app.vercel.app`              | ✅       |
| `PORT`              | Server port (auto-set by host) | `5000`                                | Auto     |
| `ANTHROPIC_API_KEY` | Anthropic AI API key           | `sk-ant-...`                          | Optional |
| `OPENAI_API_KEY`    | OpenAI API key                 | `sk-...`                              | Optional |

### Frontend Environment Variables

| Variable         | Description       | Example                   | Required |
| ---------------- | ----------------- | ------------------------- | -------- |
| `PUBLIC_API_URL` | Backend API URL   | `https://api.railway.app` | ✅       |
| `PUBLIC_DEBUG`   | Enable debug mode | `false`                   | Optional |

---

## 🔄 Post-Deployment

### 1. Initialize Database

After first deployment, run migrations:

**Via Railway CLI:**

```bash
railway run flask db upgrade
```

**Via Render Shell:**

1. Go to service → **Shell**
2. Run: `flask db upgrade`

### 2. Create Initial Test User (Optional)

Create a test account via API or add init script:

```python
# backend/init_test_user.py
from app import create_app, db
from app.models import User
from werkzeug.security import generate_password_hash

app = create_app('production')
with app.app_context():
    user = User(
        email='test@example.com',
        password_hash=generate_password_hash('testpassword')
    )
    db.session.add(user)
    db.session.commit()
    print(f"Created user: {user.email}")
```

Run: `railway run python init_test_user.py`

### 3. Test the Deployment

**Test Backend:**

```bash
curl https://your-backend.railway.app/health
# Should return: {"status": "healthy"}
```

**Test Frontend:**

1. Visit your Vercel URL
2. Try to register/login
3. Upload a test study guide
4. Start a practice session

### 4. Monitor Logs

**Railway:**

- Click on service → **Deployments** → **View Logs**

**Vercel:**

- Project → **Deployments** → Click deployment → **Functions**

**Supabase:**

- Database → **Logs**

### 5. Set Up Monitoring (Recommended)

**Backend (Railway):**

- Enable **Metrics** in Railway dashboard
- Set up **Notifications** for deployment failures

**Frontend (Vercel):**

- Vercel automatically provides **Analytics** and **Speed Insights**
- Enable **Web Vitals** tracking

**Database (Supabase):**

- Monitor in **Database** → **Logs**
- Set up **Database Backups** in **Settings**

---

## 🔧 Database Migrations

### Creating New Migrations

When you modify models:

```bash
# Locally
cd backend
flask db migrate -m "Description of changes"
flask db upgrade

# Commit migration files
git add migrations/versions/*
git commit -m "Add migration: description"
git push
```

### Running Migrations in Production

**Automatic (Recommended):**

Update your start command to run migrations automatically:

```bash
flask db upgrade && gunicorn run:app --bind 0.0.0.0:$PORT
```

**Manual:**

```bash
# Railway
railway run flask db upgrade

# Render
# Use Shell in dashboard
flask db upgrade
```

### Rolling Back Migrations

```bash
# Downgrade one version
flask db downgrade

# Downgrade to specific version
flask db downgrade <revision_id>
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "CORS Error" in Frontend

**Problem:** Frontend can't connect to backend

**Solution:**

1. Check `CORS_ORIGINS` in backend includes your Vercel URL
2. Ensure `PUBLIC_API_URL` in frontend is correct
3. Verify backend is deployed and accessible
4. Check browser console for exact error

#### 2. "Database Connection Failed"

**Problem:** Backend can't connect to Supabase

**Solution:**

1. Verify `DATABASE_URL` in Railway/Render
2. Check Supabase database is running
3. Ensure connection string uses correct port (6543 for pooled)
4. Test connection: `railway run python -c "from app import db; print(db.engine.url)"`

#### 3. "502 Bad Gateway" on Backend

**Problem:** Backend not starting

**Solution:**

1. Check Railway/Render logs for errors
2. Verify all environment variables are set
3. Test locally with production settings
4. Ensure `requirements.txt` includes all dependencies

#### 4. "Build Failed" on Vercel

**Problem:** Frontend build errors

**Solution:**

1. Check Vercel build logs
2. Ensure `@sveltejs/adapter-vercel` is installed
3. Verify `svelte.config.js` uses correct adapter
4. Test build locally: `npm run build`

#### 5. "Module Not Found" Errors

**Problem:** Missing dependencies

**Solution:**

```bash
# Backend
pip install -r requirements.txt
pip freeze > requirements.txt

# Frontend
npm install
```

### Debug Mode

**Enable Verbose Logging:**

Backend (Railway):

```bash
FLASK_ENV=development
SQLALCHEMY_ECHO=true
```

Frontend (Vercel):

```bash
PUBLIC_DEBUG=true
```

### Database Connection Testing

Test your database connection:

```python
# test_db.py
import os
from sqlalchemy import create_engine

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        result = conn.execute("SELECT version()")
        print(f"✅ Connected! PostgreSQL version: {result.fetchone()[0]}")
except Exception as e:
    print(f"❌ Connection failed: {e}")
```

Run: `railway run python test_db.py`

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use strong secret keys** - Minimum 32 characters
3. **Enable HTTPS only** - Both Vercel and Railway provide this by default
4. **Rotate secrets regularly** - Every 90 days
5. **Limit CORS origins** - Don't use `*` in production
6. **Enable database backups** - In Supabase settings
7. **Monitor error logs** - Set up alerting for critical errors
8. **Use environment-specific configs** - Separate dev/staging/prod

---

## 📊 Monitoring & Maintenance

### Health Checks

**Backend Health Endpoint:**

```bash
curl https://your-backend.railway.app/health
```

**Database Health:**

```sql
-- In Supabase SQL Editor
SELECT
    count(*) as total_connections,
    max(backend_start) as oldest_connection
FROM pg_stat_activity
WHERE datname = 'postgres';
```

### Performance Monitoring

**Railway:**

- Monitor CPU, Memory, Network in dashboard
- Set up alerts for resource limits

**Vercel:**

- Check Analytics for page load times
- Monitor Function execution duration

**Supabase:**

- Review Database → Statistics
- Check for slow queries

### Backup Strategy

**Database Backups (Supabase):**

1. Go to **Settings** → **Billing**
2. Enable Point-in-Time Recovery (PITR) on paid plans
3. Or use manual backup script:

```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore backup
psql $DATABASE_URL < backup_20231201.sql
```

---

## 🚀 Scaling Considerations

### When to Scale

- **Backend:** > 1000 requests/minute
- **Database:** > 100 concurrent connections
- **Storage:** > 10GB files uploaded

### Scaling Options

**Backend (Railway):**

- Upgrade to higher tier
- Add more workers: `--workers 8`
- Enable horizontal scaling

**Frontend (Vercel):**

- Automatically scales
- Consider CDN for static assets

**Database (Supabase):**

- Upgrade to Pro plan for connection pooling
- Enable read replicas
- Consider caching layer (Redis)

---

## 📚 Additional Resources

- [SvelteKit Docs](https://kit.svelte.dev)
- [Flask Docs](https://flask.palletsprojects.com)
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)

---

## ✅ Deployment Checklist

- [ ] Supabase project created
- [ ] Database connection string obtained
- [ ] Backend deployed to Railway/Render
- [ ] All backend environment variables set
- [ ] Database migrations run successfully
- [ ] Backend health check passes
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables set
- [ ] CORS configured with Vercel URL
- [ ] Frontend can reach backend API
- [ ] Test user registration works
- [ ] Test study guide upload works
- [ ] Test practice session works
- [ ] Monitoring and logging enabled
- [ ] Backups configured
- [ ] Documentation updated with URLs

---

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review service logs (Railway/Vercel/Supabase)
3. Test locally with same configuration
4. Check GitHub issues for similar problems
5. Create a new issue with detailed error logs

---

**Congratulations!** 🎉 Your Study Guide Helper is now deployed and ready to use!
