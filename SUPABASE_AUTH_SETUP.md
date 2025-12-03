# Supabase Authentication Setup

## Issue: Registration Getting Stuck

The registration is likely hanging because of one of these reasons:

### 1. Email Confirmation Required (Most Likely)

Your Supabase project has email confirmation enabled by default. You have two options:

#### Option A: Disable Email Confirmation (Recommended for Development)

1. Go to: https://supabase.com/dashboard/project/ybcrtgdzmziclaohvjaz/auth/providers
2. Click on **Email** provider
3. Find **"Confirm email"** setting
4. Toggle it **OFF**
5. Click **Save**

#### Option B: Keep Email Confirmation (Production Setup)

If you want to keep email confirmation:

1. After creating an account, check your email inbox
2. Click the confirmation link in the email
3. Then you can log in

### 2. Database Migrations Not Applied

The database tables and triggers need to be set up. Run:

```bash
cd /Users/COOKIES/Study-Guide---Helper-
supabase db push
```

If you get errors about tables already existing, that's okay - it means some tables were already created.

### 3. Check Site URL Settings

Make sure your site URL is configured correctly:

1. Go to: https://supabase.com/dashboard/project/ybcrtgdzmziclaohvjaz/auth/url-configuration
2. Set **Site URL** to: `http://localhost:5173`
3. Add to **Redirect URLs**: `http://localhost:5173/**`
4. Click **Save**

## Testing Registration

1. Open the browser console (F12)
2. Try to register with a new email
3. Check the console for any error messages
4. Look for logs that say "Registration data:" to see the response

## Current Configuration

Your `.env` file is configured with:

- `VITE_SUPABASE_URL=https://ybcrtgdzmziclaohvjaz.supabase.co`
- `VITE_SUPABASE_ANON_KEY=[your-anon-key]`

The registration page has been updated to:

- Show a success message if email confirmation is required
- Display detailed error messages
- Log errors to the console for debugging
