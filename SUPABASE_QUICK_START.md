# Supabase Backend - Quick Start

## Prerequisites

1. Node.js 18+ installed
2. Supabase account (free tier available)
3. Supabase CLI installed: `npm install -g supabase`

## Setup Steps

### 1. Create Supabase Project

Go to [supabase.com](https://supabase.com) and create a new project. Save:

- Project URL
- Anon (public) key
- Service role key (keep this secret!)
- Database password

### 2. Configure Environment Variables

**Frontend** (`frontend/.env.local`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Edge Functions** (`supabase/.env`):

```env
CLAUDE_API_KEY=your_claude_api_key
```

### 3. Initialize Database Schema

In the Supabase Dashboard SQL Editor, run:

1. `supabase/migrations/00001_initial_schema.sql`
2. `supabase/migrations/00002_rls_policies.sql`

Or if using Supabase CLI:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

### 4. Deploy Edge Functions

```bash
cd supabase
supabase functions deploy select-problem
supabase functions deploy update-confidence
supabase functions deploy call-claude
```

Set the Claude API secret:

```bash
supabase secrets set CLAUDE_API_KEY=your_claude_api_key
```

### 5. Install Frontend Dependencies

```bash
cd frontend
npm install @supabase/supabase-js
```

### 6. Update Frontend Code

Replace imports in your Svelte components:

**Old:**

```javascript
import { api } from "$lib/api";
import { auth } from "$stores/auth";
```

**New:**

```javascript
import { supabase } from "$lib/supabase";
import supabaseAPI from "$lib/supabase-api";
import { auth } from "$stores/auth-supabase";
```

### 7. Test Locally (Optional)

You can run Supabase locally:

```bash
supabase init
supabase start
```

Update frontend `.env.local` to point to local instance:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key
```

### 8. Run Frontend

```bash
cd frontend
npm run dev
```

## Key Differences from Flask Backend

### Authentication

- No more manual JWT tokens
- Supabase Auth handles sessions automatically
- Built-in email verification, password reset, etc.

### Database Queries

- Direct database access from frontend (secured by RLS)
- No need for API routes for CRUD operations
- PostgREST provides automatic REST API

### Custom Logic

- Complex business logic moved to Edge Functions
- Problem selection algorithm
- Confidence updates
- Claude API calls

## Deployment

### Frontend (Vercel)

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy!

### Edge Functions

Already deployed to Supabase (serverless)

## Benefits

1. **Simpler**: No backend server to maintain
2. **Faster**: Direct database queries, no API overhead
3. **Secure**: Row Level Security policies
4. **Scalable**: Serverless by default
5. **Real-time**: Built-in subscriptions (if needed)
6. **Cost-effective**: Free tier generous for development

## Migration Checklist

- [ ] Create Supabase project
- [ ] Run database migrations
- [ ] Deploy Edge Functions
- [ ] Set environment variables
- [ ] Install @supabase/supabase-js
- [ ] Update auth store
- [ ] Update API calls
- [ ] Test authentication
- [ ] Test CRUD operations
- [ ] Test practice flow
- [ ] Remove Flask backend
- [ ] Update deployment docs

## Support

- Supabase Docs: https://supabase.com/docs
- Edge Functions: https://supabase.com/docs/guides/functions
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
