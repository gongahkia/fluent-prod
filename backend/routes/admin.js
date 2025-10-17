/**
 * Admin Routes
 * Protected endpoints for Firebase database management
 */

import express from 'express'
import { adminAuth } from '../middleware/adminAuth.js'
import * as adminService from '../services/adminService.js'

const router = express.Router()

// Apply admin authentication to all routes
router.use(adminAuth)

/**
 * USERS ENDPOINTS
 */

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await adminService.getAllUsers()
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Search users
router.get('/users/search', async (req, res) => {
  try {
    const { q } = req.query
    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter "q" is required' })
    }
    const users = await adminService.searchUsers(q)
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get user by ID
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await adminService.getUserById(req.params.userId)
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(404).json({ success: false, error: error.message })
  }
})

// Update user
router.put('/users/:userId', async (req, res) => {
  try {
    const result = await adminService.updateUser(req.params.userId, req.body)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const result = await adminService.deleteUser(req.params.userId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * DICTIONARY ENDPOINTS
 */

// Get user's dictionary
router.get('/users/:userId/dictionary/:language', async (req, res) => {
  try {
    const { userId, language } = req.params
    const entries = await adminService.getUserDictionary(userId, language)
    res.json({ success: true, data: entries })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Add dictionary entry
router.post('/users/:userId/dictionary/:language', async (req, res) => {
  try {
    const { userId, language } = req.params
    const result = await adminService.addDictionaryEntry(userId, language, req.body)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Update dictionary entry
router.put('/users/:userId/dictionary/:language/:entryId', async (req, res) => {
  try {
    const { userId, language, entryId } = req.params
    const result = await adminService.updateDictionaryEntry(userId, language, entryId, req.body)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Delete dictionary entry
router.delete('/users/:userId/dictionary/:language/:entryId', async (req, res) => {
  try {
    const { userId, language, entryId } = req.params
    const result = await adminService.deleteDictionaryEntry(userId, language, entryId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * FLASHCARDS ENDPOINTS
 */

// Get user's flashcards
router.get('/users/:userId/flashcards', async (req, res) => {
  try {
    const flashcards = await adminService.getUserFlashcards(req.params.userId)
    res.json({ success: true, data: flashcards })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Update flashcard
router.put('/users/:userId/flashcards/:flashcardId', async (req, res) => {
  try {
    const { userId, flashcardId } = req.params
    const result = await adminService.updateFlashcard(userId, flashcardId, req.body)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Delete flashcard
router.delete('/users/:userId/flashcards/:flashcardId', async (req, res) => {
  try {
    const { userId, flashcardId } = req.params
    const result = await adminService.deleteFlashcard(userId, flashcardId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * SAVED POSTS ENDPOINTS
 */

// Get user's saved posts
router.get('/users/:userId/saved-posts', async (req, res) => {
  try {
    const posts = await adminService.getUserSavedPosts(req.params.userId)
    res.json({ success: true, data: posts })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Delete saved post
router.delete('/users/:userId/saved-posts/:postId', async (req, res) => {
  try {
    const { userId, postId } = req.params
    const result = await adminService.deleteSavedPost(userId, postId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * COLLECTIONS ENDPOINTS
 */

// Get user's collections
router.get('/users/:userId/collections', async (req, res) => {
  try {
    const collections = await adminService.getUserCollections(req.params.userId)
    res.json({ success: true, data: collections })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Update collection
router.put('/users/:userId/collections/:collectionId', async (req, res) => {
  try {
    const { userId, collectionId } = req.params
    const result = await adminService.updateCollection(userId, collectionId, req.body)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Delete collection
router.delete('/users/:userId/collections/:collectionId', async (req, res) => {
  try {
    const { userId, collectionId } = req.params
    const result = await adminService.deleteCollection(userId, collectionId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * SOCIAL CONNECTIONS ENDPOINTS
 */

// Get user's social connections
router.get('/users/:userId/social', async (req, res) => {
  try {
    const connections = await adminService.getUserSocialConnections(req.params.userId)
    res.json({ success: true, data: connections })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * ALL POSTS ENDPOINT
 */

// Get all dictionary entries (Japanese and Korean posts) from all users
router.get('/all-posts', async (req, res) => {
  try {
    const entries = await adminService.getAllDictionaryEntries()
    res.json({ success: true, data: entries })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
