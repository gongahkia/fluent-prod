import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

// Import routes
import newsRoutes from './routes/news.js'
import translationRoutes from './routes/translation.js'
import vocabularyRoutes from './routes/vocabulary.js'
import aiRoutes from './routes/ai.js'

// Import Firebase and scheduled jobs
import { initializeFirebase } from './config/firebase.js'
import { initializeScheduledJob, runPostsFetchJob } from './jobs/fetchPostsJob.js'

// Load environment variables
dotenv.config()

// Initialize Firebase Admin SDK
try {
  initializeFirebase()
} catch (error) {
  console.error('⚠️  Firebase initialization failed:', error.message)
  console.error('⚠️  Posts will not be fetched/cached. Check your Firebase configuration.')
}

const app = express()
const PORT = process.env.PORT || 3001

// Trust proxy - required for rate limiting behind Render's proxy
app.set('trust proxy', 1)

// Security middleware
app.use(helmet())

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

// Compression middleware
app.use(compression())

// Body parsing middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Fluent Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      news: '/api/news',
      translate: '/api/translate',
      vocabulary: '/api/vocabulary'
    }
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API routes
app.use('/api/news', newsRoutes)
app.use('/api/translate', translationRoutes)
app.use('/api/vocabulary', vocabularyRoutes)
app.use('/api/ai', aiRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Fluent Backend running on http://localhost:${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`)

  // Initialize scheduled job for daily posts fetching
  try {
    initializeScheduledJob()
    console.log('⏰ Daily posts fetch job initialized')

    // Optionally run job immediately on startup (useful for testing)
    if (process.env.RUN_FETCH_ON_STARTUP === 'true') {
      console.log('🔄 Running initial posts fetch...')
      runPostsFetchJob().catch(err => {
        console.error('❌ Initial posts fetch failed:', err.message)
      })
    }
  } catch (error) {
    console.error('⚠️  Scheduled job initialization failed:', error.message)
  }
})
