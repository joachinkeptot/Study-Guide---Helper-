# Personal Use Setup - Ready for Your Exam! 🎓

**Exam in 5 days - Here's what you need to do:**

## ✅ Already Done

- ✓ Supabase project configured (ybcrtgdzmziclaohvjaz.supabase.co)
- ✓ Claude API key set up for AI features
- ✓ Frontend dependencies installed
- ✓ Environment variables configured

## 🚀 Quick Start (3 Steps)

### Step 1: Start Supabase Locally (for development)

```bash
cd /Users/COOKIES/Study-Guide---Helper-
supabase start
```

This starts your local database. **Keep this terminal open.**

### Step 2: Start the Frontend

Open a new terminal:

```bash
cd /Users/COOKIES/Study-Guide---Helper-/frontend
npm run dev
```

**Keep this terminal open too.**

### Step 3: Open the App

Go to: **http://localhost:5173**

---

## 📝 First Time Using the App

### 1. Create Your Account

- Click "Register"
- Use any email (for local use, you can use: `student@study.com`)
- Set a password you'll remember

### 2. Upload Your Study Material

- Go to Dashboard
- Click "Upload Study Guide"
- Upload your PDF or paste your study content
- The AI will process it into study cards

### 3. Start Practicing

- Select a guide
- Click "Start Practice"
- Answer questions
- Get instant AI feedback
- Track your streak!

---

## 💡 Quick Commands Reference

### Start Everything (Daily Use)

```bash
# Terminal 1 - Start Supabase
cd /Users/COOKIES/Study-Guide---Helper-
supabase start

# Terminal 2 - Start Frontend
cd /Users/COOKIES/Study-Guide---Helper-/frontend
npm run dev
```

### Stop Everything (When Done Studying)

```bash
# Stop frontend: Press Ctrl+C in Terminal 2
# Stop Supabase:
supabase stop
```

### If Something Breaks

```bash
# Reset database
supabase db reset

# Restart frontend
cd frontend
npm run dev
```

---

## 🎯 Study Tips for Your Exam

### Daily Routine (Next 5 Days)

1. **Upload your notes** - Break them into topics
2. **Practice 20+ questions daily** - Build that streak! 🔥
3. **Review wrong answers** - AI explains why
4. **Track progress** - Use the progress dashboard
5. **Focus on weak areas** - The app tracks your confidence

### Features You Should Use:

- ✅ **Daily Streak Tracker** - Keeps you motivated
- ✅ **AI Explanations** - Learn from mistakes
- ✅ **Confidence Scoring** - Know what to study more
- ✅ **Practice Sessions** - Timed or untimed
- ✅ **Math Solver** - For math/science questions

---

## 🔧 Troubleshooting

### "Cannot connect to database"

```bash
supabase start
```

### "API key not found" or AI not working

Check: `/Users/COOKIES/Study-Guide---Helper-/supabase/functions/.env`
Your key is there (starts with `sk-ant-api03-...`)

### Frontend won't start

```bash
cd frontend
npm install
npm run dev
```

### Port already in use

```bash
# Kill the process using port 5173
lsof -ti:5173 | xargs kill -9
# Then restart
npm run dev
```

---

## 📊 Your Current Setup

**Frontend**: http://localhost:5173
**Supabase Project**: https://ybcrtgdzmziclaohvjaz.supabase.co
**Local Database**: http://localhost:54323 (Supabase Studio)

**Environment**: Local development (perfect for personal use)

---

## 🎓 Pro Tips

1. **Upload all materials NOW** - Don't wait until the last day
2. **Study in focused 25-min sessions** - Use the practice timer
3. **Review your stats daily** - Check what topics need work
4. **Take breaks** - The app tracks your streak, not burnout
5. **Test yourself blind** - Don't peek at answers first

---

## 📞 Need Help?

Everything is running locally on your Mac. No internet needed after setup!

**Quick health check:**

- Frontend running? → http://localhost:5173 should open
- Database running? → `supabase status` should show services
- API working? → Try uploading a guide

---

## 🚨 DO THIS NOW (Before You Start Studying)

1. Run these commands to make sure everything works:

```bash
cd /Users/COOKIES/Study-Guide---Helper-
supabase start
cd frontend
npm run dev
```

2. Open http://localhost:5173
3. Create your account
4. Upload ONE test guide
5. Try answering a few questions
6. Confirm the AI feedback works

**If all that works → You're ready! Start uploading your real study materials! 📚**

---

_Good luck on your exam! You got this! 🎉_
