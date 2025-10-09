# Fluent - System Architecture Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Database Schema](#database-schema)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [External Services](#external-services)
8. [Authentication & Security](#authentication--security)
9. [Deployment Architecture](#deployment-architecture)
10. [Technology Stack](#technology-stack)

---

## System Overview

Fluent is a full-stack web application that provides an immersive language learning experience through:
- Real-time content aggregation from Reddit
- AI-powered mixed-language translations (adaptive to user level)
- Vocabulary tracking and spaced repetition flashcards
- User progress tracking and consistency graphs
- AI-generated comment suggestions using Google Gemini

### Key Features

- **Adaptive Learning**: Content difficulty adjusts to user proficiency (Levels 1-5)
- **Mixed Language Content**: Progressive translation based on learning level
- **Vocabulary System**: NLP-based word detection and personal dictionary
- **Flashcards**: Spaced repetition system for vocabulary retention
- **Real-time Sync**: Firebase Firestore for instant data synchronization
- **Offline-First Caching**: Reddit posts cached daily for fast loading

---

## High-Level Architecture

```mermaid
graph TB
    subgraph CLIENT["🖥️ CLIENT LAYER"]
        subgraph SPA["React 19 SPA (Vite)"]
            NewsFeed[NewsFeed]
            Dictionary[Dictionary]
            Flashcard[Flashcard]
            Profile[Profile/Settings]
            UI["shadcn/ui + Tailwind CSS"]
        end
    end
    
    subgraph APP["⚙️ APPLICATION LAYER"]
        subgraph Backend["Express.js Backend API (Node.js 18+)"]
            NewsAPI["/api/news"]
            TranslateAPI["/api/translate"]
            VocabAPI["/api/vocabulary"]
            AIAPI["/api/ai"]
            Middleware["Middleware: CORS, Helmet, Rate Limiting"]
        end
    end
    
    subgraph DATA["💾 DATA LAYER"]
        subgraph Firestore["Firebase Firestore 🔥"]
            Users["• User Profiles<br/>• Dictionaries<br/>• Saved Posts<br/>• Learning Stats<br/>• User Settings"]
        end
        subgraph Storage["Firebase Storage 📦"]
            Cache["• Cached Reddit Posts<br/>  (posts-japan.json)<br/>• Processed Translations<br/>  (posts-korea.json)"]
        end
    end
    
    subgraph EXTERNAL["🌐 EXTERNAL SERVICES"]
        Reddit["Reddit API<br/>(Public)"]
        Lingva["Lingva<br/>Translate"]
        MyMemory["MyMemory<br/>Translate"]
        Gemini["Gemini AI<br/>(Google)"]
    end
    
    CLIENT -->|HTTPS/REST API| APP
    APP -->|Firebase Admin SDK| DATA
    APP -.->|API Calls| EXTERNAL
    
    style CLIENT fill:#e1f5ff
    style APP fill:#fff4e6
    style DATA fill:#f3e5f5
    style EXTERNAL fill:#e8f5e9
```

---

## Frontend Architecture

### Component Hierarchy

```mermaid
graph TD
    App["App.jsx<br/>(Root)"]
    
    App --> AuthContext["AuthContext<br/>(Global State)"]
    AuthContext --> CurrentUser[currentUser]
    AuthContext --> UserProfile[userProfile]
    AuthContext --> AuthState[authentication state]
    
    App --> Auth["Auth.jsx<br/>(Authentication UI)"]
    Auth --> LoginForms[Login/Signup Forms]
    Auth --> FirebaseAuth[Firebase Auth Integration]
    
    App --> Onboarding["Onboarding.jsx<br/>(First-time user setup)"]
    Onboarding --> LevelSelect[Level Selection 1-5]
    
    App --> NewsFeed["NewsFeed.jsx ⭐<br/>(Main Content View)"]
    NewsFeed --> PostFilter[Post Filtering]
    NewsFeed --> RenderUtils[renderingUtils.jsx]
    NewsFeed --> WordPopup[WordLearningPopup.jsx]
    NewsFeed --> CommentSystem[EnhancedCommentSystem.jsx]
    
    App --> Dictionary["Dictionary.jsx<br/>(User's saved words)"]
    Dictionary --> WordList[Word List with translations]
    Dictionary --> SearchFilter[Search & Filter]
    Dictionary --> Export[Export functionality]
    
    App --> Flashcards["Flashcards.jsx<br/>(Spaced repetition)"]
    Flashcards --> SwipeReview[Swipe-based review]
    Flashcards --> Progress[Progress tracking]
    Flashcards --> ReviewModes[Multiple review modes]
    
    App --> SavedPosts["SavedPosts.jsx<br/>(Bookmarked content)"]
    SavedPosts --> FirestoreStorage[Persistent storage via Firestore]
    
    App --> ProfileComp["Profile.jsx<br/>(Settings & Stats)"]
    ProfileComp --> GeneralTab[GeneralTab.jsx]
    ProfileComp --> LearningTab[LearningTab.jsx]
    ProfileComp --> NotifTab[NotificationsTab.jsx]
    ProfileComp --> PrivacyTab[PrivacyTab.jsx]
    ProfileComp --> DevTab[DeveloperTab.jsx]
    
    style App fill:#ff6b6b
    style NewsFeed fill:#ffd93d
    style AuthContext fill:#6bcf7f
```

### State Management

```
┌────────────────────────────────────────────────────────────┐
│                   React Context API                        │
│                                                            │
│  AuthContext                                               │
│  ├── currentUser (Firebase Auth User)                     │
│  ├── userProfile (Firestore Document)                     │
│  │   ├── level: 1-5                                       │
│  │   ├── targetLanguage: 'ja' | 'ko'                      │
│  │   ├── settings: { notifications, privacy, goals }     │
│  │   └── createdAt, updatedAt                            │
│  └── loading state                                        │
│                                                            │
│  Component Local State (useState)                         │
│  ├── userDictionary: Word[]                               │
│  ├── savedPosts: Post[]                                   │
│  ├── currentView: 'feed' | 'dictionary' | 'flashcards'   │
│  └── UI state (modals, dropdowns)                         │
└────────────────────────────────────────────────────────────┘
```

### Services Architecture (Frontend)

```
src/services/
│
├── authService.js 🔐
│   ├── signInWithEmail()
│   ├── signUpWithEmail()
│   ├── signOutUser()
│   ├── resetPassword()
│   └── onAuthStateChange()
│
├── databaseService.js 💾
│   ├── User Profile CRUD
│   │   ├── createUserProfile()
│   │   ├── getUserProfile()
│   │   ├── updateUserProfile()
│   │   └── deleteUserProfile()
│   │
│   ├── Dictionary Management
│   │   ├── addWordToDictionary()
│   │   ├── removeWordFromDictionary()
│   │   ├── getDictionary()
│   │   └── onDictionaryChange() [Real-time listener]
│   │
│   └── Saved Posts
│       ├── savePost()
│       ├── unsavePost()
│       └── getSavedPosts()
│
├── newsService.js 📰
│   ├── fetchPosts() → POST /api/news
│   └── checkApiConfiguration() → POST /api/news/sources
│
├── translationService.js 🌐
│   ├── translateText() → POST /api/translate
│   ├── translateBatch() → POST /api/translate/batch
│   ├── createMixedContent() → POST /api/translate/mixed-content
│   └── containsJapanese() [Client-side utility]
│
├── vocabularyService.js 📚
│   ├── detectVocabulary() → POST /api/vocabulary/detect
│   ├── analyzeWord() → POST /api/vocabulary/analyze
│   └── isValidVocabularyWord() [Client-side validation]
│
└── encryptionService.js 🔒
    ├── encryptCredentials() [AES-256-GCM]
    ├── decryptCredentials()
    └── generateEncryptionKey()
```

---

## Backend Architecture

### API Routes Structure

```
backend/
│
├── server.js (Entry Point)
│   ├── Express app initialization
│   ├── Middleware stack
│   │   ├── helmet() - Security headers
│   │   ├── cors() - Cross-origin config
│   │   ├── compression() - Response compression
│   │   ├── morgan() - HTTP logging
│   │   └── rate-limit - 100 req/min per IP
│   │
│   ├── Route mounting
│   └── Graceful shutdown handlers
│
├── routes/ (API Endpoints)
│   │
│   ├── news.js 📡
│   │   ├── POST /api/news (Fetch posts with filters)
│   │   ├── GET /api/news (Legacy endpoint)
│   │   ├── POST /api/news/sources (Check available sources)
│   │   ├── POST /api/news/fetch (Trigger manual fetch)
│   │   └── GET /api/news/cache (Cache metadata)
│   │
│   ├── translation.js 🔤
│   │   ├── POST /api/translate (Single translation)
│   │   ├── POST /api/translate/batch (Multiple texts)
│   │   └── POST /api/translate/mixed-content (Adaptive content)
│   │
│   ├── vocabulary.js 📖
│   │   ├── POST /api/vocabulary/detect (NLP word extraction)
│   │   └── POST /api/vocabulary/analyze (Word analysis)
│   │
│   └── ai.js 🤖
│       └── POST /api/ai/comment-suggestions (Gemini-powered)
│
├── services/ (Business Logic)
│   │
│   ├── newsService.js
│   │   ├── fetchNews() - Aggregate from sources
│   │   ├── fetchRedditPosts() - Reddit API integration
│   │   ├── calculateEnglishDifficulty() - Flesch score
│   │   ├── normalizeRedditPost() - Data transformation
│   │   └── NodeCache (15min TTL)
│   │
│   ├── translationService.js
│   │   ├── translateText() - Multi-provider fallback
│   │   │   └── Providers: Lingva → MyMemory → LibreTranslate
│   │   ├── translateBatch() - Batch processing
│   │   ├── createMixedLanguageContent() - Adaptive translation
│   │   │   ├── Level 1: 80% target language
│   │   │   ├── Level 2-4: Progressive mixing
│   │   │   └── Level 5: 10% target language
│   │   └── NodeCache (30 day TTL)
│   │
│   ├── vocabularyService.js
│   │   ├── detectVocabulary() - Compromise.js NLP
│   │   │   ├── Extract: Nouns, Verbs, Adjectives
│   │   │   └── Filter: Common words, pronouns
│   │   ├── calculateWordDifficulty() - Syllable-based
│   │   └── createVocabularyWord() - Word object creation
│   │
│   ├── aiService.js
│   │   ├── generateCommentSuggestions()
│   │   │   ├── Model: gemini-2.0-flash-exp
│   │   │   ├── Context: Post title + content
│   │   │   └── Output: Mixed language suggestions
│   │   └── NodeCache (1 hour TTL)
│   │
│   └── storageService.js
│       ├── uploadPostsToStorage() - Firebase Storage write
│       ├── downloadPostsFromStorage() - Firebase Storage read
│       ├── listCachedPosts() - List cache files
│       └── getPostsMetadata() - File metadata
│
├── jobs/ (Scheduled Tasks)
│   │
│   └── fetchPostsJob.js ⏰
│       ├── runPostsFetchJob() - Main fetch logic
│       │   ├── Fetch from configured subreddits
│       │   ├── Process with mixed language translations
│       │   └── Upload to Firebase Storage
│       │
│       └── initializeScheduledJob()
│           └── Cron: Daily at 3:00 AM
│
└── config/ (Configuration)
    │
    ├── firebase.js 🔥
    │   ├── initializeFirebase() - Firebase Admin SDK
    │   ├── getFirestore() - Firestore instance
    │   └── getStorageBucket() - Storage instance
    │
    ├── subreddits.json
    │   ├── japan: 10 subreddits
    │   ├── korea: 8 subreddits
    │   └── settings: maxSubredditsPerQuery, postsPerSubreddit
    │
    └── translationMappings.json
        ├── translationPairs (en-ja, ja-en, en-ko, ko-en)
        └── apiProviders config per pair
```

### Middleware Stack

```mermaid
flowchart TD
    Start([Client Request]) --> Helmet[helmet<br/>Security headers]
    Helmet --> CORS[cors<br/>ALLOWED_ORIGINS check]
    CORS --> Compression[compression<br/>Gzip response]
    Compression --> JSON[express.json<br/>Parse JSON body]
    JSON --> Morgan[morgan<br/>HTTP logging]
    Morgan --> RateLimit[rate-limit<br/>100 req/min]
    RateLimit --> RouteHandler[Route Handler]
    RouteHandler --> ErrorHandler[Error Handler<br/>Catch-all]
    ErrorHandler --> End([Response])
    
    style Start fill:#4caf50
    style End fill:#2196f3
    style ErrorHandler fill:#ff9800
```

---

## Database Schema

### Firebase Firestore Structure

```
fluent-database (Firestore)
│
├── users/ (Collection)
│   └── {userId}/ (Document)
│       ├── email: string
│       ├── displayName: string
│       ├── photoURL: string
│       ├── level: number (1-5)
│       ├── targetLanguage: 'ja' | 'ko'
│       ├── nativeLanguage: 'en'
│       ├── createdAt: timestamp
│       ├── updatedAt: timestamp
│       │
│       ├── settings: object
│       │   ├── notifications: { email, push, comments }
│       │   ├── privacy: { profileVisibility, showEmail, showLocation }
│       │   ├── appearance: { theme, accentColor, fontSize }
│       │   └── goals: { dailyWords, weeklyReviewSessions, monthlyGoal }
│       │
│       ├── credentials: object (encrypted) ⚠️
│       │   ├── encryptedData: string
│       │   ├── iv: string
│       │   └── authTag: string
│       │
│       └── stats: object
│           ├── totalWordsLearned: number
│           ├── currentStreak: number
│           ├── longestStreak: number
│           └── lastActiveDate: timestamp
│
├── dictionaries/ (Collection)
│   └── {userId}/ (Document)
│       └── words: array[
│           {
│             word: string,              // Target language word
│             translation: string,        // English translation
│             pronunciation: string,      // Romaji/Romanization
│             context: string,            // Example sentence
│             contextTranslation: string, // Example translation
│             difficulty: number (1-5),   // Word difficulty
│             type: string,               // 'noun' | 'verb' | 'adjective'
│             addedAt: timestamp,
│             reviewCount: number,        // For spaced repetition
│             lastReviewed: timestamp,
│             nextReview: timestamp
│           }
│         ]
│
└── savedPosts/ (Collection)
    └── {userId}/ (Document)
        └── posts: array[
            {
              id: string,           // Post ID
              title: string,
              content: string,
              url: string,
              author: string,
              publishedAt: timestamp,
              image: string,
              tags: string[],
              source: 'reddit',
              difficulty: number (1-5),
              savedAt: timestamp,
              notes: string         // User notes
            }
          ]
```

### Firebase Storage Structure

```
fluent-storage.appspot.com (Firebase Storage)
│
└── cached-posts/
    ├── posts-japan.json
    │   └── Array[
    │       {
    │         id: string,
    │         title: string,
    │         content: string,
    │         url: string,
    │         author: string,
    │         publishedAt: Date,
    │         image: string,
    │         tags: string[],
    │         source: 'reddit',
    │         difficulty: number,
    │         processedVersions: {
    │           ja: {
    │             1: { title: {...}, content: {...} },
    │             2: { title: {...}, content: {...} },
    │             3: { title: {...}, content: {...} },
    │             4: { title: {...}, content: {...} },
    │             5: { title: {...}, content: {...} }
    │           }
    │         }
    │       }
    │     ]
    │
    └── posts-korea.json
        └── [Similar structure for Korean content]
```

### Indexed Fields (Firestore Composite Indexes)

```sql
-- users collection
CREATE INDEX idx_users_level ON users(level, updatedAt DESC);
CREATE INDEX idx_users_language ON users(targetLanguage, level);

-- dictionaries collection  
CREATE INDEX idx_dictionary_difficulty ON dictionaries.words(difficulty, addedAt DESC);
CREATE INDEX idx_dictionary_type ON dictionaries.words(type, nextReview ASC);

-- savedPosts collection
CREATE INDEX idx_saved_difficulty ON savedPosts.posts(difficulty, savedAt DESC);
CREATE INDEX idx_saved_source ON savedPosts.posts(source, publishedAt DESC);
```

---

## Data Flow Diagrams

### 1. Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Auth as Auth.jsx
    participant AuthSvc as authService.js
    participant Firebase as Firebase Auth 🔥
    participant Context as AuthContext
    participant DB as databaseService
    participant Firestore as Firestore 💾
    participant App as App.jsx
    
    User->>Auth: 1. Enter email/password
    Auth->>AuthSvc: 2. signInWithEmail()
    AuthSvc->>Firebase: 3. Authenticate
    Firebase-->>Context: 4. Auth token + User object
    Context->>DB: 5. Fetch user profile
    DB->>Firestore: 6. getUserProfile(userId)
    Firestore-->>DB: 7. User profile data
    DB-->>App: 8. Profile loaded
    App->>App: ✅ Authenticated
```

### 2. News Feed Content Flow

```mermaid
sequenceDiagram
    actor User as User opens app
    participant Feed as NewsFeed.jsx
    participant FrontSvc as newsService.js<br/>(Frontend)
    participant Route as backend/routes/news.js
    participant BackSvc as newsService.js<br/>(Backend)
    participant Cache as NodeCache
    participant Storage as Firebase Storage 📦
    
    User->>Feed: Open app
    Feed->>FrontSvc: 1. fetchPosts({query: 'japan', userLevel: 3})
    FrontSvc->>Route: 2. POST /api/news
    Route->>BackSvc: 3. fetchNews()
    BackSvc->>Cache: 4. Check cache
    
    alt Cache Hit
        Cache-->>Feed: Return cached data
    else Cache Miss
        BackSvc->>Storage: 5. downloadPostsFromStorage('posts-japan.json')
        Storage-->>BackSvc: 6. Cached posts
        BackSvc->>BackSvc: 7. Filter by userLevel & targetLang
        BackSvc-->>Feed: 8. Return processedVersions[level][language]
    end
    
    Feed->>Feed: Display content
```

### 3. Word Click-to-Translate Flow

```mermaid
sequenceDiagram
    actor User
    participant Word as wordDatabase.js
    participant VocabFront as vocabularyService.js<br/>(Frontend)
    participant VocabRoute as backend/vocabulary.js
    participant VocabBack as vocabularyService.js<br/>(Backend + NLP)
    participant TransSvc as translationService.js
    participant Lingva as Lingva Translate
    participant MyMemory as MyMemory
    participant Popup as WordLearningPopup.jsx
    participant DB as databaseService.js
    participant Firestore as Firestore 💾
    
    User->>Word: Click word "美しい"
    Word->>VocabFront: 1. Detect language
    VocabFront->>VocabRoute: 2. POST /api/vocabulary/detect
    VocabRoute->>VocabBack: 3. detectVocabulary()
    VocabBack->>VocabBack: 4. Extract metadata<br/>(type, difficulty)
    VocabBack->>TransSvc: 5. translateText('美しい', 'ja', 'en')
    
    TransSvc->>Lingva: Try Lingva
    alt Lingva Success
        Lingva-->>Popup: Translation: "beautiful"
    else Lingva Fails
        TransSvc->>MyMemory: Fallback: MyMemory
        MyMemory-->>Popup: Translation: "beautiful"
    end
    
    Popup->>Popup: Display:<br/>• 美しい (utsukushii)<br/>• beautiful
    User->>Popup: Click "Add to Dictionary"
    Popup->>DB: addWordToDictionary()
    DB->>Firestore: Update dictionaries/{userId}
    Firestore-->>Popup: ✅ Word added
```

### 4. Scheduled Post Caching Flow

```mermaid
sequenceDiagram
    participant Cron as ⏰ Cron Job<br/>(Daily 3:00 AM)
    participant Job as fetchPostsJob.js
    participant Reddit as Reddit API<br/>(10 subreddits)
    participant Process as processPostWithMixedLanguage()
    participant Trans as translationService.js
    participant Storage as storageService.js
    participant Firebase as Firebase Storage 📦
    
    Cron->>Job: Trigger
    Job->>Job: For each query (japan, korea)
    
    loop Each query
        Job->>Reddit: 1. fetchRedditPostsForQuery('japan', 30)
        Reddit-->>Job: Raw posts from<br/>r/anime, r/manga, etc.
        
        Job->>Job: 2. Normalize posts
        
        loop Each post
            Job->>Process: 3. processPostWithMixedLanguage()
            Process->>Trans: Create 5 versions (levels 1-5)
            Trans->>Trans: • Level 1: 80% Japanese<br/>• Level 2: 60%<br/>• Level 3: 40%<br/>• Level 4: 20%<br/>• Level 5: 10%
            Trans-->>Process: Processed versions
        end
        
        Process->>Storage: 4. uploadPostsToStorage()
        Storage->>Firebase: 5. Write posts-japan.json
        Firebase-->>Job: ✅ 30 posts with 5 levels cached
    end
```

### 5. Flashcard Review Flow

```mermaid
sequenceDiagram
    actor User
    participant Flash as Flashcards.jsx
    participant DB as databaseService
    participant Firestore as Firestore 💾
    participant Calc as Spaced Repetition<br/>Algorithm
    participant Sync as Real-time Listeners
    
    User->>Flash: Open Flashcards
    Flash->>DB: 1. getDictionary()
    DB->>Firestore: 2. Fetch dictionaries/{userId}
    Firestore-->>DB: Word list
    DB->>Flash: 3. Filter words (nextReview <= now)
    
    Flash->>Flash: Display swipe UI
    User->>Flash: 4. Swipe card (Correct/Incorrect)
    
    Flash->>Calc: Calculate next review
    alt Correct
        Calc->>Calc: nextReview = +2 days
    else Incorrect
        Calc->>Calc: nextReview = +1 day
    end
    
    Calc->>DB: 5. updateUserProfile()
    DB->>Firestore: Update:<br/>• reviewCount++<br/>• lastReviewed = now<br/>• nextReview = calculated
    
    Firestore->>Sync: 6. Trigger listeners
    Sync-->>User: ✅ All devices updated
```

---

## External Services

### 1. Reddit API (Public Endpoint)

```
Endpoint: https://www.reddit.com/r/{subreddit}.json
Method: GET
Auth: None (public access)

Rate Limits:
• 60 requests per minute per IP
• User-Agent header required

Usage in Fluent:
• Fetch posts from 10 Japan subreddits
• Fetch posts from 8 Korea subreddits
• No API key required
• Currently blocked on Render servers (403 errors)

Alternative: Use Reddit OAuth API (requires credentials)
```

### 2. Translation APIs (Multi-Provider Fallback)

**Primary: Lingva Translate**
```
Endpoint: https://lingva.ml/api/v1/{source}/{target}/{text}
Method: GET
Auth: None
Rate Limits: Generous free tier
Pros: Fast, reliable, no rate limits
Cons: Occasionally down
```

**Fallback 1: MyMemory**
```
Endpoint: https://api.mymemory.translated.net/get
Method: GET
Params: q={text}&langpair={source}|{target}
Auth: None (optional email for higher limits)
Rate Limits: 1000 words/day (free), 10000 with email
```

**Fallback 2: LibreTranslate**
```
Endpoint: https://libretranslate.com/translate
Method: POST
Auth: Optional API key
Rate Limits: 20 req/min (free)
```

### 3. Google Gemini AI

```
SDK: @google/generative-ai
Model: gemini-2.0-flash-exp
Auth: GEMINI_API_KEY (environment variable)

Usage:
• Generate comment suggestions
• Mixed language output
• Context: Post title + content (max 1000 chars)

Rate Limits:
• Free tier: 15 RPM (requests per minute)
• 1 million tokens/day

Prompt Template:
"Generate {n} thoughtful comment suggestions in mixed English and {language}
that are relevant to the post and encourage language learning."
```

### 4. Firebase Services

**Firebase Authentication**
```
Features Used:
• Email/Password authentication
• Password reset
• Real-time auth state listener

SDK: Firebase JS SDK v12.3.0
```

**Firestore Database**
```
Collections:
• users/ - User profiles and settings
• dictionaries/ - User vocabulary
• savedPosts/ - Bookmarked posts

Features:
• Real-time listeners (onSnapshot)
• Composite indexes
• Security rules
```

**Firebase Storage**
```
Bucket: cached-posts/
Files:
• posts-japan.json (~300KB, 30 posts)
• posts-korea.json (~300KB, 30 posts)

Updated: Daily at 3:00 AM via cron job
```

**Firebase Admin SDK (Backend)**
```
Auth Methods:
• Service account JSON file (local dev)
• Environment variables (production)
  - FIREBASE_PROJECT_ID
  - FIREBASE_CLIENT_EMAIL
  - FIREBASE_PRIVATE_KEY
```

---

## Authentication & Security

### Authentication Flow

```
┌──────────────────────────────────────────────────────────┐
│                   Firebase Authentication                 │
│                                                           │
│  Supported Methods:                                       │
│  ✓ Email/Password                                        │
│  ✗ Google OAuth (future)                                 │
│  ✗ GitHub OAuth (future)                                 │
│                                                           │
│  Token Management:                                        │
│  • JWT tokens (auto-refreshed by SDK)                    │
│  • 1 hour expiration                                      │
│  • Stored in memory (not localStorage)                   │
└──────────────────────────────────────────────────────────┘
```

### Security Measures

**Frontend:**
```
1. API Key Encryption (AES-256-GCM)
   • User enters Twitter/Instagram credentials
   • Encrypted before storage in Firestore
   • Decrypted only in memory when needed

2. Firebase Security Rules
   • Users can only read/write their own data
   • Example rule:
     match /users/{userId} {
       allow read, write: if request.auth.uid == userId;
     }

3. Input Validation
   • Sanitize user inputs
   • Prevent XSS attacks
   • Form validation with react-hook-form + zod

4. HTTPS Only
   • All API calls over HTTPS
   • Secure cookies
```

**Backend:**
```
1. Environment Variables
   • Sensitive keys never committed
   • .env files in .gitignore
   • Render dashboard for production secrets

2. Helmet.js
   • Sets security headers
   • Content Security Policy
   • XSS Protection
   • HSTS enabled

3. CORS Configuration
   • Whitelist allowed origins
   • ALLOWED_ORIGINS environment variable
   • Credentials: true for auth cookies

4. Rate Limiting
   • 100 requests per minute per IP
   • Prevents brute force attacks
   • Applied to all /api/* routes

5. Firebase Admin SDK
   • Service account credentials
   • Private key encryption
   • Least privilege access
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User dictionaries
    match /dictionaries/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Saved posts
    match /savedPosts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Cached posts are publicly readable
    match /cached-posts/{fileName} {
      allow read: if true;
      allow write: if false; // Only backend can write
    }
  }
}
```

---

## Deployment Architecture

### Production Infrastructure

```mermaid
graph TB
    subgraph Vercel["☁️ Vercel (Frontend) - Global CDN"]
        SPA["React SPA<br/>• SSG Build<br/>• CDN Caching<br/>• Edge Functions"]
        VBuild["Build:<br/>• pnpm build<br/>• Output: dist/<br/>• Auto-deploy"]
        VEnv["Environment:<br/>• VITE_API_URL<br/>• VITE_FIREBASE_*"]
    end
    
    subgraph Render["🔧 Render (Backend) - Oregon"]
        Express["Express.js Server<br/>• Node.js 24.10.0<br/>• Binds to 0.0.0.0:3001<br/>• Health: /health"]
        RDeploy["Deploy:<br/>• npm install<br/>• npm start<br/>• Auto-deploy"]
        REnv["Environment:<br/>• FIREBASE_PROJECT_ID<br/>• ALLOWED_ORIGINS<br/>• GEMINI_API_KEY"]
    end
    
    subgraph Firebase["🔥 Firebase (Google Cloud) - Multi-region (us)"]
        Firestore["Firestore Database<br/>• us-central1<br/>• Real-time sync"]
        Auth["Authentication<br/>• Email/Password"]
        Storage["Storage<br/>• Cached Reddit posts"]
    end
    
    Vercel <-->|REST API| Render
    Render -->|Firebase Admin SDK| Firebase
    
    style Vercel fill:#0070f3,color:#fff
    style Render fill:#4c1d95,color:#fff
    style Firebase fill:#ffa000,color:#fff
```

### Deployment Workflow

```mermaid
flowchart TB
    Dev([👨‍💻 Developer pushes to GitHub])
    
    Dev --> Vercel[Vercel Auto-deploy]
    Dev --> Render[Render Auto-deploy]
    
    Vercel --> V1[1. pnpm install]
    V1 --> V2[2. pnpm build]
    V2 --> V3[3. Deploy to CDN]
    V3 --> V4[4. Invalidate cache]
    V4 --> VProd([✅ Production URL<br/>*.vercel.app])
    
    Render --> R1[1. npm install]
    R1 --> R2[2. npm start]
    R2 --> R3[3. Health check]
    R3 --> R4[4. Route traffic]
    R4 --> RProd([✅ Production URL<br/>*.onrender.com])
    
    style Dev fill:#24292e,color:#fff
    style VProd fill:#0070f3,color:#fff
    style RProd fill:#4c1d95,color:#fff
```

### Environment Variables (Production)

**Frontend (Vercel):**
```bash
# Firebase Client SDK
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=fluent-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fluent-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=fluent-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxx

# Backend API URL
VITE_API_URL=https://big-livepeek-backend.onrender.com
```

**Backend (Render):**
```bash
# Server
NODE_ENV=production
PORT=3001

# Firebase Admin SDK
FIREBASE_PROJECT_ID=fluent-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@fluent-xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# CORS
ALLOWED_ORIGINS=https://big-livepeek.vercel.app,http://localhost:5173,http://localhost:3000

# APIs
GEMINI_API_KEY=AIza...

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Scheduled Jobs
RUN_FETCH_ON_STARTUP=false
```

### Health Monitoring

**Backend Health Check:**
```bash
GET https://big-livepeek-backend.onrender.com/health

Response:
{
  "status": "ok",
  "timestamp": "2025-10-09T07:24:56.000Z",
  "uptime": 123.456
}
```

**Render Deployment Logs:**
```
✅ Build successful
✅ Firebase Admin initialized with environment variables
🚀 Fluent Backend running on port 3001
📝 Environment: production
🔒 CORS enabled for: https://big-livepeek.vercel.app
✅ Server is ready to accept connections
⏰ Daily posts fetch job initialized
```

### Scaling Considerations

**Current Limitations (Free Tier):**
```
Render:
• CPU: 0.5 shared vCPU
• RAM: 512 MB
• Spins down after 15 min inactivity
• Cold start: ~30 seconds

Vercel:
• Bandwidth: 100 GB/month
• Builds: 100/month
• Serverless function executions: Unlimited

Firebase:
• Firestore: 50K reads, 20K writes, 20K deletes per day
• Storage: 5 GB
• Authentication: Unlimited (free)
```

**Upgrade Path:**
```
Render ($7/month):
• Always-on (no cold starts)
• 512 MB RAM → 2 GB RAM
• Custom domains
• Priority support

Vercel Pro ($20/month):
• 1 TB bandwidth
• Unlimited builds
• Advanced analytics

Firebase Blaze (Pay-as-you-go):
• Scale automatically
• ~$25/month for 1M operations
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1.0 | UI framework |
| **Vite** | 6.3.5 | Build tool & dev server |
| **Tailwind CSS** | 4.1.7 | Utility-first styling |
| **shadcn/ui** | Latest | Accessible component library |
| **Radix UI** | Various | Headless UI primitives |
| **Firebase SDK** | 12.3.0 | Authentication & database |
| **Lucide React** | 0.510.0 | Icon library |
| **Recharts** | 2.15.3 | Consistency graph charts |
| **Framer Motion** | 12.15.0 | Animations |
| **React Hook Form** | 7.56.3 | Form management |
| **Zod** | 3.24.4 | Schema validation |
| **pnpm** | 10.4.1 | Package manager |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | >=18.0.0 | Runtime environment |
| **Express.js** | 4.18.2 | Web framework |
| **Firebase Admin** | 13.5.0 | Backend Firebase integration |
| **Compromise.js** | 14.14.4 | NLP for English text |
| **Axios** | 1.6.0 | HTTP client |
| **node-cache** | 5.1.2 | In-memory caching |
| **node-cron** | 4.2.1 | Scheduled jobs |
| **Helmet** | 7.1.0 | Security headers |
| **CORS** | 2.8.5 | Cross-origin requests |
| **Morgan** | 1.10.0 | HTTP logging |
| **Express Rate Limit** | 7.1.5 | API rate limiting |
| **Google Generative AI** | 0.24.1 | Gemini AI integration |
| **Syllable** | 5.0.1 | Flesch score calculation |
| **npm** | >=9.0.0 | Package manager |

### Infrastructure

| Service | Purpose | Plan |
|---------|---------|------|
| **Vercel** | Frontend hosting | Free tier |
| **Render** | Backend hosting | Free tier |
| **Firebase Auth** | User authentication | Free (unlimited) |
| **Firestore** | NoSQL database | Spark plan (free) |
| **Firebase Storage** | File storage | Free (5GB) |
| **Google Gemini** | AI comment suggestions | Free tier (15 RPM) |
| **GitHub** | Version control & CI/CD | Free |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Biome** | Linting & formatting |
| **ESLint** | JavaScript linting |
| **Husky** | Git hooks |
| **lint-staged** | Pre-commit linting |
| **Nodemon** | Backend auto-reload |

---

## Performance Optimizations

### Frontend

```
1. Code Splitting
   • Lazy loading for large components
   • Dynamic imports for Dictionary, Flashcards

2. Caching Strategy
   • Service Worker (planned)
   • LocalStorage for user preferences
   • Firestore offline persistence

3. Image Optimization
   • Next-gen formats (WebP)
   • Lazy loading images
   • Responsive images

4. Bundle Size
   • Tree shaking
   • Removed Compromise.js from frontend (moved to backend)
   • Bundle reduced by ~150KB
```

### Backend

```
1. Caching Layers
   • NodeCache (in-memory)
     - News: 15 min TTL
     - Translations: 30 day TTL
     - AI suggestions: 1 hour TTL
   
   • Firebase Storage (persistent)
     - Reddit posts: Daily refresh
     - Pre-processed translations

2. Response Compression
   • Gzip compression via compression middleware
   • ~70% size reduction

3. Database Optimization
   • Composite indexes on Firestore
   • Batch operations for multiple writes
   • Real-time listeners only where needed

4. API Request Batching
   • Batch translation API
   • Parallel Reddit fetching (Promise.all)
```

### Network

```
1. CDN (Vercel)
   • Global edge caching
   • Automatic cache invalidation

2. HTTP/2
   • Multiplexing
   • Server push (planned)

3. Preloading
   • DNS prefetch
   • Resource hints
```

---

## Future Architecture Improvements

### Short-term (Q2 2025)

```
1. Redis Caching Layer
   • Replace NodeCache for distributed caching
   • Share cache across multiple Render instances
   • Persistent cache across restarts

2. WebSocket Integration
   • Real-time user presence
   • Live vocabulary sharing
   • Multiplayer flashcard battles

3. Progressive Web App (PWA)
   • Service Worker
   • Offline mode
   • Install prompt
```

### Long-term (Q3-Q4 2025)

```
1. Microservices Architecture
   • Separate services for:
     - News aggregation
     - Translation
     - AI features
   • API Gateway (Kong/Nginx)
   • Service mesh

2. Event-Driven Architecture
   • Message queue (RabbitMQ/Kafka)
   • Async job processing
   • Webhook system

3. Machine Learning Pipeline
   • Custom translation model
   • Personalized difficulty adjustment
   • Spaced repetition algorithm optimization

4. Multi-region Deployment
   • Geographic load balancing
   • Edge functions for translations
   • Region-specific content caching
```

---

## Monitoring & Observability

### Current Setup

```
Render (Backend):
• Built-in logging
• HTTP request logs (Morgan)
• Error logs to stdout

Vercel (Frontend):
• Build logs
• Deployment logs
• Analytics (basic)

Firebase:
• Authentication logs
• Firestore operation logs
• Storage access logs
```

### Planned Improvements

```
1. Application Performance Monitoring (APM)
   • New Relic / DataDog
   • Request tracing
   • Performance metrics

2. Error Tracking
   • Sentry integration
   • Source maps
   • User context

3. Custom Dashboards
   • Grafana / Kibana
   • Real-time metrics
   • Alerting system

4. Log Aggregation
   • Centralized logging (Loggly/Papertrail)
   • Log rotation
   • Search & analytics
```

---

## Conclusion

Fluent is architected as a modern, scalable language learning platform with clear separation of concerns:

- **Frontend**: React SPA with component-based architecture
- **Backend**: RESTful API with business logic isolation
- **Database**: NoSQL (Firestore) for flexible, real-time data
- **Caching**: Multi-layer caching for performance
- **External APIs**: Graceful fallbacks for reliability
- **Security**: Defense in depth with encryption, auth, and rate limiting

The architecture is designed to scale from free-tier deployment to production-grade infrastructure with minimal refactoring.