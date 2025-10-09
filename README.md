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

## Usage

1. Clone and Install Dependencies

```console
$ git clone https://github.com/gongahkia/big-
$ cd 
$ pnpm install
$ cd backend
$ npm install
$ cd ..
```

2. Set Up Firebase config in `./.env` file.

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. Set up Gemini API config in `backend/.env` file.

```env
GEMINI_API_KEY=your_api_key_here
```

4. Run the below in 2 terminals.

**Terminal 1 - Backend**:

```console
$ cd backend
$ npm run dev
```

**Terminal 2 - Frontend**:

```console
$ pnpm run dev
```

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