# Supabase Migration Summary

## What Changed

### 🗄️ Backend Architecture

- **Removed**: Flask backend with SQLAlchemy, JWT auth, custom API routes
- **Added**: Supabase (PostgreSQL + Auth + Edge Functions + PostgREST)

### 📊 Database

- **Before**: Self-hosted PostgreSQL with SQLAlchemy models
- **After**: Supabase-hosted PostgreSQL with direct SQL schema
- **Schema**: Converted all SQLAlchemy models to SQL (see `supabase/migrations/`)
- **Security**: Row Level Security (RLS) policies replace backend authorization

### 🔐 Authentication

- **Before**: Manual JWT token generation and validation
- **After**: Supabase Auth with automatic session management
- **Benefits**: Built-in email verification, password reset, OAuth providers

### 📡 API Layer

- **Before**: Flask routes with ~15+ endpoints
- **After**:
  - Direct database queries via Supabase client (CRUD operations)
  - Edge Functions for complex logic (problem selection, confidence updates, Claude API)
  - PostgREST for automatic REST API

### 🎯 Frontend Changes

- **New Files**:
  - `lib/supabase.js` - Supabase client configuration
  - `lib/supabase-api.js` - API wrapper functions
  - `stores/auth-supabase.js` - Updated auth store
- **Removed Dependencies**: axios (no longer needed)
- **Added Dependencies**: @supabase/supabase-js

## File Structure

```
supabase/
├── migrations/
│   ├── 00001_initial_schema.sql     # Database tables
│   └── 00002_rls_policies.sql       # Security policies
├── functions/
│   ├── select-problem/              # Problem selection algorithm
│   ├── update-confidence/           # Progress tracking
│   └── call-claude/                 # Claude API proxy
├── config.toml                      # Supabase configuration
└── .env.example                     # Edge function env vars

frontend/
└── src/
    ├── lib/
    │   ├── supabase.js              # Supabase client
    │   └── supabase-api.js          # API wrapper
    └── stores/
        └── auth-supabase.js         # Updated auth store
```

## Edge Functions

### 1. select-problem

Implements the spaced repetition algorithm for intelligent problem selection.

- Considers topic confidence levels
- Balances new vs. review problems
- Avoids recent repeats

### 2. update-confidence

Updates user progress using exponential moving average.

- Tracks problems attempted/correct
- Calculates confidence scores
- Determines mastery status

### 3. call-claude

Proxies Claude API calls securely.

- Keeps API key server-side
- Supports system prompts
- Configurable token limits

## Migration Benefits

### 1. Simpler Architecture

- No backend server to deploy/maintain
- No ORM complexity
- Fewer moving parts

### 2. Better Security

- RLS policies enforce data access at database level
- Automatic SQL injection protection
- Built-in authentication

### 3. Improved Performance

- Direct database queries (no API overhead)
- Connection pooling handled by Supabase
- CDN-distributed Edge Functions

### 4. Developer Experience

- Type-safe database queries
- Real-time subscriptions available
- Automatic API documentation

### 5. Cost Effective

- Free tier: 500MB database, 2GB bandwidth, 50MB file storage
- No server costs
- Scales automatically

## Next Steps

### 1. Setup Supabase Project

```bash
# Create account at supabase.com
# Create new project
# Note: Project URL, Anon Key, Service Role Key
```

### 2. Deploy Database Schema

```bash
# In Supabase SQL Editor, run:
# - supabase/migrations/00001_initial_schema.sql
# - supabase/migrations/00002_rls_policies.sql
```

### 3. Deploy Edge Functions

```bash
cd supabase
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy select-problem
supabase functions deploy update-confidence
supabase functions deploy call-claude
supabase secrets set CLAUDE_API_KEY=your_key
```

### 4. Update Frontend

```bash
cd frontend
npm install @supabase/supabase-js
npm uninstall axios
```

### 5. Configure Environment

```bash
# Copy frontend/.env.example to frontend/.env.local
# Add your Supabase URL and Anon Key
```

### 6. Update Component Imports

Replace old API calls with Supabase API:

```javascript
// Old
import { api } from "$lib/api";
const guides = await api.get("/api/study-guides");

// New
import supabaseAPI from "$lib/supabase-api";
const guides = await supabaseAPI.studyGuides.getAll();
```

### 7. Update Auth Store

```javascript
// Old
import { auth } from "$stores/auth";

// New
import { auth } from "$stores/auth-supabase";
```

### 8. Test Everything

- [ ] User registration
- [ ] User login
- [ ] Study guide CRUD
- [ ] Topic management
- [ ] Problem generation
- [ ] Practice sessions
- [ ] Progress tracking
- [ ] Hints system

### 9. Remove Old Backend

Once everything is tested and working:

```bash
# Remove backend directory
rm -rf backend/
# Update docker-compose.yml if needed
# Remove backend deployment configs
```

## Rollback Plan

If needed, you can run both backends in parallel:

1. Keep Flask backend running
2. Test Supabase features incrementally
3. Gradually migrate routes one-by-one
4. Switch environment variable to toggle between backends

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

## Support

For issues or questions:

1. Check Supabase docs
2. Join Supabase Discord
3. Review migration guide (SUPABASE_MIGRATION_GUIDE.md)
4. Check quick start (SUPABASE_QUICK_START.md)
