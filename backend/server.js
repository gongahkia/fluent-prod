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
import redditRoutes from './routes/reddit.js'
import adminRoutes from './routes/admin.js'

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
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"] // Allow fetch/XHR to same origin
    }
  }
}))

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']
// Add localhost:3001 for admin dashboard
allowedOrigins.push('http://localhost:3001')

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin requests like admin dashboard)
    if (!origin) {
      callback(null, true)
      return
    }

    if (allowedOrigins.includes(origin)) {
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

// Serve static files for admin dashboard
app.use('/admin', express.static('public'))

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
      vocabulary: '/api/vocabulary',
      reddit: '/api/reddit'
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
app.use('/api/reddit', redditRoutes)
app.use('/api/admin', adminRoutes)

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
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Fluent Backend running on port ${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`)
  console.log(`✅ Server is ready to accept connections`)

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

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`)
  } else {
    console.error('❌ Server error:', error)
  }
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('✅ HTTP server closed')
    process.exit(0)
  })
})
