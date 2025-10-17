/**
 * Admin Authentication Middleware
 * Validates admin credentials from Basic Auth header
 */

export const adminAuth = (req, res, next) => {
  // Get Authorization header
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Dashboard"')
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    // Decode Base64 credentials
    const base64Credentials = authHeader.split(' ')[1]
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
    const [username, password] = credentials.split(':')

    // Validate credentials
    const adminUsername = process.env.ADMIN_USERNAME || 'admin'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin'

    if (username === adminUsername && password === adminPassword) {
      // Authentication successful
      next()
    } else {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin Dashboard"')
      return res.status(401).json({ error: 'Invalid credentials' })
    }
  } catch (error) {
    console.error('Admin auth error:', error)
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Dashboard"')
    return res.status(401).json({ error: 'Authentication failed' })
  }
}
