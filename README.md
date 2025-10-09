# Fluent

A language learning platform that helps you learn Japanese through real-world content from Reddit, news sources, and social media.

## Credentials

Details in the [Trello](https://trello.com/invite/b/68e720e4a8fe9ee3e93a9788/ATTI9a0b6e9fd51a7f333e5911cbe95ed4a21996498F/fluent).

## Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Icons**: Lucide React
- **State Management**: React Hooks + Context API
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Build Tool**: Vite
- **Package Manager**: pnpm

## Local Development Setup

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** (for frontend)
- **npm** >= 9.0.0 (for backend)
- **Firebase project** with Firestore and Authentication enabled
- **Gemini API key** (optional, for AI features)

### 1. Clone and Install Dependencies

```console
$ git clone https://github.com/gongahkia/big-livepeek
$ cd big-livepeek
$ pnpm install
$ cd backend
$ npm install
$ cd ..
```

### 2. Configure Frontend Environment Variables

Copy the example file and fill in your Firebase credentials:

```console
$ cp .env.example .env
```

Edit `.env` with your Firebase configuration:

```env
# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Leave these commented for local development
# VITE_API_URL=http://localhost:3001
# VITE_USE_LOCAL_API=true
```

### 3. Configure Backend Environment Variables

Copy the example file and fill in your credentials:

```console
$ cd backend
$ cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Firebase Admin SDK (Option 1: Use service account file - recommended for local dev)
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# Alternative Option 2: Use environment variables
# FIREBASE_PROJECT_ID=your_firebase_project_id
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# CORS Configuration (for local development)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Gemini API Key (optional but recommended)
GEMINI_API_KEY=your_gemini_api_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Scheduled Jobs
RUN_FETCH_ON_STARTUP=false
```

**Get Firebase Service Account Key:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts
3. Click "Generate new private key"
4. Save as `backend/serviceAccountKey.json`

### 4. Run the Application

Open **two separate terminals**:

**Terminal 1 - Backend Server**:

```console
$ cd backend
$ npm run dev
```

You should see: `🚀 Fluent Backend running on port 3001`

**Terminal 2 - Frontend Development Server**:

```console
$ pnpm run dev
```

The app will be available at `http://localhost:5173`

### 5. Verify Everything Works

- ✅ Frontend loads at `http://localhost:5173`
- ✅ Backend health check: `http://localhost:3001/health`
- ✅ Firebase authentication works
- ✅ News feed loads posts
- ✅ Translation features work

## Deployment

For production deployment to Render (backend) and Vercel/Netlify (frontend), see the comprehensive **[DEPLOYMENT.md](./DEPLOYMENT.md)** guide.

### Quick Deployment Checklist

**Backend (Render):**
- Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` as environment variables
- Set `ALLOWED_ORIGINS` to your frontend URL
- Set `NODE_ENV=production`

**Frontend (Vercel/Netlify):**
- Set all `VITE_FIREBASE_*` environment variables
- Set `VITE_API_URL` to your Render backend URL
- Build command: `pnpm build`
- Output directory: `dist`

**Important:** The backend must bind to `0.0.0.0` (already configured) for Render to route traffic correctly.

## Architecture

### Backend Services (`/backend/services/`)

1. **newsService.js** - Fetches posts from Reddit with caching and difficulty calculation
2. **translationService.js** - Multi-provider translation with fallbacks (Lingva, MyMemory, LibreTranslate)
3. **vocabularyService.js** - NLP-based vocabulary detection using Compromise.js
4. **aiService.js** - AI-powered comment suggestions using Gemini API
5. **storageService.js** - Firebase Storage integration for cached posts

### Frontend Services (`/src/services/`)

1. **newsService.js** - API client for backend news endpoints
2. **translationService.js** - API client for backend translation endpoints
3. **vocabularyService.js** - API client for backend vocabulary endpoints
4. **authService.js** - Firebase authentication wrapper
5. **databaseService.js** - Firestore database operations

### Content Sources

| Source | Status | API Key Required | Notes |
|--------|--------|------------------|-------|
| Reddit | ✅ Active | No | Primary content source, configured in `backend/config/subreddits.json` |

**Note:** Fluent exclusively uses Reddit to ensure consistent quality, pre-processed translations, and fast delivery without additional API credentials.