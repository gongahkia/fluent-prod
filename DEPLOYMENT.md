# Deployment Guide

This guide covers deploying Fluent to production using Render (backend) and Vercel/Netlify (frontend).

## 🚀 Backend Deployment (Render)

### Prerequisites
- Render account
- Firebase project with service account credentials
- Gemini API key (optional, for AI features)

### Steps

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Select the `backend` directory as the root

2. **Configure Build Settings**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

3. **Set Environment Variables** (Critical!)

   Go to your Render service → Environment tab and add:

   ```
   NODE_ENV=production
   PORT=3001
   
   # Firebase Admin SDK (REQUIRED)
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n
   
   # CORS (REQUIRED) - Add your frontend URL
   ALLOWED_ORIGINS=https://your-frontend-domain.com
   
   # Gemini API (Optional but recommended)
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   
   # Optional: Run fetch job on startup
   RUN_FETCH_ON_STARTUP=false
   ```

   **Important Notes:**
   - For `FIREBASE_PRIVATE_KEY`, copy the entire private key from your service account JSON, including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
   - The `\n` newlines must be preserved in the key
   - You can find these in Firebase Console → Project Settings → Service Accounts → Generate new private key

4. **Deploy**
   - Render will automatically deploy when you push to your main branch
   - Check the logs to ensure the server starts successfully
   - You should see: `🚀 Fluent Backend running on port 3001`

### Common Issues

#### Deployment hangs at "Deploying..."
✅ **FIXED** - Server now binds to `0.0.0.0` instead of `localhost`

#### Firebase initialization fails
- Verify your environment variables are set correctly
- Ensure `FIREBASE_PRIVATE_KEY` includes the full key with newlines
- Check Render logs for specific error messages

#### CORS errors in browser
- Add your frontend URL to `ALLOWED_ORIGINS`
- Multiple origins should be comma-separated: `https://app1.com,https://app2.com`

## 🎨 Frontend Deployment (Vercel/Netlify)

### Prerequisites
- Vercel or Netlify account
- Deployed backend URL from Render

### Vercel Deployment

1. **Import your GitHub repository**
   - Go to Vercel Dashboard → New Project
   - Import your repository
   - Vercel will auto-detect Vite

2. **Configure Environment Variables**

   Add these in Vercel → Project Settings → Environment Variables:

   ```
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   
   # Backend API URL (REQUIRED)
   VITE_API_URL=https://your-backend.onrender.com
   ```

3. **Deploy**
   - Vercel will automatically build and deploy
   - Build Command: `pnpm build` (auto-detected)
   - Output Directory: `dist` (auto-detected)

4. **Update Backend CORS**
   - After deployment, copy your Vercel URL (e.g., `https://your-app.vercel.app`)
   - Go back to Render → Environment Variables
   - Update `ALLOWED_ORIGINS` to include your Vercel URL:
     ```
     ALLOWED_ORIGINS=https://your-app.vercel.app
     ```

### Netlify Deployment

Similar to Vercel:

1. **New Site from Git**
2. **Build Settings**
   - Build command: `pnpm build`
   - Publish directory: `dist`
3. **Environment Variables** - Same as Vercel
4. **Update CORS** - Add Netlify URL to backend's `ALLOWED_ORIGINS`

## 🔧 Post-Deployment Checklist

- [ ] Backend health check works: `https://your-backend.onrender.com/health`
- [ ] Frontend loads without errors
- [ ] Firebase authentication works
- [ ] News feed loads posts from backend
- [ ] Translation features work
- [ ] No CORS errors in browser console
- [ ] Check Render logs for any errors

## 🔄 Continuous Deployment

Both Render and Vercel support automatic deployments:

- **Render**: Deploys backend on push to `main` branch
- **Vercel**: Deploys frontend on push to `main` branch

## 📊 Monitoring

### Backend (Render)
- View logs: Render Dashboard → Your Service → Logs
- Monitor health: `GET https://your-backend.onrender.com/health`

### Frontend (Vercel)
- View logs: Vercel Dashboard → Your Project → Deployments → Logs
- Analytics: Available in Vercel dashboard

## 🐛 Troubleshooting

### Backend won't start
1. Check Render logs for errors
2. Verify all required environment variables are set
3. Ensure `PORT` is set or let Render provide it automatically

### Frontend can't connect to backend
1. Check `VITE_API_URL` is set correctly
2. Verify backend is running: visit `/health` endpoint
3. Check CORS settings on backend
4. Look for errors in browser console (F12)

### Firebase errors
1. Verify all Firebase environment variables are correct
2. Check Firebase Console for any restrictions on your API keys
3. Ensure Firestore security rules allow your operations

## 💰 Cost Optimization

### Render Free Tier
- Spins down after 15 minutes of inactivity
- First request after spin-down will be slow (cold start)
- Consider upgrading to paid tier for production

### Vercel Free Tier
- 100GB bandwidth per month
- Unlimited deployments
- Should be sufficient for most use cases

## 🔐 Security Considerations

- Never commit `.env` files to Git
- Use Render's secret management for sensitive values
- Rotate API keys regularly
- Monitor usage to detect unauthorized access
- Set up proper Firestore security rules

## 📚 Additional Resources

- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

