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

# Determine Supabase CLI workdir (project root may contain .supabase)
WORKDIR="."
if [ -f ".supabase/config.toml" ]; then
    WORKDIR="."
elif [ -f "../.supabase/config.toml" ]; then
    WORKDIR=".."
else
    echo ""
    echo "⚠️  Not linked to a Supabase project"
    echo "Run: npx supabase link --project-ref <your-project-ref> --workdir . (from project root)"
    echo "Or run: npx supabase link --project-ref <your-project-ref> (from the repository root)"
    exit 1
fi

echo "✅ Linked to Supabase project (workdir: $WORKDIR)"

# Deploy Edge Functions
echo ""
echo "📦 Deploying Edge Functions..."

echo "  → Deploying select-problem..."
supabase --workdir "$WORKDIR" functions deploy select-problem --no-verify-jwt=false

echo "  → Deploying update-confidence..."
supabase --workdir "$WORKDIR" functions deploy update-confidence --no-verify-jwt=false

echo "  → Deploying call-claude..."
supabase --workdir "$WORKDIR" functions deploy call-claude --no-verify-jwt=false

echo ""
echo "✅ All functions deployed successfully!"

# Set/verify required secrets for Edge Functions
echo ""
echo "🔐 Verifying required secrets (CLAUDE_API_KEY / ANTHROPIC_API_KEY) ..."

# Read secrets from environment if present, else just check existence
CLAUDE_API_KEY_ENV="${CLAUDE_API_KEY:-}"
ANTHROPIC_API_KEY_ENV="${ANTHROPIC_API_KEY:-}"

if [ -n "$CLAUDE_API_KEY_ENV" ]; then
    echo "  → Setting CLAUDE_API_KEY from environment"
    supabase --workdir "$WORKDIR" secrets set CLAUDE_API_KEY="$CLAUDE_API_KEY_ENV" >/dev/null || true
fi

if [ -n "$ANTHROPIC_API_KEY_ENV" ]; then
    echo "  → Setting ANTHROPIC_API_KEY from environment"
    supabase --workdir "$WORKDIR" secrets set ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY_ENV" >/dev/null || true
fi

echo "  → Current secrets digest:"
supabase --workdir "$WORKDIR" secrets list || true

echo ""
echo "✨ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Run database migrations in Supabase SQL Editor"
echo "2. Update frontend .env.local with Supabase credentials"
echo "3. Run: cd frontend && npm install @supabase/supabase-js"
echo "4. Test your application!"
