#!/bin/bash
# Quick start script for study app

echo "🚀 Starting Study Helper App..."
echo ""

# Check if Supabase is running
if ! supabase status &> /dev/null; then
    echo "📦 Starting Supabase..."
    supabase start
else
    echo "✅ Supabase already running"
fi

echo ""
echo "🌐 Starting Frontend..."
echo "📖 Open http://localhost:5173 in your browser"
echo ""
echo "Press Ctrl+C to stop the frontend when done"
echo ""

cd frontend && npm run dev
