/**
 * Supabase JWT Authentication Middleware
 * Verifies JWT tokens from Supabase Auth
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for backend operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Middleware to verify Supabase JWT token
 * Attaches user object to req.user if valid
 */
export async function authenticateUser(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

/**
 * Optional authentication - adds user if token is present but doesn't require it
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)

      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
        }
      }
    }

    next()
  } catch (error) {
    // Continue without authentication
    next()
  }
}

/**
 * Middleware to check if user is admin
 * Must be used after authenticateUser
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  // Check if user has admin role
  // You can implement custom admin checking logic here
  // For now, we'll check against an admin email list in env
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []

  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({ error: 'Admin access required' })
  }

  next()
}

export default {
  authenticateUser,
  optionalAuth,
  requireAdmin
}
