# Supabase Migration Guide

## Overview

This guide documents the migration from Flask backend to Supabase, including:

- PostgreSQL database hosted by Supabase
- Supabase Auth for authentication
- Direct database access via Supabase JS client
- Edge Functions for custom business logic

## Architecture Changes

### Before (Flask Backend)

- Flask API server
- SQLAlchemy ORM
- JWT authentication
- PostgreSQL database
- Custom API routes

### After (Supabase)

- Supabase hosted PostgreSQL
- Supabase Auth (email/password)
- Row Level Security (RLS) policies
- Direct database queries from frontend
- Edge Functions for complex logic (problem selector, Claude API)

## Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your:
   - Project URL
   - Anon (public) key
   - Service role key (for Edge Functions)
   - Database password

### 2. Environment Variables

Create `.env.local` in the frontend directory:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

For Edge Functions, create `supabase/.env`:

```env
CLAUDE_API_KEY=your_claude_api_key
```

### 3. Run Database Migration

Execute the SQL schema in Supabase SQL Editor:

- See `supabase/migrations/initial_schema.sql`
- See `supabase/migrations/rls_policies.sql`

### 4. Deploy Edge Functions

```bash
cd supabase/functions
supabase functions deploy select-problem
supabase functions deploy call-claude
supabase functions deploy update-confidence
```

### 5. Update Frontend

Install Supabase client:

```bash
cd frontend
npm install @supabase/supabase-js
```

Update imports to use `lib/supabase.js` instead of `lib/api.js`.

## Key Changes

### Database Access

**Before (Flask API):**

```javascript
const guides = await api.get("/api/study-guides");
```

**After (Supabase):**

```javascript
const { data: guides } = await supabase
  .from("study_guides")
  .select("*")
  .eq("user_id", user.id);
```

### Authentication

**Before (JWT):**

```javascript
await authAPI.login(email, password);
// Manually manage JWT token
```

**After (Supabase Auth):**

```javascript
await supabase.auth.signInWithPassword({ email, password });
// Supabase manages session automatically
```

### Complex Logic

**Before (Flask routes):**

```python
@api_bp.route('/practice/next-problem', methods=['POST'])
def get_next_problem():
    # Problem selection logic
```

**After (Edge Functions):**

```javascript
const { data } = await supabase.functions.invoke("select-problem", {
  body: { sessionId, topicIds },
});
```

## Benefits

1. **Simpler Architecture**: No backend server to maintain
2. **Real-time Capabilities**: Built-in subscriptions
3. **Automatic API**: CRUD operations via PostgREST
4. **Better Security**: Row Level Security policies
5. **Easier Scaling**: Serverless by default
6. **Cost Effective**: Free tier generous for development

## Migration Checklist

- [x] Create database schema SQL files
- [x] Set up RLS policies
- [ ] Deploy Edge Functions
- [ ] Install Supabase client in frontend
- [ ] Update auth store to use Supabase Auth
- [ ] Migrate API calls to Supabase queries
- [ ] Test all functionality
- [ ] Remove Flask backend
- [ ] Update deployment configuration

## Rollback Plan

If needed, keep the Flask backend running in parallel during migration. You can gradually migrate features one at a time.
