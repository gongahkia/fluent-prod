/**
 * Admin Service
 * Provides admin operations for managing users and data via Prisma
 */

import * as prismaService from './prismaService.js'

/**
 * Get all users with their profiles
 */
export const getAllUsers = async () => {
  try {
    const { prisma } = await import('./prismaService.js')

    const users = await prisma.user.findMany({
      include: {
        settings: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return users
  } catch (error) {
    console.error('Error getting all users:', error)
    throw error
  }
}

/**
 * Search users by name or email
 */
export const searchUsers = async (query) => {
  try {
    const result = await prismaService.searchUsers(query, 50)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  } catch (error) {
    console.error('Error searching users:', error)
    throw error
  }
}

/**
 * Get a single user by ID with all their data
 */
export const getUserById = async (userId) => {
  try {
    const result = await prismaService.getUserProfile(userId)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  } catch (error) {
    console.error('Error getting user:', error)
    throw error
  }
}

/**
 * Update user data
 */
export const updateUser = async (userId, data) => {
  try {
    const result = await prismaService.updateUserProfile(userId, data)
    return result
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

/**
 * Delete a user and all their data (CASCADE handled by Prisma schema)
 */
export const deleteUser = async (userId) => {
  try {
    const result = await prismaService.deleteUserProfile(userId)
    return result
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

/**
 * Get user's dictionary for a specific language
 */
export const getUserDictionary = async (userId, language) => {
  try {
    const result = await prismaService.getUserDictionary(userId, language)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  } catch (error) {
    console.error('Error getting dictionary:', error)
    throw error
  }
}

/**
 * Add dictionary entry
 */
export const addDictionaryEntry = async (userId, language, entryData) => {
  try {
    const result = await prismaService.addWordToDictionary(userId, {
      ...entryData,
      language
    })
    return result
  } catch (error) {
    console.error('Error adding dictionary entry:', error)
    throw error
  }
}

/**
 * Update dictionary entry
 */
export const updateDictionaryEntry = async (userId, language, entryId, data) => {
  try {
    const { prisma } = await import('./prismaService.js')

    const entry = await prisma.dictionaryWord.update({
      where: {
        id: entryId,
        userId // Ensure user owns the entry
      },
      data
    })

    return { success: true, data: entry }
  } catch (error) {
    console.error('Error updating dictionary entry:', error)
    throw error
  }
}

/**
 * Delete dictionary entry
 */
export const deleteDictionaryEntry = async (userId, language, entryId) => {
  try {
    const result = await prismaService.removeWordFromDictionary(userId, entryId)
    return result
  } catch (error) {
    console.error('Error deleting dictionary entry:', error)
    throw error
  }
}

/**
 * Get user's flashcards
 */
export const getUserFlashcards = async (userId) => {
  try {
    const result = await prismaService.getFlashcardProgress(userId)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  } catch (error) {
    console.error('Error getting flashcards:', error)
    throw error
  }
}

/**
 * Update flashcard
 */
export const updateFlashcard = async (userId, flashcardId, data) => {
  try {
    const { prisma } = await import('./prismaService.js')

    const flashcard = await prisma.flashcard.update({
      where: {
        id: flashcardId,
        userId
      },
      data
    })

    return { success: true, data: flashcard }
  } catch (error) {
    console.error('Error updating flashcard:', error)
    throw error
  }
}

/**
 * Delete flashcard
 */
export const deleteFlashcard = async (userId, flashcardId) => {
  try {
    const { prisma } = await import('./prismaService.js')

    await prisma.flashcard.delete({
      where: {
        id: flashcardId,
        userId
      }
    })

    return { success: true, message: 'Flashcard deleted successfully' }
  } catch (error) {
    console.error('Error deleting flashcard:', error)
    throw error
  }
}

/**
 * Get user's saved posts
 */
export const getUserSavedPosts = async (userId) => {
  try {
    const result = await prismaService.getSavedPosts(userId)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  } catch (error) {
    console.error('Error getting saved posts:', error)
    throw error
  }
}

/**
 * Delete saved post
 */
export const deleteSavedPost = async (userId, postId) => {
  try {
    const result = await prismaService.removeSavedPost(userId, postId)
    return result
  } catch (error) {
    console.error('Error deleting saved post:', error)
    throw error
  }
}

/**
 * Get user's collections
 */
export const getUserCollections = async (userId) => {
  try {
    const result = await prismaService.getCollections(userId)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  } catch (error) {
    console.error('Error getting collections:', error)
    throw error
  }
}

/**
 * Update collection
 */
export const updateCollection = async (userId, collectionId, data) => {
  try {
    const result = await prismaService.updateCollection(userId, collectionId, data)
    return result
  } catch (error) {
    console.error('Error updating collection:', error)
    throw error
  }
}

/**
 * Delete collection
 */
export const deleteCollection = async (userId, collectionId) => {
  try {
    const result = await prismaService.deleteCollection(userId, collectionId)
    return result
  } catch (error) {
    console.error('Error deleting collection:', error)
    throw error
  }
}

/**
 * Get user's social connections (followers and following)
 */
export const getUserSocialConnections = async (userId) => {
  try {
    const [followersResult, followingResult] = await Promise.all([
      prismaService.getUserFollowers(userId),
      prismaService.getUserFollowing(userId)
    ])

    if (!followersResult.success || !followingResult.success) {
      throw new Error('Failed to get social connections')
    }

    return {
      followers: followersResult.data,
      following: followingResult.data
    }
  } catch (error) {
    console.error('Error getting social connections:', error)
    throw error
  }
}

/**
 * Get all dictionary entries from all users
 */
export const getAllDictionaryEntries = async () => {
  try {
    const { prisma } = await import('./prismaService.js')

    const entries = await prisma.dictionaryWord.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return entries
  } catch (error) {
    console.error('Error getting all dictionary entries:', error)
    throw error
  }
}

/**
 * Get all posts from news-cache
 */
export const getAllNewsCachePosts = async () => {
  try {
    const { prisma } = await import('./prismaService.js')

    const posts = await prisma.newsCache.findMany({
      orderBy: { fetchedAt: 'desc' }
    })

    // Group by cacheKey for easier management
    const grouped = posts.reduce((acc, post) => {
      if (!acc[post.cacheKey]) {
        acc[post.cacheKey] = []
      }
      acc[post.cacheKey].push(post)
      return acc
    }, {})

    return grouped
  } catch (error) {
    console.error('Error getting news cache posts:', error)
    throw error
  }
}

/**
 * Update a post in news-cache
 */
export const updateNewsCachePost = async (cacheKey, postId, data) => {
  try {
    const { prisma } = await import('./prismaService.js')

    // Find the post by cacheKey and postId
    const post = await prisma.newsCache.findFirst({
      where: {
        cacheKey,
        postId
      }
    })

    if (!post) {
      throw new Error('Post not found')
    }

    // Update the post
    const updated = await prisma.newsCache.update({
      where: { id: post.id },
      data
    })

    return { success: true, data: updated }
  } catch (error) {
    console.error('Error updating news cache post:', error)
    throw error
  }
}

/**
 * Delete a post from news-cache
 */
export const deleteNewsCachePost = async (cacheKey, postId) => {
  try {
    const { prisma } = await import('./prismaService.js')

    // Find and delete the post
    const deleted = await prisma.newsCache.deleteMany({
      where: {
        cacheKey,
        postId
      }
    })

    if (deleted.count === 0) {
      throw new Error('Post not found')
    }

    return { success: true, message: 'Post deleted successfully' }
  } catch (error) {
    console.error('Error deleting news cache post:', error)
    throw error
  }
}

export default {
  getAllUsers,
  searchUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserDictionary,
  addDictionaryEntry,
  updateDictionaryEntry,
  deleteDictionaryEntry,
  getUserFlashcards,
  updateFlashcard,
  deleteFlashcard,
  getUserSavedPosts,
  deleteSavedPost,
  getUserCollections,
  updateCollection,
  deleteCollection,
  getUserSocialConnections,
  getAllDictionaryEntries,
  getAllNewsCachePosts,
  updateNewsCachePost,
  deleteNewsCachePost
}
