#!/usr/bin/env zsh
set -euo pipefail

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "Error: ANTHROPIC_API_KEY env var is not set." >&2
  echo "Export it first: export ANTHROPIC_API_KEY=sk-ant-..." >&2
  exit 1
fi

echo "Testing Anthropic Messages API with Haiku..."
response=$(curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: ${ANTHROPIC_API_KEY}" \
  -H "content-type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-haiku-20241022",
    "max_tokens": 50,
    "messages": [{"role": "user", "content": "Say hello!"}]
  }')

# Basic check: ensure we didn't get an error field
if echo "$response" | grep -q 'error'; then
  echo "API returned error:" >&2
  echo "$response" | jq . >&2 || echo "$response" >&2
  exit 2
fi

echo "Success! Response snippet:"
echo "$response" | jq '{id,model,input_tokens,output_tokens,content: .content[0].text}' 2>/dev/null || echo "$response"
