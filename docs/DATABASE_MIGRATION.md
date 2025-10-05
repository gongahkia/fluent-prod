# Database Migration Guide

This document explains how the database migration from localStorage to Firebase Firestore works.

## Overview

The app now uses Firebase Firestore for data persistence instead of localStorage. This provides:
- ✅ Real user authentication
- ✅ Data persistence across devices
- ✅ Real-time synchronization
- ✅ Better security
- ✅ No data loss on browser clear

## What Changed

### Before (localStorage)

```javascript
// User authentication - mock only
- No real accounts
- Data stored in browser only
- Lost on browser clear

// User dictionary
- Stored in component state
- No persistence

// Flashcard progress
- localStorage.setItem('flashcardData', JSON.stringify(data))
- Lost on browser clear

// Saved posts
- Stored in component state
- No persistence
```

### After (Firebase Firestore)

```javascript
// User authentication - Firebase Auth
- Real email/password accounts
- Google OAuth support
- Secure authentication tokens

// User dictionary
- Stored in Firestore: users/{userId}/dictionary/{wordId}
- Real-time sync across devices
- Persists permanently

// Flashcard progress
- Stored in Firestore: users/{userId}/flashcards/{wordId}
- Automatic migration from localStorage
- Persists permanently

// Saved posts
- Stored in Firestore: users/{userId}/savedPosts/{postId}
- Persists permanently
```

## Automatic Migration

### Flashcard Data Migration

The app automatically migrates flashcard progress from localStorage to Firestore:

1. **First time sign-in**:
   - App checks for `flashcardData` in localStorage
   - If found, migrates to Firestore
   - Clears localStorage after successful migration

2. **Migration code** (in `databaseService.js`):
```javascript
export const migrateFlashcardData = async (userId) => {
  const localData = localStorage.getItem('flashcardData')
  if (!localData) return { success: true, message: 'No local data to migrate' }

  const flashcardData = JSON.parse(localData)
  await batchUpdateFlashcards(userId, flashcardData)

  // Clear localStorage after successful migration
  localStorage.removeItem('flashcardData')

  return { success: true, message: 'Flashcard data migrated successfully' }
}
```

3. **When it happens**:
   - Automatically on first load of Flashcards component
   - Only happens once per user
   - Silent and transparent to the user

## Data Structure

### User Profile

**Firestore path**: `users/{userId}`

```javascript
{
  name: "John Doe",
  email: "john@example.com",
  nativeLanguage: "English",
  targetLanguage: "Japanese",
  level: 3,
  bio: "Learning Japanese!",
  location: "Tokyo, Japan",
  website: "https://example.com",
  bannerImage: "https://...",
  settings: {
    notifications: {
      email: true,
      push: true,
      comments: true
    },
    privacy: {
      profileVisibility: "public",
      showEmail: false,
      showLocation: true
    },
    appearance: {
      theme: "light",
      accentColor: "orange",
      fontSize: "medium"
    },
    goals: {
      dailyWords: 10,
      dailyReading: 5,
      studyReminder: true,
      reminderTime: "18:00"
    }
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Dictionary Words

**Firestore path**: `users/{userId}/dictionary/{wordId}`

```javascript
{
  id: 1234567890,
  japanese: "勉強",
  hiragana: "べんきょう",
  english: "study",
  level: 3,
  example: "毎日日本語を勉強します。",
  exampleEn: "I study Japanese every day.",
  source: "Reddit Post",
  dateAdded: Timestamp
}
```

### Flashcard Progress

**Firestore path**: `users/{userId}/flashcards/{wordId}`

```javascript
{
  interval: 7,              // Days until next review
  easeFactor: 2.5,          // Difficulty multiplier
  repetitions: 5,           // Number of successful reviews
  lastReviewed: Timestamp,  // Last review date
  nextReview: Timestamp     // Next scheduled review
}
```

### Saved Posts

**Firestore path**: `users/{userId}/savedPosts/{postId}`

```javascript
{
  id: "post_123",
  source: "Reddit",
  title: "Learning Japanese",
  content: "...",
  url: "https://...",
  author: "user123",
  date: "2025-01-01",
  savedAt: Timestamp
}
```

## Real-time Synchronization

### How it works

The app uses Firestore's real-time listeners to sync data:

```javascript
// Example: Dictionary real-time sync
useEffect(() => {
  if (!currentUser) return

  const unsubscribe = onDictionaryChange(currentUser.uid, (words) => {
    setUserDictionary(words)
  })

  return () => unsubscribe()
}, [currentUser])
```

### What this means

- Add a word on Device A → Appears on Device B within seconds
- Update flashcard progress on Phone → Syncs to Desktop immediately
- Save a post on Browser 1 → Available on Browser 2 right away

## API Reference

### Authentication Services

```javascript
import {
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser
} from '@/services/authService'

