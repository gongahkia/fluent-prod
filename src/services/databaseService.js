/**
 * Database Service - Supabase Edition
 * Migrated from Firebase Firestore to Supabase PostgreSQL
 * Uses Prisma schema on backend, direct Supabase client on frontend
 */

import { supabase } from "@/lib/supabase"

// ================== USER PROFILE OPERATIONS ==================

/**
 * Create a new user profile in Supabase
 */
export const createUserProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        ...profileData,
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error creating user profile:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user profile from Supabase
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        settings:user_settings(*)
      `)
      .eq('id', userId)
      .single()

    if (error) throw error

    if (data) {
      // Transform settings to match Firebase structure
      if (data.settings) {
        const settings = data.settings
        data.settings = {
          notifications: {
            email: settings.emailNotifications,
            push: settings.pushNotifications,
            comments: settings.commentNotifications,
          },
          privacy: {
            profileVisibility: settings.profileVisibility,
            showEmail: settings.showEmail,
            showLocation: settings.showLocation,
          },
          appearance: {
            theme: settings.theme,
            accentColor: settings.accentColor,
            fontSize: settings.fontSize,
          },
          goals: {
            dailyWords: settings.dailyWords,
            dailyReading: settings.dailyReading,
            studyReminder: settings.studyReminder,
            reminderTime: settings.reminderTime,
          },
        }
      }

      return { success: true, data }
    }

    return { success: false, error: "User profile not found" }
  } catch (error) {
    console.error("Error getting user profile:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Update user profile in Supabase
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    // Separate settings from profile updates
    const { settings, ...profileUpdates } = updates

    // Update profile
    const { error: profileError } = await supabase
      .from('users')
      .update(profileUpdates)
      .eq('id', userId)

    if (profileError) throw profileError

    // Update settings if provided
    if (settings) {
      const settingsData = {
        emailNotifications: settings.notifications?.email,
        pushNotifications: settings.notifications?.push,
        commentNotifications: settings.notifications?.comments,
        profileVisibility: settings.privacy?.profileVisibility,
        showEmail: settings.privacy?.showEmail,
        showLocation: settings.privacy?.showLocation,
        theme: settings.appearance?.theme,
        accentColor: settings.appearance?.accentColor,
        fontSize: settings.appearance?.fontSize,
        dailyWords: settings.goals?.dailyWords,
        dailyReading: settings.goals?.dailyReading,
        studyReminder: settings.goals?.studyReminder,
        reminderTime: settings.goals?.reminderTime,
      }

      // Remove undefined values
      Object.keys(settingsData).forEach(key =>
        settingsData[key] === undefined && delete settingsData[key]
      )

      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          userId,
          ...settingsData,
        })

      if (settingsError) throw settingsError
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Update user API credentials (encrypted)
 */
export const updateUserCredentials = async (userId, encryptedCredentials) => {
  try {
    const { error } = await supabase
      .from('encrypted_credentials')
      .upsert({
        userId,
        encryptedData: encryptedCredentials,
      })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error updating user credentials:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user API credentials (encrypted)
 */
export const getUserCredentials = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('encrypted_credentials')
      .select('encryptedData')
      .eq('userId', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
    return { success: true, data: data?.encryptedData || null }
  } catch (error) {
    console.error("Error getting user credentials:", error)
    return { success: false, error: error.message }
  }
}

// ================== DICTIONARY OPERATIONS ==================

/**
 * Helper function to determine language code
 */
const getLanguageCode = (targetLanguage) => {
  return targetLanguage === 'Korean' ? 'Korean' : 'Japanese'
}

/**
 * Add word to user's dictionary
 */
export const addWordToDictionary = async (userId, wordData) => {
  try {
    const targetLanguage = getLanguageCode(wordData.targetLanguage || 'Japanese')

    const { data, error } = await supabase
      .from('dictionary_words')
      .insert({
        userId,
        language: targetLanguage,
        word: wordData.word || wordData.japanese || wordData.korean,
        english: wordData.english,
        japanese: wordData.japanese,
        hiragana: wordData.hiragana,
        kanji: wordData.kanji,
        romaji: wordData.romaji,
        korean: wordData.korean,
        romanization: wordData.romanization,
        pronunciation: wordData.pronunciation,
        hanja: wordData.hanja,
        meaning: wordData.meaning,
        partOfSpeech: wordData.partOfSpeech,
        level: wordData.level,
        jlptLevel: wordData.jlptLevel,
        topikLevel: wordData.topikLevel,
        examples: wordData.examples,
        example: wordData.example,
        exampleEn: wordData.exampleEn,
        source: wordData.source || 'Fluent Post',
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error adding word to dictionary:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all words from user's dictionary
 */
export const getUserDictionary = async (userId, targetLanguage = 'Japanese') => {
  try {
    const language = getLanguageCode(targetLanguage)

    const { data, error } = await supabase
      .from('dictionary_words')
      .select(`
        *,
        flashcard:flashcards(*)
      `)
      .eq('userId', userId)
      .eq('language', language)
      .order('dateAdded', { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error getting user dictionary:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Remove word from user's dictionary
 */
export const removeWordFromDictionary = async (userId, wordId, targetLanguage = 'Japanese') => {
  try {
    const { error } = await supabase
      .from('dictionary_words')
      .delete()
      .eq('id', wordId)
      .eq('userId', userId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error removing word from dictionary:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Listen to dictionary changes in real-time
 */
export const onDictionaryChange = (userId, callback, targetLanguage = 'Japanese') => {
  const language = getLanguageCode(targetLanguage)

  const channel = supabase
    .channel(`dictionary-${userId}-${language}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'dictionary_words',
        filter: `userId=eq.${userId}`,
      },
      async (payload) => {
        // Fetch all words to maintain consistency
        const result = await getUserDictionary(userId, targetLanguage)
        if (result.success) {
          callback(result.data)
        }
      }
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Get all dictionaries for a user (both Japanese and Korean)
 */
