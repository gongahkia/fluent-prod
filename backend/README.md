# Influent Backend API

Backend API server for the Influent Japanese language learning application. Handles news fetching, translation, and NLP/vocabulary processing.

## Features

- **News Aggregation**: Fetches posts from multiple sources (Reddit, Twitter, Instagram, NewsAPI, Guardian, etc.)
- **Social Media Scraping**: Twitter scraping (no auth required) and Instagram scraping (requires credentials)
- **Translation**: Multi-provider translation service (Lingva, MyMemory, LibreTranslate)
- **NLP Processing**: Vocabulary detection and analysis using Compromise.js
- **Caching**: Intelligent caching with configurable TTL
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Security**: API keys stored securely on backend, never exposed to client

## Tech Stack

- **Node.js** + **Express**: Web server
- **Compromise.js**: NLP library for English text analysis
- **Axios**: HTTP client for external APIs
- **node-cache**: In-memory caching
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Morgan**: HTTP request logging

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# API Keys (Optional - Reddit works without keys)
NEWSAPI_KEY=your_newsapi_key_here
GUARDIAN_API_KEY=your_guardian_key_here
NYTIMES_API_KEY=your_nytimes_key_here
MEDIASTACK_API_KEY=your_mediastack_key_here
GNEWS_API_KEY=your_gnews_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. Start the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

Server will run on `http://localhost:3001`

## API Endpoints

### Health Check

```
GET /health
```

Returns server status and uptime.

### News Endpoints

#### Get News Posts
```
GET /api/news?sources=reddit&query=japan&limit=10&shuffle=true
```

**Query Parameters:**
- `sources` (string): Comma-separated list of sources (e.g., "reddit,hackernews")
- `query` (string): Search query (default: "japan")
- `limit` (number): Maximum posts to return (default: 10)
- `shuffle` (boolean): Randomize results (default: true)

**Response:**
```json
{
  "posts": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "url": "string",
      "author": "string",
      "publishedAt": "2025-01-01T00:00:00.000Z",
      "source": "reddit",
      "image": "string",
      "tags": ["japan", "reddit"]
    }
  ],
  "metadata": {
    "count": 10,
    "sources": ["reddit"]
  }
}
```

#### Get Available Sources
```
GET /api/news/sources
```

Returns list of configured news sources.

### Translation Endpoints

#### Translate Text
```
POST /api/translate
Content-Type: application/json

{
  "text": "Hello world",
  "fromLang": "en",
  "toLang": "ja"
}
```

**Response:**
```json
{
  "original": "Hello world",
  "translation": "こんにちは世界",
  "fromLang": "en",
  "toLang": "ja",
  "cached": false,
  "provider": "lingva"
}
```

#### Batch Translate
```
POST /api/translate/batch
Content-Type: application/json

{
  "texts": ["Hello", "World"],
  "fromLang": "en",
  "toLang": "ja"
}
```

#### Mixed Language Content
```
POST /api/translate/mixed-content
Content-Type: application/json

{
  "text": "Japan is a beautiful country",
  "userLevel": 5
}
```

Creates mixed English/Japanese content based on user's learning level (1-10).

### Vocabulary Endpoints

#### Detect Vocabulary
```
POST /api/vocabulary/detect
Content-Type: application/json

{
  "text": "The Japanese culture is fascinating"
}
```

**Response:**
```json
{
  "vocabulary": [
    {
      "english": "japanese",
      "japanese": "日本人",
      "type": "properNoun",
      "level": 1,
      "pronunciation": "",
      "isVocabulary": true
    }
  ]
}
```

#### Get Vocabulary Word
```
POST /api/vocabulary/word
Content-Type: application/json

{
  "word": "culture",
  "type": "noun",
  "context": "Japanese culture"
}
```

#### Get Vocabulary Stats
```
POST /api/vocabulary/stats
Content-Type: application/json

{
  "text": "The Japanese culture is fascinating"
}
```

#### Validate Word
```
POST /api/vocabulary/validate
Content-Type: application/json

{
  "word": "culture"
}
```

## Caching Strategy

- **Translations**: 30 days TTL
- **News posts**: 15 minutes TTL
- **Vocabulary**: 1 hour TTL

Caching significantly improves performance and reduces external API calls.

## Security Features

