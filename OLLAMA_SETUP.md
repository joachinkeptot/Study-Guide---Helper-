# Ollama Support Removed

This project now uses Claude API exclusively for topic extraction and question generation.

What changed

- All Ollama client code has been deprecated and is no longer used.
- The Dashboard analyzes PDFs by forwarding the file from Supabase Storage to the `call-claude` Edge Function.
- As a fallback for non-PDFs or local previews, client-side parsing is done; generation still happens via Claude.

How to configure

- Set `CLAUDE_API_KEY` in your Supabase Edge Function environment.
- Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured for the function to download files from Storage.

Where to look

- Edge Function: `supabase/functions/call-claude/index.ts`
- Frontend calls: `frontend/src/lib/supabase-api.js` (`claudeAPI.call` and `claudeAPI.analyzeFile`)
- Dashboard flow: `frontend/src/routes/dashboard/+page.svelte`

Troubleshooting

- If generation fails, the UI will show a fallback and log the function error.
- Check Supabase Function logs and verify your Claude API key.
