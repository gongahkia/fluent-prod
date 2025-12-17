# Post Seeding Guide

## One-Time Showcase Seeding

Populate the database with ~150-200 posts from 47 diverse subreddits for demo purposes.

### Quick Start

```bash
cd backend
npm run seed
```

Or directly:
```bash
node backend/seed-showcase-posts.js
```

### What It Does

1. **Fetches** 3-5 posts from each of 47 subreddits:
   - **Japanese-focused** (24 subs): r/newsokur, r/JapanLife, r/anime, etc.
   - **General interest** (23 subs): r/movies, r/Music, r/Cooking, etc.

2. **Processes** each post:
   - Normalizes Reddit post format
   - Calculates difficulty level (1-5)
   - Translates to mixed English+Japanese content
   - Maintains original English text

3. **Merges** with existing posts in Supabase:
   - Avoids duplicates (checks post IDs)
   - Adds only new unique posts
   - Preserves all existing posts

4. **Uploads** to `posts-japan.json` in Supabase cache

### Expected Output

- **~150-200 new posts** added to database
- **Success rate**: ~90-95% (some subreddits may be private/banned)
- **Duration**: ~15-25 minutes (depends on translation API speed)

### Subreddits Included

<details>
<summary><strong>Japanese-Focused (24 subreddits)</strong></summary>

- r/newsokur
- r/lowlevelaware
- r/JapanNews
- r/japanpics
- r/JapanArt
- r/JapanPlaces
- r/RideItJapan
- r/japanparents
- r/BakaNewsJP
- r/Anime
- r/JDorama
- r/JapaneseMusic
- r/JPop
- r/Otaku
- r/JapanLife
- r/JapanResidents
- r/MovingToJapan
- r/JapanFinance
- r/TeachingInJapan
- r/ALTinginJapan
- r/JETProgramme
- r/JapanTravel
- r/OsakaTravel
- r/KyotoTravel

</details>

<details>
<summary><strong>General Interest (23 subreddits)</strong></summary>

- r/movies
- r/Music
- r/television
- r/anime
- r/manga
- r/NetflixBestOf
- r/mlb
- r/hockey
- r/mma
- r/formula1
- r/Boxing
- r/running
- r/cricket
- r/malefashionadvice
- r/streetwear
- r/femalefashionadvice
- r/frugalmalefashion
- r/Sneakers
- r/womensstreetwear
- r/Cooking
- r/AskCulinary
- r/FoodPorn
- r/KitchenConfidential
- r/EatCheapAndHealthy
- r/Sushi
- r/JapaneseFood

</details>

---

## Regular Post Fetching

For ongoing/regular post updates, use the standard fetch job:

```bash
npm run fetch
```

This is configured in `trigger-fetch.js` and uses the subreddits defined in `config/subreddits.json`.
