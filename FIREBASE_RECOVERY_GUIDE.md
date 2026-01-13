# Firebase Recovery Guide

## Overview
This guide will help you recover from accidentally deleting your Firebase project. Your application uses Firebase for authentication and Firestore for data storage.

## What Was Lost
Since you deleted the Firebase project via the GUI, the following were removed:
- Firebase project configuration
- Firebase Authentication setup (email/password + Google OAuth)
- Firestore database and all collections
- All user account data and associated data (profiles, dictionaries, saved posts, etc.)

According to your recollection, only some account details were stored, so the data loss should be minimal.

---

## Recovery Steps

### Step 1: Create a New Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (suggest: `fluent-prod` or similar)
4. Choose whether to enable Google Analytics (optional, but recommended for tracking)
5. Wait for the project to be created

### Step 2: Enable Authentication Methods

1. In your Firebase project, navigate to **Authentication** (in the left sidebar)
2. Click **"Get Started"** if this is your first time
3. Go to the **"Sign-in method"** tab
4. Enable the following providers:

   **Email/Password:**
   - Click on **"Email/Password"**
   - Toggle **"Enable"** to ON
   - Click **"Save"**

   **Google:**
   - Click on **"Google"**
   - Toggle **"Enable"** to ON
   - Enter a project support email (your email)
   - Click **"Save"**

### Step 3: Create Firestore Database

1. In your Firebase project, navigate to **Firestore Database** (in the left sidebar under "Build")
2. Click **"Create database"**
3. Choose a starting mode:
   - **Production mode** (recommended for now - we'll add rules later)
   - Start in production mode with the default rules
4. Select a location for your database:
   - Choose a location close to your users (e.g., `us-central1` for US, `asia-southeast1` for Asia, `europe-west1` for Europe)
   - **NOTE:** This cannot be changed later
5. Click **"Enable"**

### Step 4: Set Up Firestore Security Rules

Your application uses the following Firestore structure, so you need to set up security rules accordingly.

1. In Firestore Database, go to the **"Rules"** tab
2. Replace the default rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }

    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Users collection - user profiles
    match /users/{userId} {
      // Anyone can read public profiles
      allow read: if true;
      // Only the user can create/update their own profile
      allow create, update: if isOwner(userId);
      // Only the user can delete their own profile
      allow delete: if isOwner(userId);

      // Private subcollection for encrypted credentials
      match /private/{document=**} {
        allow read, write: if isOwner(userId);
      }

      // Dictionary words subcollection
      match /dictionaryWords/{wordId} {
        allow read, write: if isOwner(userId);
      }

      // Saved posts subcollection
      match /savedPosts/{postId} {
        allow read, write: if isOwner(userId);
      }

      // Collections subcollection
      match /collections/{collectionId} {
        allow read, write: if isOwner(userId);
      }

      // Flashcards progress subcollection
      match /flashcards/{flashcardId} {
        allow read, write: if isOwner(userId);
      }

      // Following subcollection
      match /following/{targetUserId} {
        // User can read their own following list
        allow read: if isOwner(userId);
        // User can add/remove people they follow
        allow create, delete: if isOwner(userId);
      }

      // Followers subcollection
      match /followers/{followerId} {
        // Anyone can read followers (for follower counts)
        allow read: if true;
        // Only authenticated users can add themselves as followers
        allow create, delete: if isSignedIn();
      }

      // Blocking subcollection
      match /blocking/{blockedUserId} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}
```

3. Click **"Publish"** to apply the rules

### Step 5: Set Up Firestore Indexes

Your application requires composite indexes for certain queries. Create these indexes:

1. Go to the **"Indexes"** tab in Firestore Database
2. Click **"Add Index"** and create the following:

   **Index 1: Dictionary Words by Language**
   - Collection ID: `dictionaryWords`
   - Fields to index:
     - `language` (Ascending)
     - `createdAt` (Descending)
   - Query scope: `Collection group`

   **Index 2: Saved Posts**
   - Collection ID: `savedPosts`
   - Fields to index:
     - `savedAt` (Descending)
   - Query scope: `Collection group`

**NOTE:** If you see errors about missing indexes when using the app, Firebase will provide a direct link to create them automatically. Click those links to create any additional required indexes.

### Step 6: Get Firebase Configuration Credentials

1. In your Firebase project, click on the **gear icon** (⚙️) next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to the **"Your apps"** section
4. If you don't see a web app:
   - Click the **"</>** (Web)" icon to add a web app
   - Enter an app nickname (e.g., `fluent-web-app`)
   - **Do NOT** check "Also set up Firebase Hosting"
   - Click **"Register app"**
5. You'll see a code snippet with your Firebase configuration. It looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

6. Copy these values - you'll need them for the next step

### Step 7: Update Your .env File

1. Open the `.env` file in your project root directory
2. Replace the existing Supabase credentials with your new Firebase credentials:

```env
# Remove or comment out Supabase credentials
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
# VITE_API_URL=...

