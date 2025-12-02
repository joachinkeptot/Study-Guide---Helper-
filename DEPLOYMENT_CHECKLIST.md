# Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## 📋 Pre-Deployment

### Code Preparation

- [ ] All changes committed to Git
- [ ] Code reviewed and tested locally
- [ ] All tests passing (`npm test`, `pytest`)
- [ ] No sensitive data in code (API keys, passwords)
- [ ] `.env` files not committed (in `.gitignore`)
- [ ] Dependencies up to date (`npm audit`, `pip check`)

### Documentation

- [ ] README.md updated
- [ ] API documentation current
- [ ] Environment variables documented
- [ ] Deployment guide reviewed

## 🗄️ Database Setup (Supabase)

- [ ] Supabase account created
- [ ] New project created
- [ ] Database password saved securely
- [ ] Connection string copied
- [ ] Correct port selected (6543 for pooled)
- [ ] Database accessible from backend

## 🚂 Backend Deployment (Railway/Render)

### Railway Setup

- [ ] Railway account created
- [ ] Project linked to GitHub repository
- [ ] Root directory set to `backend`
- [ ] Start command configured

### Environment Variables Set

- [ ] `FLASK_ENV=production`
- [ ] `SECRET_KEY` (32+ characters)
- [ ] `JWT_SECRET_KEY` (32+ characters)
- [ ] `DATABASE_URL` (from Supabase)
- [ ] `CORS_ORIGINS` (placeholder for now)
- [ ] `PORT` (auto-set, verify if needed)

### Deployment Steps

- [ ] Initial deployment successful
- [ ] Backend URL obtained and saved
- [ ] Database migrations run: `railway run flask db upgrade`
- [ ] Health check passes: `curl https://your-backend.railway.app/health`
- [ ] API endpoints responding correctly

## ⚡ Frontend Deployment (Vercel)

### Vercel Setup

- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Root directory set to `frontend`
- [ ] Framework preset: SvelteKit
- [ ] Build settings correct

### Environment Variables Set

- [ ] `PUBLIC_API_URL` (backend Railway URL)

### Deployment Steps

- [ ] Initial deployment successful
- [ ] Frontend URL obtained and saved
- [ ] Site loads without errors
- [ ] No console errors in browser

## 🔄 Final Configuration

### Backend CORS Update

- [ ] Return to Railway backend
- [ ] Update `CORS_ORIGINS` with Vercel URL
- [ ] Backend redeployed

### Testing

- [ ] Frontend can reach backend API
- [ ] User registration works
- [ ] User login works
- [ ] Study guide upload works
- [ ] Practice session starts
- [ ] Data persists across sessions

## 🔒 Security Verification

- [ ] HTTPS enabled (automatic on Vercel/Railway)
- [ ] Strong secret keys used
- [ ] CORS restricted to frontend domain
- [ ] No API keys in client-side code
- [ ] Database credentials secure
- [ ] Rate limiting considered (optional)

## 📊 Monitoring Setup

### Railway

- [ ] Deployment notifications enabled
- [ ] Metrics dashboard reviewed
- [ ] Log retention configured

### Vercel

- [ ] Analytics enabled (optional)
- [ ] Error tracking reviewed
- [ ] Performance metrics checked

### Supabase

- [ ] Database logs reviewed
- [ ] Backup strategy confirmed
- [ ] Connection pooling verified

## 🧪 Post-Deployment Testing

### Smoke Tests

- [ ] Homepage loads
- [ ] Registration flow complete
- [ ] Login flow complete
- [ ] Dashboard accessible
- [ ] Can create study guide
- [ ] Can start practice session
- [ ] Can view progress

### Performance Tests

- [ ] Page load time acceptable (<3s)
- [ ] API response time acceptable (<500ms)
- [ ] No timeout errors
- [ ] Database queries optimized

### Browser Tests

- [ ] Chrome/Edge tested
- [ ] Firefox tested
- [ ] Safari tested (if available)
- [ ] Mobile responsive

## 📝 Documentation Updates

- [ ] Production URLs documented
- [ ] Access credentials saved securely (password manager)
- [ ] Team notified of deployment
- [ ] Deployment date recorded
- [ ] Monitoring dashboards bookmarked

## 🚀 Optional Enhancements

- [ ] Custom domain configured (Vercel)
- [ ] SSL certificate verified
- [ ] CDN configured for static assets
- [ ] Error tracking (Sentry) integrated
- [ ] Analytics (Google Analytics) added
- [ ] Backup automation setup
- [ ] Staging environment created

## 🎉 Launch

- [ ] All critical tests passing
- [ ] No known critical bugs
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation complete
- [ ] Team trained/notified
- [ ] **READY TO LAUNCH!** 🚀

---

## Rollback Plan

If something goes wrong:

### Backend Rollback

```bash
# Railway
railway rollback

# Or redeploy previous version via dashboard
```

### Frontend Rollback

1. Go to Vercel Dashboard
2. Deployments → Previous successful deployment
3. Click "Promote to Production"

### Database Rollback

```bash
# If migrations failed
flask db downgrade

# Restore from backup
psql $DATABASE_URL < backup.sql
```

---

## Support Contacts

- **Railway Support**: https://railway.app/help
- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Team Lead**: [Your contact info]

---

**Last Updated**: December 2, 2025
**Deployment Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete
