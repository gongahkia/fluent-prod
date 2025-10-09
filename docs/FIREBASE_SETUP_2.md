# Firebase Storage Setup for Posts Caching

This guide explains how to set up Firebase Admin SDK for caching Reddit posts in Firebase Storage.

## Why Firebase Storage?

The backend now pre-fetches Reddit posts and stores them in Firebase Storage to:
1. **Avoid Reddit IP blocking** - Render's datacenter IPs are blocked by Reddit
2. **Improve performance** - Frontend reads from cached posts instead of live API calls
3. **Reduce API calls** - Scheduled job fetches once daily instead of every user request

## Architecture Overview

```
┌─────────────────┐     Daily at 3 AM      ┌──────────────┐
│  Scheduled Job  │ ───────────────────────>│    Reddit    │
│   (Backend)     │                         │     API      │
└────────┬────────┘                         └──────────────┘
         │
         │ Uploads JSON
         ▼
┌─────────────────┐
│    Firebase     │
│    Storage      │
│  (posts cache)  │
└────────┬────────┘
         │
         │ Reads posts
         ▼
┌─────────────────┐     HTTP Request       ┌──────────────┐
│  newsService.js │ <──────────────────────│   Frontend   │
│   (Backend)     │ ───────────────────────>│  (React)     │
└─────────────────┘     Returns posts      └──────────────┘
```

## Setup Instructions

### Step 1: Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file (keep it safe!)

### Step 2: Enable Firebase Storage

1. In Firebase Console, go to **Storage**
2. Click **Get Started**
3. Choose **Start in production mode**
4. Select your storage location
5. Click **Done**

### Step 3: Configure Environment Variables

#### Option A: For Local Development

Create a `.env` file in the `backend/` directory:

```bash
# Copy from .env.example
cp .env.example .env
```

Then add your Firebase credentials:

```env
# Use service account file path
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# Run fetch on startup for testing
RUN_FETCH_ON_STARTUP=true
```

Place your `serviceAccountKey.json` file in the `backend/` directory.

#### Option B: For Production (Render)

In Render dashboard, add these environment variables:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
RUN_FETCH_ON_STARTUP=true
```

**Important:**
- Copy the `private_key` value from your service account JSON
- Keep the newline characters (`\n`) in the private key
- Wrap the entire key in quotes

### Step 4: Test the Setup

#### Start the Backend

```bash
cd backend
npm install
npm run dev
```

You should see:
```
✅ Firebase Admin initialized with environment variables
⏰ Daily posts fetch job initialized
🔄 Running initial posts fetch... (if RUN_FETCH_ON_STARTUP=true)
```

#### Manually Trigger Posts Fetch

```bash
curl -X POST http://localhost:3001/api/news/fetch
```

Check server logs for:
```
🚀 Starting scheduled posts fetch job...
📰 Fetching posts for: japan
✅ Successfully cached 30 posts for japan
📰 Fetching posts for: korea
✅ Successfully cached 30 posts for korea
✅ Posts fetch job completed!
```

#### Check Cached Posts

```bash
curl http://localhost:3001/api/news/cache
```

Should return:
```json
{
  "cachedFiles": [
    {
      "fileName": "posts-japan.json",
      "lastUpdated": "2025-10-09T12:00:00Z",
      "size": 125440,
      "contentType": "application/json"
    },
    {
      "fileName": "posts-korea.json",
      "lastUpdated": "2025-10-09T12:00:00Z",
      "size": 118920,
      "contentType": "application/json"
    }
  ],
  "count": 2
}
```

#### Test Frontend Integration

```bash
curl http://localhost:3001/api/news?query=japan&limit=5
```

Should return 5 posts from the cached `posts-japan.json` file.

## How It Works

### Daily Scheduled Job

The backend runs a scheduled job **every day at 3:00 AM**:

1. Fetches 30 posts for Japan query from Reddit
2. Fetches 30 posts for Korea query from Reddit
3. Uploads to Firebase Storage as JSON files:
   - `news-cache/posts-japan.json`
   - `news-cache/posts-korea.json`

### Frontend Requests

When the frontend calls `/api/news`:

1. Backend reads from Firebase Storage (not Reddit API)
2. Applies filters (search query, limit, shuffle)
3. Returns cached posts to frontend
4. Frontend processes for mixed-language content

### Search Functionality

Search now **filters pre-fetched posts** instead of making live API calls:

```javascript
// Frontend sends search query
GET /api/news?query=japan&search=tokyo