export const getAllUserDictionaries = async (userId) => {
  try {
    const [jaResult, koResult] = await Promise.all([
      getUserDictionary(userId, 'Japanese'),
      getUserDictionary(userId, 'Korean'),
    ])

    return {
      success: true,
      data: {
        japanese: jaResult.success ? jaResult.data : [],
        korean: koResult.success ? koResult.data : [],
      },
    }
  } catch (error) {
    console.error("Error getting all user dictionaries:", error)
    return { success: false, error: error.message }
  }
}

// ================== FLASHCARD OPERATIONS ==================

/**
 * Save flashcard progress
 */
export const saveFlashcardProgress = async (userId, wordId, progressData) => {
  try {
    const { data, error } = await supabase
      .from('flashcards')
      .upsert({
        userId,
        wordId,
        interval: progressData.interval || 1,
        repetitions: progressData.repetitions || 0,
        easeFactor: progressData.easeFactor || 2.5,
        lastReviewed: progressData.lastReviewed || null,
        nextReview: progressData.nextReview || null,
        correctCount: progressData.correctCount || 0,
        incorrectCount: progressData.incorrectCount || 0,
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error saving flashcard progress:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all flashcard progress data
 */
export const getFlashcardProgress = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('flashcards')
      .select(`
        *,
        word:dictionary_words(*)
      `)
      .eq('userId', userId)

    if (error) throw error

    // Convert to object format for compatibility
    const progress = {}
    data?.forEach((flashcard) => {
      progress[flashcard.wordId] = flashcard
    })

    return { success: true, data: progress }
  } catch (error) {
    console.error("Error getting flashcard progress:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Batch update flashcard progress
 */
export const batchUpdateFlashcards = async (userId, updates) => {
  try {
    const upsertData = Object.entries(updates).map(([wordId, progressData]) => ({
      userId,
      wordId,
      ...progressData,
    }))

    const { error } = await supabase
      .from('flashcards')
      .upsert(upsertData)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error batch updating flashcards:", error)
    return { success: false, error: error.message }
  }
}

// ================== SAVED POSTS OPERATIONS ==================

/**
 * Save a post
 */
export const savePost = async (userId, postData) => {
  try {
    const { data, error } = await supabase
      .from('saved_posts')
      .insert({
        userId,
        postId: postData.id,
        title: postData.title,
        content: postData.content,
        url: postData.url,
        author: postData.author,
        publishedAt: postData.publishedAt,
        source: postData.source || 'reddit',
        tags: postData.tags || [],
        difficulty: postData.difficulty,
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error saving post:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all saved posts
 */
export const getSavedPosts = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('saved_posts')
      .select('*')
      .eq('userId', userId)
      .order('savedAt', { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error getting saved posts:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Remove a saved post
 */
export const removeSavedPost = async (userId, postId) => {
  try {
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .eq('userId', userId)
      .eq('postId', postId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error removing saved post:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Listen to saved posts changes in real-time
 */
export const onSavedPostsChange = (userId, callback) => {
  const channel = supabase
    .channel(`saved-posts-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'saved_posts',
        filter: `userId=eq.${userId}`,
      },
      async () => {
        const result = await getSavedPosts(userId)
        if (result.success) {
          callback(result.data)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// ================== FLASHCARD COLLECTIONS OPERATIONS ==================

/**
 * Create a new flashcard collection
 */
export const createCollection = async (userId, collectionData) => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .insert({
        userId,
        name: collectionData.name,
        description: collectionData.description || '',
        isDefault: collectionData.isDefault || false,
      })
      .select()
      .single()

    if (error) throw error

    // Add words to collection if provided
    if (collectionData.wordIds && collectionData.wordIds.length > 0) {
      const collectionWords = collectionData.wordIds.map(wordId => ({
        collectionId: data.id,
        wordId,
      }))

      const { error: wordsError } = await supabase
        .from('collection_words')
        .insert(collectionWords)

      if (wordsError) console.error('Error adding words to collection:', wordsError)
    }

    return { success: true, id: data.id, data }
  } catch (error) {
    console.error("Error creating collection:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all collections for a user
 */
export const getCollections = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        collectionWords:collection_words(
          wordId,
          word:dictionary_words(*)
        )
      `)
      .eq('userId', userId)
      .order('createdAt', { ascending: false })

    if (error) throw error

    // Transform to include wordIds array for compatibility
    const collections = data?.map(collection => ({
      ...collection,
      wordIds: collection.collectionWords?.map(cw => cw.wordId) || [],
    })) || []

    return { success: true, data: collections }
  } catch (error) {
    console.error("Error getting collections:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get a single collection
 */
export const getCollection = async (userId, collectionId) => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        collectionWords:collection_words(
          wordId,
          word:dictionary_words(*)
        )
      `)
      .eq('id', collectionId)
      .eq('userId', userId)
      .single()

    if (error) throw error

    // Transform to include wordIds array
    data.wordIds = data.collectionWords?.map(cw => cw.wordId) || []

    return { success: true, data }
  } catch (error) {
    console.error("Error getting collection:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Update a collection
 */
export const updateCollection = async (userId, collectionId, updates) => {
  try {
    const { error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', collectionId)
      .eq('userId', userId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error updating collection:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a collection
 */
export const deleteCollection = async (userId, collectionId) => {
  try {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId)
      .eq('userId', userId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error deleting collection:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Add word to collection
 */
export const addWordToCollection = async (userId, collectionId, wordId) => {
  try {
    // Verify user owns the collection
    const { data: collection, error: collError } = await supabase
      .from('collections')
      .select('id')
      .eq('id', collectionId)
      .eq('userId', userId)
      .single()

    if (collError) throw collError

    // Add word to collection
    const { error } = await supabase
      .from('collection_words')
      .insert({
        collectionId,
        wordId,
      })

    if (error) {
      // Check for duplicate
      if (error.code === '23505') {
        return { success: true, message: "Word already in collection" }
      }
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("Error adding word to collection:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Remove word from collection
 */
export const removeWordFromCollection = async (userId, collectionId, wordId) => {
  try {
    // Verify user owns the collection
    const { data: collection, error: collError } = await supabase
      .from('collections')
      .select('id')
      .eq('id', collectionId)
      .eq('userId', userId)
      .single()

    if (collError) throw collError

    const { error } = await supabase
      .from('collection_words')
      .delete()
      .eq('collectionId', collectionId)
      .eq('wordId', wordId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error removing word from collection:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Listen to collections changes in real-time
 */
export const onCollectionsChange = (userId, callback, errorCallback) => {
  const channel = supabase
    .channel(`collections-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'collections',
        filter: `userId=eq.${userId}`,
      },
      async () => {
        const result = await getCollections(userId)
        if (result.success) {
          callback(result.data)
        } else if (errorCallback) {
          errorCallback(result.error)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Get or create the default "Learning" collection
 */
export const getOrCreateLearningCollection = async (userId) => {
  try {
    // Check if Learning collection exists
    const { data: existing, error: queryError } = await supabase
      .from('collections')
      .select('*')
      .eq('userId', userId)
      .eq('isDefault', true)
      .single()

    if (existing) {
      return { success: true, data: existing }
    }

    // Create new Learning collection
    const dictionaryResult = await getUserDictionary(userId)
    const wordIds = dictionaryResult.success
      ? dictionaryResult.data.map(word => word.id)
      : []

    const result = await createCollection(userId, {
      name: "Learning",
      description: "Customised by Fluent",
      isDefault: true,
      wordIds,
    })

    return result
  } catch (error) {
    console.error("Error getting or creating Learning collection:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Sync Learning collection with dictionary
 */
export const syncLearningCollection = async (userId) => {
  try {
    // Get Learning collection
    const { data: learningCollection, error: collError } = await supabase
      .from('collections')
      .select(`
        id,
        collectionWords:collection_words(wordId)
      `)
      .eq('userId', userId)
      .eq('isDefault', true)
      .single()

    if (collError) {
      // Create if doesn't exist
      await getOrCreateLearningCollection(userId)
      return { success: true, message: "Learning collection created and synced" }
    }

    const currentWordIds = learningCollection.collectionWords?.map(cw => cw.wordId) || []

    // Get all dictionary words
    const dictionaryResult = await getUserDictionary(userId)
    if (!dictionaryResult.success) {
      return { success: false, error: "Failed to get dictionary" }
    }

    const allWordIds = dictionaryResult.data.map(word => word.id)
    const newWordIds = allWordIds.filter(id => !currentWordIds.includes(id))

    if (newWordIds.length > 0) {
      const newWords = newWordIds.map(wordId => ({
        collectionId: learningCollection.id,
        wordId,
      }))

      const { error } = await supabase
        .from('collection_words')
        .insert(newWords)

      if (error) throw error

      return {
        success: true,
        message: `Added ${newWordIds.length} new words to Learning collection`,
      }
    }

    return { success: true, message: "Learning collection already up to date" }
  } catch (error) {
    console.error("Error syncing Learning collection:", error)
    return { success: false, error: error.message }
  }
}

// ================== FOLLOWERS/FOLLOWING OPERATIONS ==================

/**
 * Follow a user using PostgreSQL function
 */
export const followUser = async (currentUserId, targetUserId) => {
  try {
    if (currentUserId === targetUserId) {
      return { success: false, error: "Cannot follow yourself" }
    }

    const { error } = await supabase.rpc('follow_user', {
      follower_id: currentUserId,
      following_id: targetUserId,
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error following user:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Unfollow a user using PostgreSQL function
 */
export const unfollowUser = async (currentUserId, targetUserId) => {
  try {
    const { error } = await supabase.rpc('unfollow_user', {
      follower_id: currentUserId,
      following_id: targetUserId,
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error unfollowing user:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if current user is following target user
 */
export const isFollowing = async (currentUserId, targetUserId) => {
  try {
    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('followerId', currentUserId)
      .eq('followingId', targetUserId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return { success: true, isFollowing: !!data }
  } catch (error) {
    console.error("Error checking follow status:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user's followers list with profile data
 */
export const getUserFollowers = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        followedAt,
        follower:users!user_follows_followerId_fkey(
          id,
          name,
          email,
          profilePictureUrl,
          targetLanguage,
          level
        )
      `)
      .eq('followingId', userId)
      .order('followedAt', { ascending: false })

    if (error) throw error

    const followers = data?.map(item => ({
      userId: item.follower.id,
      ...item.follower,
      followedAt: item.followedAt,
    })) || []

    return { success: true, data: followers }
  } catch (error) {
    console.error("Error getting followers:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user's following list with profile data
 */
export const getUserFollowing = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        followedAt,
        following:users!user_follows_followingId_fkey(
          id,
          name,
          email,
          profilePictureUrl,
          targetLanguage,
          level
        )
      `)
      .eq('followerId', userId)
      .order('followedAt', { ascending: false })

    if (error) throw error

    const following = data?.map(item => ({
      userId: item.following.id,
      ...item.following,
      followedAt: item.followedAt,
    })) || []

    return { success: true, data: following }
  } catch (error) {
    console.error("Error getting following:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Remove a follower
 */
export const removeFollower = async (currentUserId, followerUserId) => {
  try {
    // This is the same as unfollowing from the follower's perspective
    const { error } = await supabase.rpc('unfollow_user', {
      follower_id: followerUserId,
      following_id: currentUserId,
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error removing follower:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Search users by name or email
 */
export const searchUsers = async (searchQuery, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, profilePictureUrl, targetLanguage, level, followersCount')
      .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      .limit(limit)

    if (error) throw error

    const users = data?.map(user => ({
      userId: user.id,
      ...user,
    })) || []

    return { success: true, data: users }
  } catch (error) {
    console.error("Error searching users:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Block a user using PostgreSQL function
 */
export const blockUser = async (currentUserId, targetUserId) => {
  try {
    const { error } = await supabase.rpc('block_user', {
      blocker_id: currentUserId,
      blocked_id: targetUserId,
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error blocking user:", error)
    return { success: false, error: error.message }
  }
}

// ================== MIGRATION UTILITIES ==================

/**
 * Migrate localStorage flashcard data to Supabase
 */
export const migrateFlashcardData = async (userId) => {
  try {
    const localData = localStorage.getItem("flashcardData")
    if (!localData) {
      return { success: true, message: "No local data to migrate" }
    }

    const flashcardData = JSON.parse(localData)
    await batchUpdateFlashcards(userId, flashcardData)

    // Clear localStorage after successful migration
    localStorage.removeItem("flashcardData")

    return { success: true, message: "Flashcard data migrated successfully" }
  } catch (error) {
    console.error("Error migrating flashcard data:", error)
    return { success: false, error: error.message }
  }
}
