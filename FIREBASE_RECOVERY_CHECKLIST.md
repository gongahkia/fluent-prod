# Firebase Recovery Checklist

Quick reference checklist for recovering your Firebase project. See `FIREBASE_RECOVERY_GUIDE.md` for detailed instructions.

## ☐ Step 1: Create New Firebase Project
- [ ] Go to https://console.firebase.google.com/
- [ ] Click "Add project" / "Create a project"
- [ ] Name your project (e.g., `fluent-prod`)
- [ ] Enable/disable Google Analytics as desired
- [ ] Wait for project creation to complete

## ☐ Step 2: Enable Authentication
- [ ] Navigate to Authentication → Sign-in method
- [ ] Enable **Email/Password** provider
- [ ] Enable **Google** provider
- [ ] Set project support email

## ☐ Step 3: Create Firestore Database
- [ ] Navigate to Firestore Database
- [ ] Click "Create database"
- [ ] Choose **Production mode**
- [ ] Select location (cannot be changed later!)
- [ ] Click "Enable"

## ☐ Step 4: Configure Firestore Security Rules
- [ ] Go to Firestore → Rules tab
- [ ] Copy rules from `FIREBASE_RECOVERY_GUIDE.md` Step 4
- [ ] Click "Publish"

## ☐ Step 5: Create Firestore Indexes
- [ ] Go to Firestore → Indexes tab
- [ ] Create index for `dictionaryWords` collection:
  - Collection: `dictionaryWords` (Collection group)
  - Fields: `language` (Ascending), `createdAt` (Descending)
- [ ] Create index for `savedPosts` collection:
  - Collection: `savedPosts` (Collection group)
  - Fields: `savedAt` (Descending)
- [ ] Note: Additional indexes may be auto-suggested when you use the app

## ☐ Step 6: Get Firebase Config
- [ ] Click gear icon → Project settings
- [ ] Scroll to "Your apps" section
- [ ] Add web app if not present (click `</>` icon)
- [ ] Copy all config values:
  - `apiKey`
  - `authDomain`
  - `projectId`
  - `storageBucket`
  - `messagingSenderId`
  - `appId`

## ☐ Step 7: Update .env File
- [ ] Open `.env` file in project root
- [ ] Replace with Firebase credentials:
  ```env
  VITE_FIREBASE_API_KEY=your_api_key
  VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=your_project_id
  VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
  VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
  VITE_FIREBASE_APP_ID=your_app_id
  ```
- [ ] Save file

## ☐ Step 8: Test Configuration
- [ ] Stop any running dev servers
- [ ] Clear browser local storage and cookies
- [ ] Run `pnpm run dev`
- [ ] Test email registration
- [ ] Test email login
- [ ] Test Google sign-in (if configured)
- [ ] Test creating/saving dictionary words
- [ ] Test saving posts

## ☐ Optional: Configure Google OAuth Production
- [ ] Go to https://console.cloud.google.com/
- [ ] Select your Firebase project
- [ ] Navigate to APIs & Services → OAuth consent screen
- [ ] Configure app information
- [ ] Add necessary scopes (email, profile)
- [ ] Add test users if needed

## ☐ Optional: Set Up Firebase CLI
- [ ] Run `npm install -g firebase-tools`
- [ ] Run `firebase login`
- [ ] Run `firebase init` in project directory
- [ ] Select Firestore
- [ ] Choose existing project

---

## Quick Commands

```bash
# Start dev server
pnpm run dev

# Build for production
pnpm run build

# View dev server
# Open http://localhost:5173
```

## Environment Variables Required

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Common Issues

**"Missing Firebase env var"**
→ Restart dev server after updating .env

**"Query requires an index"**
→ Click error link to auto-create index

**"Permission denied"**
→ Check Firestore security rules

**Google Sign-In not working**
→ Verify Google provider enabled in Authentication

---

**Status**: ☐ Not Started | ⏳ In Progress | ✓ Complete
