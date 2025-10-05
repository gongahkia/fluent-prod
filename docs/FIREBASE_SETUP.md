# Firebase Setup Guide for Influent

This guide will walk you through setting up Firebase for authentication and data persistence in the Influent app.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Firebase Project](#create-firebase-project)
3. [Enable Authentication](#enable-authentication)
4. [Enable Firestore Database](#enable-firestore-database)
5. [Configure Environment Variables](#configure-environment-variables)
6. [Security Rules](#security-rules)
7. [Testing](#testing)

---

## Prerequisites

- A Google account
- Node.js and npm installed
- Basic understanding of Firebase

---

## Create Firebase Project

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Sign in with your Google account

2. **Create a new project**
   - Click "Add project"
   - Enter project name (e.g., "influent-app")
   - (Optional) Enable Google Analytics
   - Click "Create project"

3. **Register your web app**
   - In the Firebase console, click the web icon (`</>`)
   - Register app nickname (e.g., "Influent Web")
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

4. **Copy Firebase configuration**
   - You'll see a configuration object with your Firebase credentials
   - Keep this page open - you'll need these values in the next steps

---

## Enable Authentication

1. **Navigate to Authentication**
   - In Firebase console, click "Authentication" in the left sidebar
   - Click "Get started"

2. **Enable Email/Password**
   - Click on the "Sign-in method" tab
   - Click "Email/Password"
   - Enable both toggles:
     - ✅ Email/Password
     - ✅ Email link (passwordless sign-in)
   - Click "Save"

3. **Enable Google Sign-In**
   - Click "Google" in the sign-in providers list
   - Toggle "Enable"
   - Enter project support email (your email)
   - Click "Save"

4. **(Optional) Configure OAuth consent screen**
   - For production apps, configure the OAuth consent screen in Google Cloud Console
   - Add authorized domains for your app

---

## Enable Firestore Database

1. **Navigate to Firestore Database**
   - In Firebase console, click "Firestore Database" in the left sidebar
   - Click "Create database"

2. **Choose starting mode**
   - Select "Start in production mode" (we'll add rules next)
   - Click "Next"

3. **Select location**
   - Choose a Cloud Firestore location close to your users
   - Note: This cannot be changed later!
   - Click "Enable"

4. **Set up Firestore security rules**
   - Go to the "Rules" tab
   - Replace the default rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if isOwner(userId);

      // Dictionary subcollection
      match /dictionary/{wordId} {
        allow read, write: if isOwner(userId);
      }

      // Flashcards subcollection
      match /flashcards/{flashcardId} {
        allow read, write: if isOwner(userId);
      }

      // Saved posts subcollection
      match /savedPosts/{postId} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}
```

5. **Publish the rules**
   - Click "Publish"

---

## Configure Environment Variables

1. **Create a `.env` file**
   - In the root of your project, create a file named `.env`
   - You can use `.env.example` as a template

2. **Add Firebase credentials**
   - Copy your Firebase config values from the Firebase console
   - Add them to your `.env` file:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. **Important Security Notes**
   - ⚠️ **NEVER commit `.env` to version control**
   - The `.env` file is already in `.gitignore`
   - For production, set these as environment variables in your hosting platform

---

## Database Structure

The app uses the following Firestore structure:

```
users/
  {userId}/
    # User profile data
    name: string
    email: string
    nativeLanguage: string
    targetLanguage: string
    level: number (1-5)
    bio: string
    location: string
    website: string
    settings: object
    createdAt: timestamp
    updatedAt: timestamp

    dictionary/
      {wordId}/
        japanese: string
        hiragana: string
        english: string
        level: number
        example: string
        exampleEn: string
        source: string
        dateAdded: timestamp

    flashcards/
      {wordId}/
        interval: number
        easeFactor: number
        repetitions: number
        lastReviewed: timestamp
        nextReview: timestamp

    savedPosts/
      {postId}/
        # Post data
        savedAt: timestamp
```

---

## Security Rules

### Understanding the Rules

The security rules we set up ensure:
- Users can only access their own data
- All operations require authentication
- Each user's data is isolated in their own document

### Testing Rules

You can test your security rules in the Firebase console:
1. Go to Firestore Database → Rules
2. Click "Rules Playground"
3. Test different operations with authenticated and unauthenticated users

---

## Testing

### 1. **Test Authentication**

Run the app and try:
- Creating a new account with email/password
- Signing in with an existing account
- Signing in with Google
- Signing out

### 2. **Test Data Persistence**

After authenticating:
- Add words to your dictionary from posts
- Verify they appear in the Dictionary page
- Check Firestore console to see the data
- Study flashcards and verify progress is saved
- Close and reopen the app - data should persist

### 3. **Test Cross-Device Sync**

- Sign in on one device/browser
- Add a word to dictionary
- Sign in with the same account on another device/browser
- Verify the word appears there too (may take a few seconds)

### 4. **Test Data Migration**

If you had data in localStorage:
- Sign in for the first time
- Your flashcard progress should migrate automatically
- Check the browser console for migration messages

---

## Common Issues & Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- **Solution**: Check that authentication providers are enabled in Firebase console
- Verify Email/Password and Google are enabled in Authentication → Sign-in methods

### "Missing or insufficient permissions"
- **Solution**: Check Firestore security rules
- Verify you're signed in and the rules allow access to your user document

### Data not syncing
- **Solution**: Check browser console for errors
- Verify Firebase configuration in `.env` is correct
- Check internet connection
- Verify Firestore security rules

### "QuotaExceededError: The quota has been exceeded"
- **Solution**: localStorage is full
- The migration should clear old localStorage data automatically
- Manually clear browser data if needed

### Google Sign-In not working
- **Solution**: Add your domain to authorized domains
- Go to Authentication → Settings → Authorized domains
- Add `localhost` for development

---

## Production Deployment

When deploying to production:

1. **Update authorized domains**
   - Add your production domain to Firebase Authentication
   - Go to Authentication → Settings → Authorized domains

2. **Set environment variables**
   - Set Firebase config as environment variables in your hosting platform
   - Do NOT commit `.env` file to repository

3. **Configure CORS**
   - Update backend CORS settings to allow your production domain

4. **Monitor usage**
   - Check Firebase console for usage metrics
   - Upgrade to Blaze plan if you exceed free tier limits

---

## Firebase Free Tier Limits

Be aware of these limits:
- **Authentication**: 10,000 verifications/month (phone auth only)
- **Firestore**:
  - 50,000 reads/day
  - 20,000 writes/day
  - 20,000 deletes/day
  - 1 GB storage
- **Hosting**: 10 GB storage, 360 MB/day transfer

For most users, these limits are sufficient. Upgrade to Blaze (pay-as-you-go) if needed.

---

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com/)

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Firebase console logs
3. Check browser console for errors
4. Open an issue on the GitHub repository

---

**That's it! Your Firebase backend is now set up and ready to use.** 🎉
