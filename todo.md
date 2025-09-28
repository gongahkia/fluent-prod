# LivePeek - Project Development Roadmap

## Project Overview

LivePeek is a React-based Japanese language learning platform that combines news consumption with vocabulary building. Users can read Japanese news, add words to their personal dictionary, and practice with flashcards.

## 🚀 High Priority Improvements

### Do these first

- Ask claude code to debug broken hackernews implementation
- Ask claude code to implement posts from here
    1. **NewsAPI.org**
    Offers a free tier to retrieve headlines and articles from various sources.
    [NewsAPI Documentation](https://newsapi.org/docs)
    2. **The Guardian Open Platform**
    Provides access to content from The Guardian with flexible query features.
    [The Guardian API](https://open-platform.theguardian.com/)
    3. **New York Times API**
    Features a range of APIs for articles, reviews, and more. A free tier is available with registration.
    [NY Times Developer Network](https://developer.nytimes.com/)
    4. **Reddit API**
    Allows you to fetch posts from various subreddits which can be used like forum articles.
    [Reddit API Documentation](https://www.reddit.com/dev/api/)
    5. **Mediastack API**
    Offers real-time news and historical data via a free tier with usage limits.
    [Mediastack API](https://mediastack.com/)
    6. **GNews API**
    Provides a free API to retrieve global news articles suitable for dashboards.
    [GNews API](https://gnews.io/)
- Research available free APIs from social media platforms
- Design API integration architecture
- Implement API data fetching service
- Update UI components to use real API data
- Test API integration and data flow

### Code Quality & Development Experience

- [ ] **Add TypeScript** - Convert from JavaScript to TypeScript for better type safety
- [ ] **Implement proper testing** - Add Jest/React Testing Library for unit tests
- [ ] **Add end-to-end testing** - Implement Playwright or Cypress for E2E tests
- [ ] **Improve error handling** - Add proper error boundaries and user-friendly error messages
- [ ] **Add loading states** - Implement skeleton loaders and proper loading indicators

### Performance Optimizations

- [ ] **Implement React.memo** - Optimize component re-renders in NewsFeed and Dictionary
- [ ] **Add lazy loading** - Code split routes and components for better initial load
- [ ] **Optimize bundle size** - Analyze and reduce bundle size with webpack-bundle-analyzer
- [ ] **Add service worker** - Implement PWA features for offline functionality
- [ ] **Image optimization** - Add proper image loading and optimization

### Backend Integration

- [ ] **Real news API integration** - Replace mock data with actual Japanese news sources
- [ ] **User authentication backend** - Implement proper user management system
- [ ] **Database integration** - Persist user dictionaries and progress
- [ ] **API rate limiting** - Implement proper rate limiting for news API calls
- [ ] **Caching strategy** - Add Redis or similar for API response caching

## 🎯 Feature Enhancements

### Learning Features

- [ ] **Spaced repetition algorithm** - Improve flashcard learning with SRS
- [ ] **Progress tracking** - Add detailed learning analytics and charts
- [ ] **Word difficulty levels** - Implement JLPT level categorization
- [ ] **Audio pronunciation** - Add text-to-speech for Japanese words
- [ ] **Kanji breakdown** - Show kanji components and radicals

### User Experience

- [ ] **Dark mode** - Implement proper dark/light theme switching
- [ ] **Keyboard shortcuts** - Add navigation and learning shortcuts
- [ ] **Mobile improvements** - Better responsive design and touch interactions
- [ ] **Accessibility** - Improve ARIA labels and screen reader support
- [ ] **User onboarding** - Enhanced tutorial and feature discovery

### Content & Personalization

- [ ] **Multiple news sources** - Add variety of Japanese news sources
- [ ] **Content difficulty filtering** - Allow users to filter by reading level
- [ ] **Reading comprehension quizzes** - Add questions about news articles
- [ ] **Personal reading goals** - Set and track daily/weekly reading targets
- [ ] **Word frequency analysis** - Show most common words in user's reading

## 🔧 Technical Debt & Infrastructure

### Code Organization

- [ ] **Component refactoring** - Break down large components like App.jsx
- [ ] **Custom hooks** - Extract reusable logic into custom hooks
- [ ] **Context optimization** - Implement proper state management (Redux/Zustand)
- [ ] **Constants file** - Extract magic numbers and strings
- [ ] **Utility functions** - Create shared utility functions

### Build & Deployment

- [ ] **Environment configuration** - Proper env variable management
- [ ] **CI/CD pipeline** - Automated testing and deployment
- [ ] **Docker containerization** - Add Dockerfile for consistent deployment
- [ ] **Performance monitoring** - Add monitoring with Sentry or similar
- [ ] **Analytics integration** - Add user behavior analytics

### Security

- [ ] **Input sanitization** - Proper XSS protection for user content
- [ ] **Content Security Policy** - Implement CSP headers
- [ ] **API security** - Secure API endpoints and add authentication
- [ ] **Data validation** - Client and server-side validation

## 📱 Mobile & PWA Features

- [ ] **Native app wrapper** - Consider React Native or Capacitor
- [ ] **Offline reading** - Cache articles for offline access
- [ ] **Push notifications** - Remind users to practice daily
- [ ] **Share functionality** - Share articles and vocabulary
- [ ] **Widget support** - Quick access to daily vocabulary

## 🌐 Internationalization

- [ ] **Multi-language support** - Add Korean, Chinese, and other languages
- [ ] **RTL support** - Right-to-left language support
- [ ] **Localization** - Translate UI to different languages
- [ ] **Cultural adaptation** - Adapt content for different regions

## 📊 Analytics & Insights

- [ ] **Learning analytics dashboard** - Detailed progress visualization
- [ ] **Reading speed tracking** - Monitor improvement over time
- [ ] **Vocabulary retention rates** - Track which words are remembered
- [ ] **Usage patterns** - Understand how users interact with the app
- [ ] **A/B testing framework** - Test different learning approaches

## 🔗 Integrations

- [ ] **Dictionary APIs** - Integrate with Jisho.org or similar
- [ ] **Translation services** - Google Translate or DeepL integration
- [ ] **Social features** - Share progress with friends
- [ ] **Export functionality** - Export vocabulary to Anki or CSV
- [ ] **Import existing vocabulary** - Import from other learning apps

## Current Technical Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **State**: React Hooks (local state)
- **Build**: Vite
- **Package Manager**: pnpm

## Immediate Next Steps (This Week)

1. Add pre-commit and pre-push hooks for code quality
2. Implement TypeScript conversion
3. Add basic unit tests for core components
4. Improve error handling and loading states
5. Optimize mobile experience