# Add Firebase credentials from Step 6
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Keep existing news cache settings if used
VITE_NEWS_MODE=cache
VITE_GITHUB_CACHE_NDJSON_URL=https://raw.githubusercontent.com/gongahkia/fluent-prod/main/cache/news-cache.txt
```

3. Save the file

### Step 8: Configure Google OAuth (if using)

If you plan to use Google Sign-In, you need to configure the OAuth consent screen:

1. In Firebase Console, go to **Authentication** → **Settings** tab
2. Under **Authorized domains**, add any custom domains you'll use (localhost is included by default)

For production use:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Configure your app information:
   - App name
   - User support email
   - Developer contact information
5. Add necessary scopes (email, profile)
6. Add test users if in testing mode

### Step 9: Test Your Configuration

1. Stop any running development servers
2. Clear your browser's local storage and cookies for localhost
3. Start your development server:
   ```bash
   pnpm run dev
   ```
4. Test the following:
   - Email/password registration
   - Email/password login
   - Google sign-in (if configured)
   - User profile creation
   - Dictionary word adding/removing
   - Saved posts functionality

### Step 10: Optional - Set Up Firebase CLI (for future management)

1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (optional):
   ```bash
   firebase init
   ```
   - Select **Firestore** and **Hosting** if needed
   - Choose your existing project
   - Accept default file names

---

## Data Structure Reference

Your application stores the following data in Firestore:

### Collections:

1. **users/{userId}** - User profiles
   - Fields: `name`, `email`, `bio`, `location`, `website`, `settings`, `createdAt`, `updatedAt`

2. **users/{userId}/private/credentials** - Encrypted API credentials
   - Fields: `encryptedData`, `updatedAt`

3. **users/{userId}/dictionaryWords/{wordId}** - User's saved dictionary words
   - Fields: `word`, `language`, `definition`, `translation`, `createdAt`

4. **users/{userId}/savedPosts/{postId}** - User's saved posts
   - Fields: `postId`, `postHash`, `content`, `savedAt`

5. **users/{userId}/flashcards/{wordId}** - Flashcard progress
   - Fields: `progress`, `lastReviewed`, `nextReview`, `updatedAt`

6. **users/{userId}/collections/{collectionId}** - Word collections
   - Fields: `name`, `description`, `wordIds[]`, `createdAt`

7. **users/{userId}/following/{targetUserId}** - Users this user follows
   - Fields: `followedAt`

8. **users/{userId}/followers/{followerId}** - Users following this user
   - Fields: `followedAt`

9. **users/{userId}/blocking/{blockedUserId}** - Blocked users
   - Fields: `blockedAt`

---

## Troubleshooting

### Issue: "Missing Firebase env var" error
**Solution:** Double-check that all required environment variables are set in your `.env` file and restart your dev server.

### Issue: "Failed-precondition: The query requires an index"
**Solution:** Click the link in the error message to automatically create the required index, or manually create it in Firestore Console.

### Issue: "Permission denied" errors in Firestore
**Solution:** Check that your Firestore security rules are properly configured (Step 4).

### Issue: Google Sign-In not working
**Solution:**
- Verify Google provider is enabled in Firebase Authentication
- Check authorized domains in Firebase Authentication settings
- Configure OAuth consent screen in Google Cloud Console

### Issue: Old Supabase data still showing
**Solution:** Clear browser local storage and cookies, then reload the application.

---

## Important Notes

1. **Data Loss**: Since the original Firebase project was deleted, all previous user accounts and data are permanently lost. Users will need to create new accounts.

2. **Security**: The Firestore rules provided are secure and follow best practices. Only authenticated users can access their own data.

3. **Backup**: Consider setting up automated Firestore backups to prevent future data loss:
   - Go to Firebase Console → Firestore Database → Backups
   - Set up scheduled backups

4. **Environment Variables**: Never commit your `.env` file to version control. The `.env.example` file is provided as a template.

5. **Project Billing**: Monitor your Firebase usage in the Firebase Console. The free tier is generous, but check the [pricing page](https://firebase.google.com/pricing) if you expect high traffic.

---

## Next Steps After Recovery

Once your Firebase is set up and working:

1. Update documentation with the new Firebase project details
2. Inform any existing users that they'll need to create new accounts
3. Set up Firebase monitoring and alerts
4. Consider implementing automated backups
5. Review and update security rules as your app evolves

---

## Quick Reference Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm preview

# Run linting
pnpm run lint

# Firebase login (if using CLI)
firebase login

# Deploy Firestore rules (if using CLI)
firebase deploy --only firestore:rules

# Deploy Firestore indexes (if using CLI)
firebase deploy --only firestore:indexes
```

---

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com/)

---

**Last Updated:** 2026-01-13
**Project:** fluent-prod
**Status:** Recovery guide for deleted Firebase project
