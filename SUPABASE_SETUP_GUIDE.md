# Supabase Setup Guide

This guide will walk you through setting up your Supabase project for the Fluent application.

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project Name:** fluent-prod (or your preferred name)
   - **Database Password:** Choose a strong password (save this!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier is fine to start

5. Wait for project to be created (~2 minutes)

## Step 2: Get Your Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in left sidebar)
2. Click on **API** section
3. You'll need these values:

### Required Environment Variables:

Copy these values - you'll add them to your `.env` files:

```bash
# Project URL (looks like: https://xxxxx.supabase.co)
SUPABASE_URL=

# Project API Key - "anon" / "public" key (starts with eyJ...)
SUPABASE_ANON_KEY=

# Service Role Key - "service_role" key (starts with eyJ...)
# ⚠️ KEEP THIS SECRET! Only use on backend
SUPABASE_SERVICE_ROLE_KEY=

# Database Connection String (for Prisma)
# Found in: Project Settings > Database > Connection String > URI
# Make sure to replace [YOUR-PASSWORD] with your actual database password
DATABASE_URL=
```

### Where to find Database URL:

1. Go to **Project Settings > Database**
2. Under **Connection String**, select **URI** tab
3. Copy the connection string
4. **IMPORTANT:** Replace `[YOUR-PASSWORD]` with the password you set in Step 1
5. The format should be: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

## Step 3: Enable Realtime

1. Go to **Database** in left sidebar
2. Click **Replication**
3. Make sure the following tables have Realtime enabled (we'll create these tables later):
   - `dictionary_words`
   - `saved_posts`
   - `collections`

## Step 4: Configure Authentication

1. Go to **Authentication** in left sidebar
2. Click **Providers**
3. Enable:
   - ✅ **Email** (enabled by default)
   - ✅ **Google** (if you want Google OAuth)
     - For Google: You'll need Google OAuth credentials
     - Add your Google Client ID and Secret
     - Add redirect URL: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`

4. Go to **Authentication > URL Configuration**
5. Add your frontend URL to **Redirect URLs**:
   - Development: `http://localhost:5173`
   - Production: Your production domain

## Step 5: Update Environment Variables

### Frontend `.env` file:

```bash
# Remove old Firebase variables
# VITE_FIREBASE_API_KEY=...
# VITE_FIREBASE_PROJECT_ID=...
# etc.

# Add Supabase variables
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

### Backend `.env` file:

```bash
# Remove old Firebase variables
# FIREBASE_PROJECT_ID=...
# FIREBASE_PRIVATE_KEY=...
# etc.

# Add Supabase variables
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Keep these existing variables:
PORT=3001
GEMINI_API_KEY=your-existing-key
REDDIT_CLIENT_ID=your-existing-id
REDDIT_CLIENT_SECRET=your-existing-secret
ENCRYPTION_KEY=your-existing-key
ALLOWED_ORIGINS=http://localhost:5173
```

## Step 6: Verify Setup

After completing the migration, you can verify everything works:

1. **Test Database Connection:**
   ```bash
   cd backend
   npx prisma db push
   ```

2. **Test Authentication:**
   - Try signing up a new user in your app
   - Check **Authentication > Users** in Supabase dashboard

3. **Test Database:**
   - Check **Database > Tables** to see your schema
   - Use **SQL Editor** to query data

## Troubleshooting

### "Invalid API Key" Error
- Double-check you copied the full API key
- Make sure there are no extra spaces
- Verify you're using `SUPABASE_ANON_KEY` in frontend and `SUPABASE_SERVICE_ROLE_KEY` in backend

### "Connection Refused" Error
- Verify your DATABASE_URL has the correct password
- Check that your IP is not blocked (Supabase allows all IPs by default)
- Confirm the project URL is correct

### "Migration Failed" Error
- Make sure your database password is correct in DATABASE_URL
- Check Supabase project is fully initialized (wait 2-3 minutes after creation)

## Security Checklist

- ✅ Never commit `.env` files to git
- ✅ Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend
- ✅ Keep `DATABASE_URL` password secure
- ✅ Use anon key only in frontend
- ✅ Use service role key only in backend

## Next Steps

Once you've completed this setup:
1. The migration script will install necessary dependencies
2. Prisma schema will be generated
3. Database tables will be created
4. Your app will be ready to use Supabase!

---

**Ready?** Once you have all the credentials, the migration will proceed automatically.
