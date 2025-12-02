#!/bin/bash

# Railway deployment script
# This script can be used as a reference or run manually

set -e

echo "🚀 Deploying Study Guide Helper Backend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install it first:"
    echo "npm i -g @railway/cli"
    exit 1
fi

# Login check
echo "📝 Checking Railway authentication..."
railway whoami || railway login

# Link project (if not already linked)
echo "🔗 Linking Railway project..."
railway link

# Set environment variables
echo "⚙️  Setting environment variables..."
echo "Please set these in the Railway dashboard:"
echo ""
echo "Required variables:"
echo "  - FLASK_ENV=production"
echo "  - SECRET_KEY=<generate-32-char-key>"
echo "  - JWT_SECRET_KEY=<generate-32-char-key>"
echo "  - DATABASE_URL=<your-supabase-url>"
echo "  - CORS_ORIGINS=<your-vercel-url>"
echo ""

read -p "Have you set all environment variables? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⏸️  Please set environment variables in Railway dashboard first."
    exit 1
fi

# Run migrations
echo "🔄 Running database migrations..."
railway run flask db upgrade

# Deploy
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Get your Railway URL from the dashboard"
echo "2. Update CORS_ORIGINS if needed"
echo "3. Configure frontend with backend URL"
