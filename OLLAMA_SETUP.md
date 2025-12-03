# Using Ollama Instead of Claude API

## Overview

Your app now uses **Ollama** - a free, local AI alternative to Claude API.

## Setup

### 1. Start Ollama (if not running)

```bash
ollama serve
```

Keep this running in a terminal window.

### 2. Use Your App

The app will now automatically:

- Connect to Ollama at `http://localhost:11434`
- Use the `llama3.1` model you already have installed
- Generate study topics and questions locally (no API costs!)

## How It Works

1. **Upload a document** → Stored in Supabase
2. **Click "Generate Topics"** → Ollama analyzes it locally
3. **AI creates questions** → All on your machine, no external API calls
4. **Start practicing** → Same as before!

## Benefits of Ollama

✅ **Free** - No API costs
✅ **Private** - Data stays on your machine  
✅ **Fast** - Local processing
✅ **Offline** - Works without internet (after model download)

## Available Models

You currently have:

- `llama3.1:latest` (4.7 GB) - **Currently using this**
- `gemma2:latest` (5.4 GB)
- `codegemma:2b` (1.6 GB)

To use a different model, edit `/frontend/src/routes/dashboard/+page.svelte` line 150:

```javascript
"llama3.1:latest"; // Change to 'gemma2:latest' or other model
```

## Troubleshooting

### "Ollama is not running" error

**Solution:** Open a terminal and run:

```bash
ollama serve
```

### Slow processing

**Try a smaller model:**

```bash
ollama pull llama3.2  # Smaller, faster model
```

Then change the model in the code to `'llama3.2'`.

### Quality issues

**Try a larger model:**

```bash
ollama pull llama3.1:70b  # Much better quality, needs ~40GB
```

## Testing

1. Make sure Ollama is running: `curl http://localhost:11434/api/tags`
2. Upload a document in your app
3. Click "Generate Topics"
4. Should take 10-30 seconds depending on document size

## Notes

- First generation might be slower as the model loads
- Subsequent generations will be faster
- Model stays in memory while Ollama is running
- Quality is comparable to GPT-3.5, good enough for study questions!
