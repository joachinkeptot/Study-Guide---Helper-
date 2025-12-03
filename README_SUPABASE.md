# 🚀 Complete Supabase Migration Guide

Your Study Guide Helper has been restructured to use **Supabase** instead of a Flask backend. This provides a simpler, more scalable architecture with built-in authentication, real-time capabilities, and automatic API generation.

---

## 📁 What's New

### New Files Created

```
supabase/
├── migrations/
│   ├── 00001_initial_schema.sql          ← Database tables
│   └── 00002_rls_policies.sql            ← Security policies
├── functions/
│   ├── select-problem/index.ts           ← Smart problem selection
│   ├── update-confidence/index.ts        ← Progress tracking
│   └── call-claude/index.ts              ← Claude API proxy
├── config.toml                           ← Supabase config
├── .env.example                          ← Edge function env vars
└── deploy.sh                             ← Deployment script

frontend/src/
├── lib/
│   ├── supabase.js                       ← Supabase client
│   └── supabase-api.js                   ← API wrapper functions
└── stores/
    └── auth-supabase.js                  ← Updated auth store

Docs:
├── SUPABASE_MIGRATION_GUIDE.md           ← Detailed migration guide
├── SUPABASE_MIGRATION_SUMMARY.md         ← Summary of changes
└── SUPABASE_QUICK_START.md               ← Quick start guide
```

---

## 🎯 Quick Start (5 Steps)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details
5. Wait for provisioning (~2 minutes)
6. **Save these values**:
   - Project URL
   - Anon public key
   - Service role key (keep secret!)

### Step 2: Set Up Database

1. Open your project in Supabase Dashboard
2. Go to **SQL Editor**
3. Click "New Query"
4. Copy/paste content from `supabase/migrations/00001_initial_schema.sql`
5. Click "Run"
6. Repeat for `supabase/migrations/00002_rls_policies.sql`

### Step 3: Deploy Edge Functions

```bash
cd supabase

# Login to Supabase
npx supabase login

# Link to your project (get ref from dashboard URL)
npx supabase link --project-ref your-project-ref

# Deploy all functions
./deploy.sh

# Set Claude API key secret
npx supabase secrets set CLAUDE_API_KEY=your_claude_api_key
```

### Step 4: Configure Frontend

```bash
cd frontend

# Install Supabase client
npm install @supabase/supabase-js

# Remove old dependency
npm uninstall axios

# Create environment file
cp .env.example .env.local

# Edit .env.local with your values:
# VITE_SUPABASE_URL=https://xxxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Step 5: Update Your Code

You need to update your Svelte components to use the new Supabase API.

**Example: Update Login Component**

```javascript
// OLD - Flask API
import { authAPI } from "$lib/api";
await authAPI.login(email, password);

// NEW - Supabase
import { auth } from "$stores/auth-supabase";
await auth.login(email, password);
```

**Example: Fetch Study Guides**

```javascript
// OLD - Flask API
import { api } from "$lib/api";
const guides = await api.get("/api/study-guides");

// NEW - Supabase
import supabaseAPI from "$lib/supabase-api";
const guides = await supabaseAPI.studyGuides.getAll();
```

---

## 🔄 API Migration Reference

### Authentication

| Old (Flask)                         | New (Supabase)                   |
| ----------------------------------- | -------------------------------- |
| `authAPI.login(email, password)`    | `auth.login(email, password)`    |
| `authAPI.register(email, password)` | `auth.register(email, password)` |
| `authAPI.logout()`                  | `auth.logout()`                  |

### Study Guides

| Old (Flask)                                | New (Supabase)                                             |
| ------------------------------------------ | ---------------------------------------------------------- |
| `api.get('/api/study-guides')`             | `supabaseAPI.studyGuides.getAll()`                         |
| `api.get('/api/study-guides/' + id)`       | `supabaseAPI.studyGuides.getById(id)`                      |
| `api.post('/api/study-guides', data)`      | `supabaseAPI.studyGuides.create(title, filename, content)` |
| `api.put('/api/study-guides/' + id, data)` | `supabaseAPI.studyGuides.update(id, updates)`              |
| `api.delete('/api/study-guides/' + id)`    | `supabaseAPI.studyGuides.delete(id)`                       |

### Topics

| Old (Flask)                             | New (Supabase)                                          |
| --------------------------------------- | ------------------------------------------------------- |
| `api.get('/api/topics?guide_id=' + id)` | `supabaseAPI.topics.getByStudyGuide(id)`                |
| `api.post('/api/topics', data)`         | `supabaseAPI.topics.create(guideId, name, desc, order)` |
| `api.put('/api/topics/' + id, data)`    | `supabaseAPI.topics.update(id, updates)`                |
| `api.delete('/api/topics/' + id)`       | `supabaseAPI.topics.delete(id)`                         |

### Practice

| Old (Flask)                              | New (Supabase)                                             |
| ---------------------------------------- | ---------------------------------------------------------- |
| `api.post('/api/practice/start', data)`  | `supabaseAPI.practice.startSession(guideId)`               |
| `api.post('/api/practice/next', data)`   | `supabaseAPI.practice.getNextProblem(sessionId, topicIds)` |
| `api.post('/api/practice/submit', data)` | `supabaseAPI.practice.submitAnswer(...)`                   |
| `api.post('/api/practice/end', data)`    | `supabaseAPI.practice.endSession(sessionId)`               |

---

## 🏗️ Architecture Comparison

### Before (Flask)

```
Frontend (Svelte)
    ↓ HTTP Requests
