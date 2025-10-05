# Influent

A language learning platform that helps you learn Japanese through real-world content from Reddit, news sources, and social media.

## Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Icons**: Lucide React
- **State Management**: React Hooks + Context API
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Build Tool**: Vite
- **Package Manager**: pnpm

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/gongahkia/cs206-influent
cd influent
pnpm install
cd backend
npm install
cd ..
```

### 2. Set Up Firebase

**IMPORTANT**: Before running the app, you must set up Firebase.

Follow the detailed guide: **[Firebase Setup Guide](./FIREBASE_SETUP.md)**

Quick summary:
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Email/Password and Google authentication
3. Create a Firestore database
4. Copy your Firebase config to `.env` file

```bash
# Create .env file in the project root
cp .env.example .env

# Add your Firebase credentials to .env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Run the Application

Open 2 terminals:

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
pnpm run dev
```

The app will be available at `http://localhost:5173`

## Features

### 🔐 User Authentication
- Email/Password registration and login
- Google OAuth integration
- Secure user sessions

### 📚 Personal Dictionary
- Add words from real content
- Translations and example sentences
- Organized by difficulty level
- Syncs across all devices

### 🃏 Spaced Repetition Flashcards
- SM-2 algorithm for optimal learning
- Track progress and review schedule
- Keyboard shortcuts for fast reviews
- Progress persists across devices

### 📰 Multi-Source Content
- Reddit posts in Japanese
- News articles (NewsAPI, Guardian)
- Difficulty levels (Beginner to Native)
- Mixed-language learning mode

### ☁️ Cloud Data Persistence
- All data stored in Firebase Firestore
- Real-time synchronization
- Access from any device
- Never lose your progress

## Documentation

- **[Firebase Setup Guide](./FIREBASE_SETUP.md)** - Complete Firebase configuration
- **[Database Migration Guide](./DATABASE_MIGRATION.md)** - How data persistence works
- **[Security Implementation](./SECURITY.md)** - Encryption and security measures
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Complete implementation overview
- **[TODO List](./TODO.md)** - Planned features and improvements

## Clarification on architecture

`/backend/services/`: Backend
1. newsService.js (218 lines)
    - Actually fetches posts from Reddit, NewsAPI, Guardian APIs
    - Handles API keys, rate limiting, caching
    - Normalizes data from different sources
2. translationService.js (284 lines)
    - Actually translates text using external APIs (Lingva, MyMemory, LibreTranslate)
    - Handles retries, fallbacks, caching
    - Creates mixed-language content with NLP
3. vocabularyService.js (190 lines)
    - Uses NLP library (compromise) to analyze text
    - Detects nouns, verbs, adjectives, etc.
    - Determines word difficulty levels

`/src/services/`: Frontend
1. newsService.js (77 lines)
    - Just calls fetch() to backend API
    - Handles errors and returns data
2. translationService.js (105 lines)
    - Just calls fetch() to backend API
    - Has helper methods like containsJapanese()
3. vocabularyService.js (159 lines)
    - Just calls fetch() to backend API
    - Has client-side word validation for quick feedback

## News Sources Status

| Source | Status | API Key Required | Configuration |
|--------|--------|------------------|---------------|
| Reddit | ✅ Active | No | Enabled by default - Pulls from Japanese-themed subreddits (japan, japanese, japanlife, japantravel, learnjapanese) |
| Twitter | ⚙️ Configurable | Yes | Configure via **Profile > Developer Mode** tab - Enter your Twitter API Bearer Token from [developer.twitter.com](https://developer.twitter.com) |
| Instagram | ⚙️ Configurable | Yes | Configure via **Profile > Developer Mode** tab - Enter your Instagram username and password (use a dedicated account) |

**Note:** Twitter and Instagram credentials are stored in your browser's sessionStorage and are never sent to our servers. They are only used for API requests to fetch posts.

## AI Features

### Comment Suggestions (Powered by Google Gemini 2.0 Flash)

Influent now includes AI-powered comment suggestions to help you practice writing in mixed Japanese-English:

- **Smart Suggestions**: Get contextual comment suggestions based on post content
- **Mixed Language**: AI suggests comments that naturally blend English and Japanese
- **Learning Focused**: Suggestions are designed to help language learners practice
- **Free Tier**: Uses Gemini 2.0 Flash (free tier) - no cost to use
- **Fallback Support**: Works even without API key with basic suggestions

**Setup**:
1. Get a free API key from [Google AI Studio](https://ai.google.dev/)
2. Add to `backend/.env`: `GEMINI_API_KEY=your_api_key_here`
3. The AI Help button in comments will now use real-time AI suggestions

### Reddit-Style Comment Threading

- **Nested Replies**: Reply to any comment to create conversation threads
- **Collapse/Expand**: Click arrows to hide/show comment threads
- **Visual Threading**: Vertical lines show comment hierarchy
- **Interactive**: Like, reply, and learn from every comment