// Backend filters cached posts by title/content matching "tokyo"
// No live Reddit API call needed!
```

## API Endpoints

### GET /api/news

Fetch cached posts (main endpoint used by frontend)

**Query Parameters:**
- `query` - `japan` or `korea` (default: `japan`)
- `limit` - Number of posts (default: `10`)
- `search` - Filter posts by search term (optional)

**Example:**
```bash
curl "http://localhost:3001/api/news?query=korea&limit=5&search=seoul"
```

### POST /api/news/fetch

Manually trigger the posts fetch job (useful for testing)

**Example:**
```bash
curl -X POST http://localhost:3001/api/news/fetch
```

### GET /api/news/cache

Get information about cached posts files

**Example:**
```bash
curl http://localhost:3001/api/news/cache
```

## Scheduled Job Details

The job uses `node-cron` with the schedule:

```javascript
// Runs every day at 3:00 AM server time
cron.schedule('0 3 * * *', async () => {
  await runPostsFetchJob()
})
```

**Cron format:** `minute hour day month weekday`
- `0 3 * * *` = 3:00 AM every day

To change the schedule, edit `backend/jobs/fetchPostsJob.js`:

```javascript
// Example: Run every 6 hours
cron.schedule('0 */6 * * *', async () => {
  await runPostsFetchJob()
})
```

## Troubleshooting

### Firebase initialization failed

**Error:**
```
❌ Firebase initialization failed: Error: Invalid service account
```

**Solution:**
- Check that your Firebase credentials are correct in `.env`
- Verify the `FIREBASE_PROJECT_ID` matches your Firebase project
- Ensure `FIREBASE_PRIVATE_KEY` includes newline characters

### No cached posts found

**Error:**
```
⚠️  No cached posts found for japan. Run the scheduled job to fetch posts.
```

**Solution:**
1. Manually trigger the fetch job:
   ```bash
   curl -X POST http://localhost:3001/api/news/fetch
   ```
2. Or set `RUN_FETCH_ON_STARTUP=true` in `.env`
3. Check Firebase Storage console to verify files exist

### Posts not updating

**Issue:** Cached posts are stale

**Solution:**
- The job runs daily at 3 AM
- Manually trigger for immediate update:
  ```bash
  curl -X POST http://localhost:3001/api/news/fetch
  ```

### Reddit API still being called

**Issue:** Old code still making live Reddit API calls

**Solution:**
- Verify you're using the updated `newsService.js`
- Check server logs for "📥 Reading cached posts from..."
- If you see "Reddit API error", the old code is still running

## Firebase Storage Rules

To allow public reads, set these rules in Firebase Console > Storage > Rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read access to news-cache
    match /news-cache/{allPaths=**} {
      allow read: if true;
      allow write: if false; // Only backend can write
    }
  }
}
```

## Cost Considerations

Firebase Storage free tier:
- **5 GB stored**
- **1 GB downloaded per day**
- **20,000 writes per day**

With 30 posts × 2 queries × ~4 KB per post:
- Storage: ~240 KB (well within free tier)
- Writes: 2 per day (well within free tier)
- Downloads: Depends on user traffic

**Estimated cost:** $0/month for typical usage

## Next Steps

1. ✅ Set up Firebase credentials
2. ✅ Test manual fetch job
3. ✅ Verify cached posts in Firebase Storage console
4. ✅ Test frontend integration
5. 🚀 Deploy to production (Render)

## Questions?

Check the main README or create an issue on GitHub.
