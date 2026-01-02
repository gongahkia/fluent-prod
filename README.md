# Fluent

A language learning platform that helps you learn Japanese and Korean through real-world content from Reddit, news sources, and social media.

## Usage

```console
$ ./dev.sh
```

## Cache workflow (GitHub Actions)

- A weekly GitHub Action scrapes Reddit, translates content, and writes `cache/news-cache.txt` (NDJSON).
- A second GitHub Action prunes `cache/news-cache.txt` down to a max of 500 rows, preserving any posts referenced by users' Firebase saved posts.

## Local cache generation

```console
$ npm ci --prefix backend
$ node backend/seed-showcase-posts.js
$ FIREBASE_SERVICE_ACCOUNT_JSON=... node backend/prune-news-cache.js
```

## Credentials

Details in the [Trello](https://trello.com/invite/b/68e720e4a8fe9ee3e93a9788/ATTI9a0b6e9fd51a7f333e5911cbe95ed4a21996498F/fluent).