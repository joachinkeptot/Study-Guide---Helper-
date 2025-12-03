# Testing Claude Edge Function

## Error: "Edge Function returned a non-2xx status code"

This means the Claude API call is failing. Here's how to diagnose and fix:

### Step 1: Check Your Claude API Key

1. Go to https://console.anthropic.com/settings/keys
2. Verify you have an active API key
3. Check if you have available credits/quota
4. If needed, create a new API key

### Step 2: Update the Secret in Supabase

If you need to update the Claude API key:

```bash
cd /Users/COOKIES/Study-Guide---Helper-
supabase secrets set CLAUDE_API_KEY=your-new-api-key-here
```

### Step 3: Test the Edge Function Directly

Test if the function works:

1. Go to: https://supabase.com/dashboard/project/ybcrtgdzmziclaohvjaz/functions/call-claude/details
2. Click "Invoke" or "Test"
3. Use this test payload:

```json
{
  "prompt": "Say hello in 5 words",
  "systemPrompt": "You are helpful",
  "maxTokens": 100
}
```

4. Check the response - if it errors, you'll see the actual error message

### Step 4: Common Issues

**Issue: Invalid API Key**

- Solution: Get a new key from Anthropic and update the secret

**Issue: Quota Exceeded**

- Solution: Check your Anthropic account billing/credits

**Issue: Rate Limit**

- Solution: Wait a few minutes and try again

**Issue: Function Not Deployed**

- Solution: Redeploy the function:

```bash
cd /Users/COOKIES/Study-Guide---Helper-
supabase functions deploy call-claude
```

### Temporary Workaround: Skip AI Processing

If you want to test the app without Claude, I can create a mock function that generates sample topics and questions without calling the API. This will let you test the rest of the app while you fix the Claude API issue.

Would you like me to:

1. Help you debug the Claude API key issue?
2. Create a mock/fallback that generates sample questions?
3. Both?

### Check Function Logs

To see the actual error from the Edge Function:

```bash
supabase functions logs call-claude --limit 10
```

This will show you the exact error message from Claude API.
