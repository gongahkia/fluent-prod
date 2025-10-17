# Reddit OAuth Integration - Setup Guide

## Overview

This integration allows users to connect their Reddit account via OAuth 2.0 to sync their subscribed subreddits. **All existing public Reddit scraping functionality remains unchanged and fully functional.**

## Features

- ✅ Secure OAuth 2.0 flow with `mysubreddits` and `identity` scopes
- ✅ Encrypted token storage in Firebase
- ✅ Automatic token refresh on expiration
- ✅ Manual subreddit sync button in user profile
- ✅ Display synced subreddit count and last sync time
- ✅ Read-only synced subreddits (users can't uncheck them)
- ✅ **Backward compatible** - public scraping continues to work without OAuth

## Architecture

```
┌─────────────────┐     OAuth     ┌────────────┐
│  Fluent Frontend│ ──────────────→│   Reddit   │
│  (React)        │ ←──────────────│   OAuth    │
└────────┬────────┘   Authorization └────────────┘
         │
         │ Exchange code + sync
         ↓
┌─────────────────┐   Store tokens  ┌────────────┐
│ Fluent Backend  │ ──────────────→│  Firebase  │
│  (Express)      │                 │  Firestore │
└─────────────────┘                 └────────────┘
```

## Prerequisites

### 1. Reddit App Registration

1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Fill in the form:
   - **Name**: Fluent Language Learning
   - **App type**: Select "web app"
   - **Description**: Language learning platform
   - **About URL**: (optional) Your website
   - **Redirect URI**: `http://localhost:5173/auth/reddit/callback` (dev)
   - For production, add: `https://your-domain.com/auth/reddit/callback`
4. Click "Create app"
5. Note down:
   - **Client ID**: String under "personal use script" or app name
   - **Client Secret**: String labeled "secret"

### 2. Encryption Key Generation

Run this command to generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output (a 44-character base64 string).

## Backend Setup

### 1. Environment Variables

Add these to your `backend/.env` file:

```env
# Reddit OAuth Configuration
REDDIT_CLIENT_ID=your_reddit_client_id_here
REDDIT_CLIENT_SECRET=your_reddit_client_secret_here
REDDIT_REDIRECT_URI=http://localhost:5173/auth/reddit/callback

# Encryption Key (REQUIRED)
ENCRYPTION_KEY=your_generated_encryption_key_here
```

**⚠️ IMPORTANT:**
- **Never** commit `.env` to version control
- Keep `ENCRYPTION_KEY` secret
- For production, update `REDDIT_REDIRECT_URI` to your production domain

### 2. Verify Backend Routes

The following routes are now available:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/reddit/status` | GET | Check if OAuth is configured |
| `/api/reddit/auth/url` | GET | Get authorization URL |
| `/api/reddit/auth/callback` | POST | Handle OAuth callback |
| `/api/reddit/sync-subreddits` | POST | Sync user's subreddits |
| `/api/reddit/disconnect` | POST | Disconnect Reddit account |

### 3. Start Backend

```bash
cd backend
npm install
npm start
```

Verify it's working:
```bash
curl http://localhost:3001/api/reddit/status
```

Should return:
```json
{
  "configured": true,
  "message": "Reddit OAuth is configured"
}
```

## Frontend Setup

### 1. Environment Variables

Add to `.env` (if not already present):

```env
VITE_API_URL=http://localhost:3001
```

### 2. Start Frontend

```bash
npm install
npm run dev
```

## User Flow

### Connecting Reddit Account

1. User logs into Fluent
2. Navigate to **Profile** → **Connected Accounts** tab
3. Click **"Connect"** button on Reddit Account card
4. User is redirected to Reddit OAuth page
5. User authorizes the app (scopes: `mysubreddits`, `identity`)
6. User is redirected back to `/auth/reddit/callback`
7. Callback handler:
   - Exchanges authorization code for tokens
   - Encrypts and stores tokens in Firebase
   - Fetches Reddit username
   - Updates user profile
8. User is redirected back to profile page
9. Status shows: "Connected as @username"

### Syncing Subreddits

1. Click **"Sync"** button in Connected Accounts tab
2. Backend:
   - Decrypts stored tokens
   - Checks if access token expired
   - Refreshes token if needed (reactive refresh)
   - Calls `GET /subreddits/mine/subscriber`
   - Handles pagination (up to 100 per page)
   - Stores subreddit list in Firebase
3. Success message shows: "Successfully synced X subreddits!"
4. Page refreshes to display updated data

### Disconnecting

1. Click **"Disconnect"** button
2. Confirmation dialog appears
3. If confirmed:
   - Revokes Reddit access token
   - Removes encrypted credentials from Firebase
   - Clears Reddit metadata from user profile
4. Status updates to "Not connected"

## Database Schema

```javascript
users/{uid}/
  ├── reddit: {
  │     connected: boolean,
  │     username: string,           // e.g., "user123"
  │     redditId: string,            // Reddit user ID
  │     syncedSubreddits: string[], // e.g., ["japan", "tokyo", "anime"]
  │     lastSynced: timestamp
  │   }
  │
  └── credentials: {
        reddit: <encrypted_string>   // Encrypted JSON containing:
                                      // {
                                      //   accessToken,
                                      //   refreshToken,
                                      //   expiresAt,
                                      //   scope
                                      // }
      }
```

## Token Refresh Strategy

**Reactive Refresh** (current implementation):

- Tokens are refreshed **only when they expire**
- Expiration is checked before API calls
- On `401 Unauthorized` error:
  1. Backend attempts to refresh token
  2. Updates encrypted credentials in Firebase
  3. Retries original request
  4. If refresh fails, user must reconnect

**Why Reactive?**
- Simpler implementation
- Less backend overhead
- Tokens last 1 hour (Reddit default)
- Users typically sync occasionally, not continuously

## Security Features

### Encryption

- **Algorithm**: AES-256-GCM
- **Key**: 256-bit server-side key (env variable)
- **IV**: Random 16-byte initialization vector per encryption
- **Auth Tag**: 16-byte authentication tag for integrity

### CSRF Protection

- State parameter generated server-side
- Stored in `sessionStorage` on client
- Verified on callback
- Cleared after use

### Token Storage

- Never stored in localStorage (XSS risk)
- Encrypted before storing in Firebase
- Decrypted only on backend
- Never sent to frontend

## Backward Compatibility

**✅ All existing functionality remains unchanged:**

- Public Reddit scraping via `https://www.reddit.com/r/<subreddit>.json`
- No authentication required for public posts
- Scheduled job continues to fetch and cache posts
- Users without connected Reddit accounts can still use the app
- OAuth is **completely optional**

## Troubleshooting

### "Reddit OAuth not configured" Error

**Cause**: Missing or invalid environment variables

**Solution**:
1. Check `backend/.env` has all Reddit variables
2. Restart backend server
3. Verify: `curl http://localhost:3001/api/reddit/status`

### "Invalid state parameter" Error

**Cause**: CSRF state mismatch

**Solutions**:
- Clear browser `sessionStorage`
- Ensure cookies are enabled
- Check for browser extensions blocking storage

### "Failed to refresh token" Error

**Cause**: Refresh token expired or revoked

**Solution**:
- User must disconnect and reconnect Reddit account
- Refresh tokens are permanent unless revoked

### Encryption Errors

**Cause**: Missing or changed `ENCRYPTION_KEY`

**Solution**:
1. If key is lost, all encrypted data is unrecoverable
2. Users must disconnect and reconnect accounts
3. **Never change the encryption key** unless re-encrypting all data

### "403 Forbidden" from Reddit API

**Cause**: Invalid User-Agent or rate limiting

**Solutions**:
- User-Agent is set correctly in `redditOAuthService.js`
- Reddit rate limit: 60 requests per minute
- Wait 1 minute and retry

## Testing

### Backend Tests

```bash
cd backend

# Check status
curl http://localhost:3001/api/reddit/status

# Get auth URL (manual test)
curl http://localhost:3001/api/reddit/auth/url

# Test encryption
node -e "import('./services/encryptionService.js').then(m => {
  const data = { test: 'hello' };
  const encrypted = m.encryptData(data);
  const decrypted = m.decryptData(encrypted);
  console.log('Decrypted:', decrypted);
})"
```

### Frontend Tests

1. Log into Fluent
2. Navigate to Profile → Connected Accounts
3. Click "Connect" on Reddit Account
4. Authorize on Reddit
5. Verify redirect back to Fluent
6. Check status shows "Connected as @username"
7. Click "Sync" button
8. Verify subreddit count updates
9. Click "Disconnect"
10. Verify status shows "Not connected"

## Production Deployment

### 1. Update Environment Variables

**Backend**:
```env
NODE_ENV=production
REDDIT_REDIRECT_URI=https://your-production-domain.com/auth/reddit/callback
ENCRYPTION_KEY=<your_production_key>
```

**Frontend**:
```env
VITE_API_URL=https://your-backend-domain.com
```

### 2. Update Reddit App

1. Go to https://www.reddit.com/prefs/apps
2. Edit your app
3. Add production redirect URI:
   - `https://your-production-domain.com/auth/reddit/callback`
4. Save changes

### 3. Deploy

Follow your normal deployment process. The OAuth flow will automatically use the production redirect URI.

## API Rate Limits

**Reddit OAuth API**:
- **Rate Limit**: 60 requests per minute
- **Token Expiration**: 1 hour (access token)
- **Refresh Token**: Never expires (unless revoked)

**Recommendations**:
- Cache subreddit lists in Firestore (already implemented)
- Sync only when user clicks button (already implemented)
- Show "last synced" timestamp to users (already implemented)

## Future Enhancements

### Potential Features
- [ ] Auto-sync subreddits daily (background job)
- [ ] Filter synced subreddits by language
- [ ] Allow users to exclude specific subreddits
- [ ] Display subreddit list in settings UI
- [ ] Sync user's saved Reddit posts
- [ ] Fetch posts from user's multireddits

### Not Implemented (Per Requirements)
- ❌ Visual differentiation for synced subreddits (badges/icons)
- ❌ Proactive token refresh (background job)
- ❌ Subreddit filtering by language
- ❌ Auto-sync on app load

## Support

If you encounter issues:

1. Check backend logs: `npm start` (dev mode shows detailed logs)
2. Check browser console: F12 → Console tab
3. Verify environment variables are set correctly
4. Check Reddit app configuration
5. Verify Firebase configuration

## License

This integration follows the same license as the main Fluent project.

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0
**Status**: ✅ Ready for Production
