# 📋 Quick Reference Card - Study Helper

## 🎯 ONE-COMMAND START (EASIEST WAY)

```bash
cd /Users/COOKIES/Study-Guide---Helper-
./start-app.sh
```

Then open: **http://localhost:5173**

---

## ⚡ What You Need Installed

Before using the app, make sure you have:

1. **Docker Desktop** - Download from: https://www.docker.com/products/docker-desktop

   - Required for Supabase database
   - **Install this first if you don't have it!**

2. **Node.js** - ✅ Already installed (npm working)

3. **Supabase CLI** - ✅ Already installed (v2.65.2)

---

## 🚨 IMPORTANT: Start Docker First!

**Before running the app:**

1. Open Docker Desktop app
2. Wait for it to fully start (icon in menu bar should be solid)
3. Then run: `./start-app.sh`

---

## 📚 Daily Study Workflow

### Morning Setup (30 seconds)

```bash
# Open Docker Desktop app (if not running)
# Then run:
cd /Users/COOKIES/Study-Guide---Helper-
./start-app.sh
```

### Study Time

1. Go to http://localhost:5173
2. Login
3. Practice questions
4. Build your streak! 🔥

### Evening Shutdown

```bash
# Press Ctrl+C to stop frontend
# Then:
supabase stop
```

---

## 🛠️ If Something Goes Wrong

### Docker not running?

→ Open Docker Desktop app and wait for it to start

### "Port already in use"?

```bash
lsof -ti:5173 | xargs kill -9
lsof -ti:54321 | xargs kill -9
```

### Database issues?

```bash
supabase db reset
```

### Start fresh?

```bash
supabase stop
docker system prune -f
./start-app.sh
```

---

## ✅ Your Setup Status

- ✅ Supabase project: ybcrtgdzmziclaohvjaz.supabase.co
- ✅ Claude API key: Configured
- ✅ Frontend dependencies: Installed
- ⚠️ Docker Desktop: **Check if installed**

---

## 🎓 Ready to Start?

1. Install Docker Desktop (if needed)
2. Run: `./start-app.sh`
3. Create account at http://localhost:5173
4. Upload your study materials
5. Start practicing!

**Good luck with your exam! 🚀**
