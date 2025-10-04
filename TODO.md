# TODO.md - Remaining Tasks for Influent

Based on the analysis of your current codebase, here are the remaining tasks to complete your language learning platform:

## ✅ COMPLETED FEATURES
- ✅ **Basic React app structure** with Vite
- ✅ **News feed with real posts** from Reddit (and configurable Twitter/Instagram)
- ✅ **Translation engine** with multiple providers (Lingva, MyMemory, LibreTranslate)
- ✅ **Mixed language content** based on user learning level (5 levels)
- ✅ **Interactive word clicking** for vocabulary learning
- ✅ **User dictionary** with word management
- ✅ **Flashcard system** with spaced repetition
- ✅ **Comment system** with Reddit-style threading
- ✅ **AI-powered comment suggestions** using Google Gemini
- ✅ **Onboarding process** with level selection
- ✅ **User profile management** with API key configuration
- ✅ **Backend API** with caching and rate limiting
- ✅ **Vocabulary detection** using NLP (Compromise.js)

## 🚧 REMAINING TASKS

### 1. **Database Integration & Data Persistence** (HIGH PRIORITY)
- [ ] **Integrate Firebase or PostgreSQL** for user data persistence
  - Currently using localStorage only - data is lost on browser clear
  - Need to store: user profiles, dictionaries, progress, settings
  - Consider Firebase for ease of setup or PostgreSQL for more control
- [ ] **User authentication system** with real accounts
  - Currently using mock authentication
  - Implement proper login/signup with email/password or OAuth
- [ ] **Data synchronization** between devices
  - Sync user dictionary and progress across devices
  - Handle offline/online data conflicts

### 2. **Deployment & Hosting** (HIGH PRIORITY)
- [ ] **Deploy backend to cloud service**
  - Options: Railway, Render, Heroku, or AWS
  - Set up environment variables for production
  - Configure CORS for production domain
- [ ] **Deploy frontend to hosting service**
  - Options: Vercel, Netlify, or GitHub Pages
  - Configure build process and environment variables
- [ ] **Set up custom domain** (optional)
- [ ] **Configure SSL/HTTPS** for production
- [ ] **Set up monitoring and logging** for production

### 3. **Multiple Languages Support** (MEDIUM PRIORITY)
- [ ] **Expand beyond Japanese**
  - Add Korean, Chinese, Spanish, French, etc.
  - Update translation service to support more language pairs
  - Modify UI to support different writing systems
- [ ] **Language-specific features**
  - Different difficulty systems per language
  - Language-specific vocabulary databases
  - Cultural context and examples

### 4. **Enhanced Difficulty System** (MEDIUM PRIORITY)
- [ ] **Improve post difficulty classification**
  - Currently using basic 5-level system
  - Implement more sophisticated difficulty analysis
  - Consider post length, vocabulary complexity, grammar patterns
- [ ] **Dynamic difficulty adjustment**
  - Adjust based on user performance
  - Personalized difficulty recommendations
- [ ] **Content correlation with difficulty**
  - Ensure post content matches difficulty level
  - Better translation percentage based on actual content complexity

### 5. **Onboarding Improvements** (LOW PRIORITY)
- [ ] **Enhanced onboarding flow**
  - Add more interactive examples
  - Better level assessment quiz
  - Preview of different difficulty levels
- [ ] **A/B testing for onboarding**
  - Test different onboarding approaches
  - Swiping vs dropdown interface options

### 6. **Content & Sources** (MEDIUM PRIORITY)
- [ ] **Expand news sources**
  - Add more Japanese news sites
  - Include YouTube comments, TikTok, other social platforms
  - Add RSS feed support
- [ ] **Content curation**
  - Better filtering of inappropriate content
  - Quality scoring for posts
  - User reporting system

### 7. **Comment System Enhancements** (LOW PRIORITY)
- [ ] **Comment moderation**
  - Human moderation system
  - AI-powered content filtering
  - User reporting and flagging
- [ ] **Enhanced AI moderation**
  - Grammar and vocabulary suggestions
  - Cultural appropriateness checking
  - Spam detection

### 8. **Topics & Trending** (LOW PRIORITY)
- [ ] **Trending topics system**
  - Track popular topics across sources
  - Display trending hashtags and themes
  - Topic-based content filtering

### 9. **Performance & Optimization** (MEDIUM PRIORITY)
- [ ] **Optimize translation API calls**
  - Batch translation requests
  - Better caching strategies
  - Reduce API costs
- [ ] **Improve loading performance**
  - Lazy loading for posts
  - Image optimization
  - Code splitting
- [ ] **Mobile optimization**
  - Better mobile UI/UX
  - Touch gestures for word interaction
  - Offline support

### 10. **Analytics & Progress Tracking** (LOW PRIORITY)
- [ ] **Learning analytics**
  - Track learning progress over time
  - Identify learning patterns
  - Suggest study schedules
- [ ] **User engagement metrics**
  - Track which features are most used
  - A/B test different UI elements
  - User retention analysis

## 🎯 IMMEDIATE NEXT STEPS (Recommended Order)

1. **Set up database integration** (Firebase recommended for quick setup)
2. **Deploy backend to cloud service** (Railway or Render)
3. **Deploy frontend to Vercel or Netlify**
4. **Implement real user authentication**
5. **Test end-to-end functionality in production**

## 📝 NOTES

- Your current implementation is quite comprehensive for a beta version
- The core learning functionality is working well
- Focus on data persistence and deployment first to make it production-ready
- Consider user feedback before adding more complex features
- The AI integration with Gemini is well-implemented and working

## 🔧 TECHNICAL DEBT

- Fix the missing `newWord` variable in `App.jsx` line 58
- Add proper error handling for API failures
- Implement proper loading states throughout the app
- Add unit tests for critical functions
- Add TypeScript for better type safety (optional)

---

*Last updated: [Current Date]*
*Total completed features: ~70%*
*Estimated time to production-ready: 2-3 weeks*
