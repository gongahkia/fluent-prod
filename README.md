# Influent

## Tech Stack

- *Frontend*: React 19 + Vite
- *Styling*: Tailwind CSS + shadcn/ui components
- *Icons*: Lucide React
- *State Management*: React Hooks
- *Build Tool*: Vite
- *Package Manager*: pnpm

## Usage

```console
$ git clone https://github.com/gongahkia/cs206-influent && cd influent && pnpm install 
$ cd backend && npm install 
```

Open 2 terminals.

```console
$ cd backend && npm run dev
```

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

| Source | Status | API Key Required | Notes |
|--------|--------|------------------|-------|
| Reddit | ✅ Active | No | Pulling from Japanese-themed subreddits (japan, japanese, japanlife, japantravel, learnjapanese) |
| Twitter | ⚙️ Configurable | Yes | Requires `TWITTER_BEARER_TOKEN` in backend `.env` - Free tier available at developer.twitter.com |
| Instagram | ⚙️ Configurable | Yes | Requires `INSTAGRAM_USERNAME` and `INSTAGRAM_PASSWORD` in backend `.env` |
| NewsAPI.org | ⚙️ Configurable | Yes | Requires `NEWSAPI_KEY` in backend `.env` |
| The Guardian | ⚙️ Configurable | Yes | Requires `GUARDIAN_API_KEY` in backend `.env` |

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
