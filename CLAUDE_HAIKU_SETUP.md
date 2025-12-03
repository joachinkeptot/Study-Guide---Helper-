# Using Claude Haiku 3.5 (Cost-Effective AI)

## Overview

Your app now uses **Claude 3.5 Haiku** - Anthropic's fastest and most affordable model.

## Pricing

- **Input:** $0.80 per million tokens (~$0.0008 per 1K tokens)
- **Output:** $4.00 per million tokens (~$0.004 per 1K tokens)

**Example cost:** Processing a 10-page document with 5 topics = ~$0.01-0.02

## Setup Steps

### 1. Get Claude API Credits

1. Go to https://console.anthropic.com/
2. Sign in or create an account
3. Add credits (minimum $5 recommended to start)
4. Go to **Settings** → **API Keys**
5. Click **Create Key**
6. Copy your API key (starts with `sk-ant-`)

### 2. Update Your API Key

In terminal, run:

```bash
supabase secrets set CLAUDE_API_KEY=sk-ant-your-key-here
```

### 3. Test It

1. Go to http://localhost:5173
2. Upload a document
3. Click **"Generate Topics"**
4. Wait 5-15 seconds

## What Changed

✅ **Switched to Claude 3.5 Haiku** (was Sonnet 3.5)

- **~5x cheaper** than Sonnet
- **Faster** processing (5-15 seconds vs 10-30 seconds)
- Still produces **high-quality** study questions

✅ **Edge Function deployed** (version updated)

## Cost Comparison

| Model            | Input Cost | Output Cost | Speed   |
| ---------------- | ---------- | ----------- | ------- |
| **Haiku 3.5** ⭐ | $0.80/M    | $4.00/M     | Fastest |
| Sonnet 3.5       | $3.00/M    | $15.00/M    | Fast    |
| Opus 3           | $15.00/M   | $75.00/M    | Slow    |

## Monitoring Usage

Check your usage at: https://console.anthropic.com/settings/usage

**Tip:** Set up billing alerts to avoid surprises!

## Troubleshooting

### "Claude API failed" error

**Cause:** API key not set or invalid

**Solution:**

```bash
# Set your API key
supabase secrets set CLAUDE_API_KEY=your-key-here

# Verify it's set
supabase secrets list | grep CLAUDE
```

### "Insufficient credits" error

**Cause:** No credits in your account

**Solution:** Add credits at https://console.anthropic.com/settings/billing

### Still getting errors?

Check the Edge Function logs:

```bash
supabase functions logs call-claude
```

## Example Processing

**10-page PDF → 5 topics → 20 questions**

- Input: ~8,000 tokens
- Output: ~2,000 tokens
- **Cost: ~$0.015** (less than 2 cents!)

With $5 credit, you can process **~300 documents**! 🎉
