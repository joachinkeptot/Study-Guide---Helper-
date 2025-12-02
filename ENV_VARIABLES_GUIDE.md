# ===========================================

# Study Guide Helper - Environment Variables

# ===========================================

#

# This file documents all environment variables needed for deployment.

# DO NOT commit actual values to Git!

#

# Copy relevant sections to:

# - backend/.env (for backend)

# - frontend/.env (for frontend)

# ===========================================

# BACKEND ENVIRONMENT VARIABLES

# ===========================================

# Flask Configuration

FLASK_ENV=production # development | production | testing
FLASK_APP=run.py

# Security Keys (REQUIRED - Generate strong random strings!)

# Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"

SECRET_KEY=change-this-to-a-random-32-character-string
JWT_SECRET_KEY=change-this-to-another-random-32-character-string

# Database Configuration (REQUIRED)

# Supabase PostgreSQL format:

# postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true

DATABASE_URL=postgresql://user:password@host:5432/database

# CORS Configuration (REQUIRED)

# Comma-separated list of allowed origins (no spaces)

CORS_ORIGINS=https://your-app.vercel.app,https://www.your-domain.com

# Server Configuration

PORT=5000 # Auto-set by Railway/Render

# AI/LLM API Keys (OPTIONAL - Only if using AI features)

ANTHROPIC_API_KEY=sk-ant-api...
OPENAI_API_KEY=sk-...

# File Upload Settings (OPTIONAL)

MAX_CONTENT_LENGTH=16777216 # 16MB in bytes

# Database Pool Settings (OPTIONAL - For production tuning)

# SQLALCHEMY_POOL_SIZE=10

# SQLALCHEMY_POOL_RECYCLE=3600

# SQLALCHEMY_MAX_OVERFLOW=20

# ===========================================

# FRONTEND ENVIRONMENT VARIABLES

# ===========================================

# API Configuration (REQUIRED)

PUBLIC_API_URL=https://your-backend.railway.app

# Debug Mode (OPTIONAL)

PUBLIC_DEBUG=false

# Analytics (OPTIONAL)

# PUBLIC_ANALYTICS_ID=G-XXXXXXXXXX

# Error Tracking (OPTIONAL)

# PUBLIC_SENTRY_DSN=https://...

# ===========================================

# LOCAL DEVELOPMENT VALUES

# ===========================================

# Backend (.env in backend/)

# FLASK_ENV=development

# SECRET_KEY=dev-secret-key

# JWT_SECRET_KEY=dev-jwt-secret-key

# DATABASE_URL=sqlite:///app.db

# CORS_ORIGINS=http://localhost:5173

# Frontend (.env in frontend/)

# PUBLIC_API_URL=http://localhost:5000

# PUBLIC_DEBUG=true

# ===========================================

# DOCKER COMPOSE VALUES

# ===========================================

# PostgreSQL

# POSTGRES_USER=studyguide

# POSTGRES_PASSWORD=studyguide_dev_password

# POSTGRES_DB=studyguide_db

# Backend

# DATABASE_URL=postgresql://studyguide:studyguide_dev_password@postgres:5432/studyguide_db

# Frontend

# PUBLIC_API_URL=http://localhost:5000

# ===========================================

# DEPLOYMENT PLATFORMS

# ===========================================

# Railway Backend:

# Set in Railway Dashboard → Variables tab

# - FLASK_ENV=production

# - SECRET_KEY=<generated>

# - JWT_SECRET_KEY=<generated>

# - DATABASE_URL=<from Supabase>

# - CORS_ORIGINS=<your Vercel URL>

# Vercel Frontend:

# Set in Vercel Dashboard → Settings → Environment Variables

# - PUBLIC_API_URL=<your Railway URL>

# Supabase Database:

# Get connection string from:

# Supabase Dashboard → Settings → Database → Connection String

# ===========================================

# SECURITY BEST PRACTICES

# ===========================================

# ✅ DO:

# - Use strong, random secret keys (32+ characters)

# - Rotate secrets every 90 days

# - Use different secrets for dev/staging/prod

# - Store secrets in password manager

# - Use environment-specific configs

# - Enable HTTPS (automatic on Vercel/Railway)

# - Limit CORS to specific domains

# ❌ DON'T:

# - Commit .env files to Git

# - Use default/weak secrets in production

# - Share secrets via email/chat

# - Use same secrets across environments

# - Use wildcard (\*) for CORS in production

# - Store secrets in code comments

# ===========================================

# GENERATING SECURE KEYS

# ===========================================

# Python:

# python -c "import secrets; print(secrets.token_urlsafe(32))"

# Node.js:

# node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# OpenSSL:

# openssl rand -base64 32

# Online (use trusted generator):

# https://generate-random.org/api-key-generator
