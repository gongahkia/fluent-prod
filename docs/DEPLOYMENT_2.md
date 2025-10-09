# Fluent Backend Deployment Guide

## 🚀 Quick Deploy Options

### Option 1: Render.com (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Deploy on Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: fluent-backend
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-frontend-url.vercel.app,https://your-custom-domain.com
   GOOGLE_AI_API_KEY=your_gemini_api_key (optional)
   ```

4. **Deploy!** 🎉
   - Click "Create Web Service"
   - Wait ~5 minutes for deployment
   - Copy your backend URL: `https://fluent-backend-xxxx.onrender.com`

---

### Option 2: Railway.app

1. **Deploy with Railway**
   - Go to [railway.app](https://railway.app)
   - Click "Start a New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Node.js

2. **Set Environment Variables** in Railway dashboard:
   ```
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
   ```

3. **Get your URL**:
   - Railway provides: `https://fluent-backend.up.railway.app`

---

### Option 3: Fly.io

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Deploy**
   ```bash
   cd backend
   fly launch
   fly deploy
   ```

3. **Set secrets**:
   ```bash
   fly secrets set NODE_ENV=production
   fly secrets set ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```

---

## 🔧 Environment Variables

Required:
- `NODE_ENV` - Set to `production`
- `ALLOWED_ORIGINS` - Comma-separated list of allowed frontend URLs

Optional:
- `PORT` - Auto-set by hosting platform (default: 3001)
- `GOOGLE_AI_API_KEY` - For AI features (Gemini API)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 60000)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

---

## 📝 After Deployment

1. **Update Frontend API URL**
   - In your frontend `.env`:
     ```
     VITE_API_URL=https://your-backend-url.onrender.com
     ```

2. **Test the API**
   ```bash
   curl https://your-backend-url.onrender.com/health
   ```

3. **Monitor**
   - Check logs in your hosting platform dashboard
   - Set up uptime monitoring (e.g., UptimeRobot)

---

## 🐛 Troubleshooting

### Cold Starts (Render Free Tier)
- Free tier sleeps after 15min inactivity
- First request takes ~30s to wake up
- **Solution**: Use [cron-job.org](https://cron-job.org) to ping `/health` every 10 minutes

### CORS Errors
- Make sure `ALLOWED_ORIGINS` includes your frontend URL
- Check that frontend uses correct backend URL

### 503 Errors
- Backend might be sleeping (Render free tier)
- Wait 30s and retry
- Or upgrade to paid tier ($7/month for always-on)

---

## 💡 Tips

1. **Keep it awake** (Render free tier):
   - Use [cron-job.org](https://cron-job.org) to ping your backend every 10 minutes
   - Set URL to: `https://your-backend.onrender.com/health`

2. **Monitor usage**:
   - Railway gives $5/month free credit
   - Render gives 750 hours/month
   - Fly.io is truly unlimited (with credit card)

3. **Speed up cold starts**:
   - Use Railway or Fly.io (faster cold starts)
   - Or upgrade Render to paid ($7/month)