- **Helmet**: Adds security headers
- **Rate Limiting**: 100 requests per minute per IP
- **CORS**: Configurable allowed origins
- **API Keys**: Stored in environment variables, never exposed to client

## Error Handling

All endpoints return proper HTTP status codes:
- `200`: Success
- `400`: Bad request (missing parameters)
- `404`: Route not found
- `500`: Internal server error

Error responses include descriptive messages:
```json
{
  "error": "Text is required"
}
```

## Logging

Uses Morgan for HTTP request logging:
- **Development**: Colorful, detailed logs
- **Production**: Apache combined log format

## API Keys

### Getting API Keys (All Optional)

1. **Reddit**: No API key needed! Works out of the box.

2. **Twitter**: Requires Twitter API Bearer Token.
   - Get your free Bearer Token from: [https://developer.twitter.com/en/portal/dashboard](https://developer.twitter.com/en/portal/dashboard)
   - Add `TWITTER_BEARER_TOKEN` to `.env`
   - Free tier: 500,000 tweets/month

3. **Instagram**: Requires Instagram account credentials.
   - Add `INSTAGRAM_USERNAME` and `INSTAGRAM_PASSWORD` to `.env`
   - ⚠️ **Use a dedicated account, not your personal account**
   - Instagram may flag/ban accounts used for scraping

4. **NewsAPI**: [https://newsapi.org/register](https://newsapi.org/register)
   - Free tier: 100 requests/day

5. **Guardian**: [https://open-platform.theguardian.com/access/](https://open-platform.theguardian.com/access/)
   - Free tier: 5,000 requests/day

6. **NY Times**: [https://developer.nytimes.com/get-started](https://developer.nytimes.com/get-started)
   - Free tier: 4,000 requests/day

7. **Mediastack**: [https://mediastack.com/signup/free](https://mediastack.com/signup/free)
   - Free tier: 500 requests/month

8. **GNews**: [https://gnews.io/](https://gnews.io/)
   - Free tier: 100 requests/day

**Note**: The app works fine with just Reddit (no API keys needed). Other sources require API credentials but are optional enhancements.

## Performance

### Bundle Size Reduction
- Frontend bundle reduced by ~150KB by moving Compromise.js and translation logic to backend
- Faster initial load times

### Response Times
- Cached translations: < 5ms
- Fresh translations: 100-500ms (depends on external API)
- News fetching: 200-1000ms (depends on source)
- Vocabulary detection: 50-200ms

## Development

### Running with Nodemon
```bash
npm run dev
```

Changes to code will automatically restart the server.

### Testing API Endpoints

Use curl, Postman, or any HTTP client:

```bash
# Health check
curl http://localhost:3001/health

# Get news
curl "http://localhost:3001/api/news?sources=reddit&limit=5"

# Translate text
curl -X POST http://localhost:3001/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello", "fromLang": "en", "toLang": "ja"}'

# Detect vocabulary
curl -X POST http://localhost:3001/api/vocabulary/detect \
  -H "Content-Type: application/json" \
  -d '{"text": "Japan has beautiful mountains"}'
```

## Deployment

### Production Checklist

1. Set `NODE_ENV=production` in `.env`
2. Use proper API keys (not free tier limits)
3. Configure Redis for distributed caching (optional)
4. Set up monitoring (e.g., PM2, New Relic)
5. Enable HTTPS
6. Configure proper CORS origins
7. Set up log rotation
8. Use process manager (PM2 recommended)

### PM2 Deployment

```bash
npm install -g pm2
pm2 start server.js --name influent-backend
pm2 save
pm2 startup
```

## Troubleshooting

### Port Already in Use
Change `PORT` in `.env` file or kill the process using port 3001:
```bash
lsof -ti:3001 | xargs kill -9
```

### CORS Errors
Add your frontend URL to `ALLOWED_ORIGINS` in `.env`:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://yourdomain.com
```

### Translation Not Working
Translation services are free but may have downtime. The backend tries multiple providers in order:
1. Lingva Translate
2. MyMemory
3. LibreTranslate

If all fail, it returns the original text.

### News Fetching Slow
- Reddit API is usually fast (< 500ms)
- Other APIs may be slower depending on their server load
- Results are cached for 15 minutes

## License

MIT
