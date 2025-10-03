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
| NewsAPI.org | ⚙️ Configurable | Yes | Requires `NEWSAPI_KEY` in backend `.env` |
| The Guardian | ⚙️ Configurable | Yes | Requires `GUARDIAN_API_KEY` in backend `.env` |
