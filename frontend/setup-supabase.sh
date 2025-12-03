#!/bin/bash

# Frontend Setup Script for Supabase Migration
# Run this after creating your Supabase project

set -e

echo "🔧 Setting up frontend for Supabase..."
echo ""

cd "$(dirname "$0")"

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the frontend directory"
    exit 1
fi

echo "📦 Installing @supabase/supabase-js..."
npm install @supabase/supabase-js

echo "🗑️  Removing old dependencies..."
npm uninstall axios 2>/dev/null || true

echo ""
echo "✅ Dependencies updated!"
echo ""

# Check for .env.local
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local and add your Supabase credentials:"
    echo "   - VITE_SUPABASE_URL"
    echo "   - VITE_SUPABASE_ANON_KEY"
    echo ""
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit frontend/.env.local with your Supabase credentials"
echo "2. Update your component imports to use Supabase API"
echo "3. Run: npm run dev"
echo ""
echo "See README_SUPABASE.md for detailed migration guide"