Flask API Server
    ↓ SQLAlchemy
PostgreSQL Database
```

### After (Supabase)

```
Frontend (Svelte)
    ↓ Direct Connection
Supabase (PostgreSQL + Auth + PostgREST)
    ↓ For Complex Logic
Edge Functions (Deno)
```

---

## ✅ Testing Checklist

After migration, test these features:

- [ ] **Authentication**
  - [ ] User registration
  - [ ] User login
  - [ ] Token persistence
  - [ ] Logout
- [ ] **Study Guides**
  - [ ] List all guides
  - [ ] View guide details
  - [ ] Create new guide
  - [ ] Update guide
  - [ ] Delete guide
- [ ] **Topics**
  - [ ] View topics in guide
  - [ ] Create topic
  - [ ] Update topic
  - [ ] Delete topic
- [ ] **Practice Mode**
  - [ ] Start session
  - [ ] Get next problem
  - [ ] Submit answer
  - [ ] View feedback
  - [ ] Use hints
  - [ ] End session
- [ ] **Progress Tracking**
  - [ ] View progress
  - [ ] Confidence updates
  - [ ] Mastery status

---

## 🎨 Benefits of Supabase

### 1. **Simpler Architecture**

- No backend server to deploy
- No API routes to maintain
- Fewer files and dependencies

### 2. **Better Security**

- Row Level Security enforced at database
- Automatic SQL injection protection
- Built-in auth with sessions

### 3. **Better Performance**

- Direct database queries
- No API overhead
- CDN-distributed Edge Functions

### 4. **Real-time Ready**

- Built-in subscriptions
- Live updates available
- WebSocket connections

### 5. **Developer Experience**

- Auto-generated API docs
- Type-safe queries
- Excellent documentation

### 6. **Cost Effective**

- **Free tier includes:**
  - 500MB database
  - 2GB bandwidth/month
  - 2GB file storage
  - 500K Edge Function invocations
  - Unlimited API requests

---

## 🔧 Troubleshooting

### "Missing Supabase environment variables"

- Check that `.env.local` exists in frontend directory
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart dev server after adding variables

### "Failed to fetch" errors

- Verify Supabase project URL is correct
- Check RLS policies are applied
- Ensure user is authenticated

### Edge Functions not working

- Verify functions are deployed: `supabase functions list`
- Check secrets are set: `supabase secrets list`
- View logs: `supabase functions logs select-problem`

### Database errors

- Verify migrations ran successfully
- Check RLS policies in Supabase Dashboard
- Review table structure matches schema

---

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security
- **Supabase JS Client**: https://supabase.com/docs/reference/javascript
- **CLI Reference**: https://supabase.com/docs/reference/cli

---

## 🆘 Support

Need help? Check these files:

1. `SUPABASE_MIGRATION_GUIDE.md` - Detailed migration steps
2. `SUPABASE_QUICK_START.md` - Quick setup guide
3. `SUPABASE_MIGRATION_SUMMARY.md` - What changed

Or visit:

- Supabase Discord: https://discord.supabase.com
- Supabase GitHub: https://github.com/supabase/supabase

---

## 🎉 You're Ready!

Your application is now powered by Supabase. Enjoy the simpler architecture, better security, and improved scalability!

**Next steps:**

1. Follow the Quick Start above
2. Test all features
3. Deploy to production
4. Remove old Flask backend (optional)

Happy coding! 🚀