// Register new user
const result = await registerWithEmail(email, password, displayName)

// Sign in
const result = await signInWithEmail(email, password)

// Google OAuth
const result = await signInWithGoogle()

// Sign out
await signOutUser()
```

### Database Services

```javascript
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  addWordToDictionary,
  getUserDictionary,
  removeWordFromDictionary,
  saveFlashcardProgress,
  getFlashcardProgress,
  savePost,
  getSavedPosts,
  removeSavedPost
} from '@/services/databaseService'

// User profile
await createUserProfile(userId, profileData)
const profile = await getUserProfile(userId)
await updateUserProfile(userId, updates)

// Dictionary
await addWordToDictionary(userId, wordData)
const words = await getUserDictionary(userId)
await removeWordFromDictionary(userId, wordId)

// Flashcards
await saveFlashcardProgress(userId, wordId, progressData)
const progress = await getFlashcardProgress(userId)

// Saved posts
await savePost(userId, postData)
const posts = await getSavedPosts(userId)
await removeSavedPost(userId, postId)
```

## Security

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null
                        && request.auth.uid == userId;

      // Same rule applies to subcollections
      match /{document=**} {
        allow read, write: if request.auth != null
                          && request.auth.uid == userId;
      }
    }
  }
}
```

### What this ensures

- ✅ Users can only read/write their own data
- ✅ Authentication required for all operations
- ✅ No cross-user data access
- ✅ Protected from unauthorized access

## Performance Considerations

### Optimizations

1. **Real-time listeners**: Only active when component is mounted
2. **Batch operations**: Used for multiple updates (flashcards)
3. **Caching**: Firestore caches data locally for offline access
4. **Lazy loading**: Data loaded only when needed

### Best Practices

- Don't read data unnecessarily
- Use real-time listeners sparingly
- Batch write operations when possible
- Clean up listeners in component cleanup

## Offline Support

Firebase Firestore provides automatic offline support:

1. **Offline writes**: Queued and synced when online
2. **Offline reads**: Cached data available offline
3. **Conflict resolution**: Automatic on reconnection
4. **Persistence**: Enabled by default

```javascript
// Offline data is automatically cached
// Writes are queued and synced when online
await addWordToDictionary(userId, wordData) // Works offline!
```

## Troubleshooting

### Data not appearing

1. Check authentication: User must be signed in
2. Check browser console for errors
3. Verify Firestore rules allow access
4. Check network connection

### Migration not working

1. Check browser console for migration logs
2. Verify localStorage has data: `localStorage.getItem('flashcardData')`
3. Check Firestore console for migrated data
4. Try manual migration: Sign out and sign in again

### Sync issues

1. Check internet connection
2. Verify Firebase config is correct
3. Check Firestore security rules
4. Look for errors in browser console

## Future Improvements

Potential enhancements:

- [ ] Conflict resolution UI for offline edits
- [ ] Export/import data functionality
- [ ] Data backup and restore
- [ ] Analytics and usage tracking
- [ ] Advanced search and filtering
- [ ] Sharing and collaboration features

## Support

For issues or questions:
1. Check the [Firebase Setup Guide](./FIREBASE_SETUP.md)
2. Review browser console for errors
3. Check Firestore console for data
4. Open an issue on GitHub

---

**Your data is now safely stored in the cloud!** ☁️
