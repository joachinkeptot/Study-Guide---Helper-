#!/bin/bash

# Supabase Deployment Script
# This script helps deploy your Supabase Edge Functions

set -e

echo "🚀 Supabase Deployment Script"
echo "=============================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if we're linked to a project
if [ ! -f ".supabase/config.toml" ]; then
    echo ""
    echo "⚠️  Not linked to a Supabase project"
    echo "Run: supabase link --project-ref your-project-ref"
    exit 1
fi

echo "✅ Linked to Supabase project"

# Deploy Edge Functions
echo ""
echo "📦 Deploying Edge Functions..."

echo "  → Deploying select-problem..."
supabase functions deploy select-problem --no-verify-jwt=false

echo "  → Deploying update-confidence..."
supabase functions deploy update-confidence --no-verify-jwt=false

echo "  → Deploying call-claude..."
supabase functions deploy call-claude --no-verify-jwt=false

echo ""
echo "✅ All functions deployed successfully!"

# Check if secrets are set
echo ""
echo "🔐 Checking secrets..."
echo "Make sure you've set the CLAUDE_API_KEY secret:"
echo "  supabase secrets set CLAUDE_API_KEY=your_key"

echo ""
echo "✨ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Run database migrations in Supabase SQL Editor"
echo "2. Update frontend .env.local with Supabase credentials"
echo "3. Run: cd frontend && npm install @supabase/supabase-js"
echo "4. Test your application!"
