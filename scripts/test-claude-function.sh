#!/bin/bash
# Test the deployed call-claude Edge Function
# Make sure you have SUPABASE_ANON_KEY set or pass it inline

SUPABASE_URL="https://ybcrtgdzmziclaohvjaz.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliY3J0Z2R6bXppY2xhb2h2amF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTU5MzAsImV4cCI6MjA4MDI5MTkzMH0.kvWfJhbAN5-9Btd-PTJrQ7MsnqtwSXoc16tgvBZbwsU"

echo "Testing deployed call-claude Edge Function..."
curl -s -X POST "${SUPABASE_URL}/functions/v1/call-claude" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Say hello in one sentence","maxTokens":64}' | jq .

echo ""
echo "If you see a Claude response, the function is working!"
echo "If you see an error, check: supabase functions logs call-claude --project-ref ybcrtgdzmziclaohvjaz"
