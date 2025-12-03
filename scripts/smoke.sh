#!/usr/bin/env zsh
set -euo pipefail

API=${API:-http://127.0.0.1:5001}
EMAIL=${EMAIL:-testuser@example.com}
PASS=${PASS:-password123}

log() { echo "[smoke] $1"; }

log "Logging in to $API as $EMAIL"
TOKEN=$(curl -s -X POST "$API/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | jq -r '.token')

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  log "Login failed; trying to register user"
  curl -s -X POST "$API/api/auth/register" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" >/dev/null || true
  TOKEN=$(curl -s -X POST "$API/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | jq -r '.token')
fi

[[ -n "$TOKEN" && "$TOKEN" != "null" ]] || { log "Fatal: cannot acquire token"; exit 1; }
log "Token acquired (${#TOKEN} chars)"

GUIDE_FILE="$(pwd)/backend/tmp_guide.txt"
print -r -- "Topic: Basics\nThis is a simple study guide." > "$GUIDE_FILE"
log "Uploading guide from $GUIDE_FILE"
GUIDE_ID=$(curl -s -X POST "$API/api/guides/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$GUIDE_FILE" \
  -F "title=Quick Guide" | jq -r '.guide.id')
[[ -n "$GUIDE_ID" && "$GUIDE_ID" != "null" ]] || { log "Fatal: guide upload failed"; exit 1; }
log "Guide ID: $GUIDE_ID"

log "Starting practice session"
SESSION_ID=$(curl -s -X POST "$API/api/practice/start" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"guide_id\":$GUIDE_ID}" | jq -r '.session.id')
[[ -n "$SESSION_ID" && "$SESSION_ID" != "null" ]] || { log "Fatal: cannot start session"; exit 1; }
log "Session ID: $SESSION_ID"

log "Fetching next problem"
PROBLEM_JSON=$(curl -s -X GET "$API/api/practice/next-problem?session_id=$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN")
PROBLEM_ID=$(jq -r '.problem.id' <<<"$PROBLEM_JSON")
QUESTION=$(jq -r '.problem.question_text' <<<"$PROBLEM_JSON")
log "Problem $PROBLEM_ID: $QUESTION"

ANSWER=${ANSWER:-Yes}
log "Submitting answer: $ANSWER"
SUBMIT_JSON=$(curl -s -X POST "$API/api/practice/submit" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"session_id\":$SESSION_ID,\"problem_id\":$PROBLEM_ID,\"answer\":\"$ANSWER\"}")
IS_CORRECT=$(jq -r '.is_correct' <<<"$SUBMIT_JSON")
FEEDBACK=$(jq -r '.feedback' <<<"$SUBMIT_JSON")
log "Result: is_correct=$IS_CORRECT"
log "Feedback: $FEEDBACK"

log "Smoke test complete"
