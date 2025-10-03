# LivePeek

## Tech Stack

- *Frontend*: React 19 + Vite
- *Styling*: Tailwind CSS + shadcn/ui components
- *Icons*: Lucide React
- *State Management*: React Hooks
- *Build Tool*: Vite
- *Package Manager*: pnpm

## News Sources Status

| Source | Status | API Key Required | Notes |
|--------|--------|------------------|-------|
| Reddit | ✅ Active | No | Currently pulling from Japanese-themed subreddits (japan, JapanTravel, JapaneseFood, JapanLife, LearnJapanese, Tokyo, japanpics) |
| Hacker News | ❌ Disabled | No | Ready to use, needs to be enabled in `newsService.js` |
| NewsAPI.org | ❌ Disabled | Yes | Requires `VITE_NEWSAPI_KEY` environment variable |
| The Guardian | ❌ Disabled | Yes | Requires `VITE_GUARDIAN_API_KEY` environment variable |
| NY Times | ❌ Disabled | Yes | Requires `VITE_NYTIMES_API_KEY` environment variable |
| Mediastack | ❌ Disabled | Yes | Requires `VITE_MEDIASTACK_API_KEY` environment variable |
| GNews | ❌ Disabled | Yes | Requires `VITE_GNEWS_API_KEY` environment variable |

## Usage

```console
$ git clone https://github.com/gongahkia/cs206-livepeek && cd livepeek && npm install --legacy-peer-deps
$ npm run dev
```