/**
 * Prisma Database Service
 * Replaces Firebase Firestore with PostgreSQL via Prisma ORM
 * Provides all CRUD operations for the Fluent application
 */

import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// ==================== USER PROFILE OPERATIONS ====================

/**
 * Create a new user profile
 */
export async function createUserProfile(userId, profileData) {
  try {
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: profileData.email,
        name: profileData.name,
        bio: profileData.bio || null,
        location: profileData.location || null,
        website: profileData.website || null,
        profilePictureUrl: profileData.profilePictureUrl || null,
        bannerImage: profileData.bannerImage || null,
        targetLanguage: profileData.targetLanguage || null,
        nativeLanguages: profileData.nativeLanguages || [],
        level: profileData.level || null,
        onboardingCompleted: profileData.onboardingCompleted || false,
        completedAt: profileData.completedAt || null,
        // Create default settings
        settings: {
          create: {
            emailNotifications: profileData.settings?.notifications?.email ?? true,
            pushNotifications: profileData.settings?.notifications?.push ?? true,
            commentNotifications: profileData.settings?.notifications?.comments ?? true,
            profileVisibility: profileData.settings?.privacy?.profileVisibility || 'public',
            showEmail: profileData.settings?.privacy?.showEmail ?? false,
            showLocation: profileData.settings?.privacy?.showLocation ?? true,
            theme: profileData.settings?.appearance?.theme || 'light',
            accentColor: profileData.settings?.appearance?.accentColor || 'orange',
            fontSize: profileData.settings?.appearance?.fontSize || 'medium',
            dailyWords: profileData.settings?.goals?.dailyWords || 10,
            dailyReading: profileData.settings?.goals?.dailyReading || 5,
            studyReminder: profileData.settings?.goals?.studyReminder ?? true,
            reminderTime: profileData.settings?.goals?.reminderTime || '18:00',
          },
        },
      },
      include: {
        settings: true,
      },
    });

    return { success: true, data: user };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        settings: true,
        encryptedCreds: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Transform to match Firebase structure
    const userData = {
      ...user,
      settings: user.settings ? {
        notifications: {
          email: user.settings.emailNotifications,
          push: user.settings.pushNotifications,
          comments: user.settings.commentNotifications,
        },
        privacy: {
          profileVisibility: user.settings.profileVisibility,
          showEmail: user.settings.showEmail,
          showLocation: user.settings.showLocation,
        },
        appearance: {
          theme: user.settings.theme,
          accentColor: user.settings.accentColor,
          fontSize: user.settings.fontSize,
        },
        goals: {
          dailyWords: user.settings.dailyWords,
          dailyReading: user.settings.dailyReading,
          studyReminder: user.settings.studyReminder,
          reminderTime: user.settings.reminderTime,
        },
      } : null,
    };

    return { success: true, data: userData };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updates) {
  try {
    // Separate settings from profile updates
    const { settings, ...profileUpdates } = updates;

    const user = await prisma.user.update({
      where: { id: userId },
      data: profileUpdates,
      include: {
        settings: true,
      },
    });

    // Update settings if provided
    if (settings) {
      await prisma.userSettings.update({
        where: { userId },
        data: {
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
        },
      });
    }

    return { success: true, data: user };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete user profile and all related data
 */
export async function deleteUserProfile(userId) {
  try {
    // Prisma will handle cascading deletes based on schema
    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update encrypted credentials
 */
export async function updateUserCredentials(userId, encryptedData) {
  try {
    await prisma.encryptedCredentials.upsert({
      where: { userId },
      create: {
        userId,
        encryptedData,
      },
      update: {
        encryptedData,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating credentials:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get encrypted credentials
 */
export async function getUserCredentials(userId) {
  try {
    const creds = await prisma.encryptedCredentials.findUnique({
      where: { userId },
    });

    if (!creds) {
      return { success: true, data: null };
    }

    return { success: true, data: creds.encryptedData };
  } catch (error) {
    console.error('Error getting credentials:', error);
    return { success: false, error: error.message };
  }
}

// ==================== DICTIONARY OPERATIONS ====================

/**
 * Add word to dictionary
 */
export async function addWordToDictionary(userId, wordData) {
  try {
    const word = await prisma.dictionaryWord.create({
      data: {
        userId,
        language: wordData.targetLanguage || wordData.language,
        word: wordData.word || wordData.japanese || wordData.korean,
        english: wordData.english,
        // Japanese fields
        japanese: wordData.japanese,
        hiragana: wordData.hiragana,
        kanji: wordData.kanji,
        romaji: wordData.romaji,
        // Korean fields
        korean: wordData.korean,
        romanization: wordData.romanization,
        pronunciation: wordData.pronunciation,
        hanja: wordData.hanja,
        // Common fields
        meaning: wordData.meaning,
        partOfSpeech: wordData.partOfSpeech,
        level: wordData.level,
        jlptLevel: wordData.jlptLevel,
        topikLevel: wordData.topikLevel,
        examples: wordData.examples || null,
        example: wordData.example,
        exampleEn: wordData.exampleEn,
        source: wordData.source || 'Fluent Post',
      },
    });

    return { success: true, data: word };
  } catch (error) {
    console.error('Error adding word to dictionary:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user dictionary (optionally filtered by language)
 */
export async function getUserDictionary(userId, language = null) {
  try {
    const where = { userId };
    if (language) {
      where.language = language;
    }

    const words = await prisma.dictionaryWord.findMany({
      where,
      orderBy: { dateAdded: 'desc' },
      include: {
        flashcard: true,
      },
    });

    return { success: true, data: words };
  } catch (error) {
    console.error('Error getting dictionary:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove word from dictionary
 */
export async function removeWordFromDictionary(userId, wordId) {
  try {
    await prisma.dictionaryWord.delete({
      where: {
        id: wordId,
        userId, // Ensure user owns the word
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing word:', error);
    return { success: false, error: error.message };
  }
}

// ==================== FLASHCARD OPERATIONS ====================

/**
 * Save flashcard progress
 */
export async function saveFlashcardProgress(userId, wordId, progressData) {
  try {
    const flashcard = await prisma.flashcard.upsert({
      where: { wordId },
      create: {
        userId,
        wordId,
        interval: progressData.interval || 1,
        repetitions: progressData.repetitions || 0,
        easeFactor: progressData.easeFactor || 2.5,
        lastReviewed: progressData.lastReviewed ? new Date(progressData.lastReviewed) : null,
        nextReview: progressData.nextReview ? new Date(progressData.nextReview) : null,
        correctCount: progressData.correctCount || 0,
        incorrectCount: progressData.incorrectCount || 0,
      },
      update: {
        interval: progressData.interval,
        repetitions: progressData.repetitions,
        easeFactor: progressData.easeFactor,
        lastReviewed: progressData.lastReviewed ? new Date(progressData.lastReviewed) : undefined,
        nextReview: progressData.nextReview ? new Date(progressData.nextReview) : undefined,
        correctCount: progressData.correctCount,
        incorrectCount: progressData.incorrectCount,
      },
    });

    return { success: true, data: flashcard };
  } catch (error) {
    console.error('Error saving flashcard progress:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all flashcards for a user
 */
export async function getFlashcardProgress(userId) {
  try {
    const flashcards = await prisma.flashcard.findMany({
      where: { userId },
      include: {
        word: true,
      },
    });

    return { success: true, data: flashcards };
  } catch (error) {
    console.error('Error getting flashcards:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Batch update flashcards
 */
export async function batchUpdateFlashcards(userId, updates) {
  try {
    const promises = Object.entries(updates).map(([wordId, progressData]) =>
      saveFlashcardProgress(userId, wordId, progressData)
    );

    await Promise.all(promises);

    return { success: true };
  } catch (error) {
    console.error('Error batch updating flashcards:', error);
    return { success: false, error: error.message };
  }
}

// ==================== SAVED POSTS OPERATIONS ====================

/**
 * Save a post
 */
export async function savePost(userId, postData) {
  try {
    const savedPost = await prisma.savedPost.create({
      data: {
        userId,
        postId: postData.id || postData.postId,
        title: postData.title,
        content: postData.content,
        url: postData.url,
        author: postData.author,
        publishedAt: new Date(postData.publishedAt),
        source: postData.source || 'reddit',
        tags: postData.tags || [],
        difficulty: postData.difficulty,
      },
    });

    return { success: true, data: savedPost };
  } catch (error) {
    console.error('Error saving post:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get saved posts
 */
export async function getSavedPosts(userId) {
  try {
    const posts = await prisma.savedPost.findMany({
      where: { userId },
      orderBy: { savedAt: 'desc' },
    });

    return { success: true, data: posts };
  } catch (error) {
    console.error('Error getting saved posts:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove saved post
 */
export async function removeSavedPost(userId, postId) {
  try {
    await prisma.savedPost.deleteMany({
      where: {
        userId,
        postId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing saved post:', error);
    return { success: false, error: error.message };
  }
}

// ==================== COLLECTION OPERATIONS ====================

/**
 * Create a collection
 */
export async function createCollection(userId, collectionData) {
  try {
    const collection = await prisma.collection.create({
      data: {
        userId,
        name: collectionData.name,
        description: collectionData.description,
        isDefault: collectionData.isDefault || false,
      },
    });

    return { success: true, data: collection };
  } catch (error) {
    console.error('Error creating collection:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all collections for a user
 */
export async function getCollections(userId) {
  try {
    const collections = await prisma.collection.findMany({
      where: { userId },
      include: {
        collectionWords: {
          include: {
            word: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: collections };
  } catch (error) {
    console.error('Error getting collections:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a single collection
 */
export async function getCollection(userId, collectionId) {
  try {
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId,
      },
      include: {
        collectionWords: {
          include: {
            word: true,
          },
        },
      },
    });

    if (!collection) {
      return { success: false, error: 'Collection not found' };
    }

    return { success: true, data: collection };
  } catch (error) {
    console.error('Error getting collection:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a collection
 */
export async function updateCollection(userId, collectionId, updates) {
  try {
    const collection = await prisma.collection.update({
      where: {
        id: collectionId,
        userId,
      },
      data: updates,
    });

    return { success: true, data: collection };
  } catch (error) {
    console.error('Error updating collection:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a collection
 */
export async function deleteCollection(userId, collectionId) {
  try {
    await prisma.collection.delete({
      where: {
        id: collectionId,
        userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting collection:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add word to collection
 */
export async function addWordToCollection(userId, collectionId, wordId) {
  try {
    // Verify user owns both the collection and the word
    const [collection, word] = await Promise.all([
      prisma.collection.findFirst({ where: { id: collectionId, userId } }),
      prisma.dictionaryWord.findFirst({ where: { id: wordId, userId } }),
    ]);

    if (!collection || !word) {
      return { success: false, error: 'Collection or word not found' };
    }

    const collectionWord = await prisma.collectionWord.create({
      data: {
        collectionId,
        wordId,
      },
    });

    return { success: true, data: collectionWord };
  } catch (error) {
    // Handle unique constraint violation (word already in collection)
    if (error.code === 'P2002') {
      return { success: true, message: 'Word already in collection' };
    }
    console.error('Error adding word to collection:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove word from collection
 */
export async function removeWordFromCollection(userId, collectionId, wordId) {
  try {
    // Verify user owns the collection
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });

    if (!collection) {
      return { success: false, error: 'Collection not found' };
    }

    await prisma.collectionWord.deleteMany({
      where: {
        collectionId,
        wordId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing word from collection:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get or create the default "Learning" collection
 */
export async function getOrCreateLearningCollection(userId) {
  try {
    let collection = await prisma.collection.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    if (!collection) {
      collection = await prisma.collection.create({
        data: {
          userId,
          name: 'Learning',
          description: 'Your main learning collection',
          isDefault: true,
        },
      });
    }

    return { success: true, data: collection };
  } catch (error) {
    console.error('Error getting/creating Learning collection:', error);
    return { success: false, error: error.message };
  }
}

// ==================== SOCIAL FEATURES ====================

/**
 * Follow a user
 */
export async function followUser(followerId, followingId) {
  try {
    await prisma.$transaction(async (tx) => {
      // Create follow relationship
      await tx.userFollow.create({
        data: {
          followerId,
          followingId,
        },
      });

      // Update counts
      await tx.user.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } },
      });

      await tx.user.update({
        where: { id: followingId },
        data: { followersCount: { increment: 1 } },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Error following user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId, followingId) {
  try {
    await prisma.$transaction(async (tx) => {
      // Delete follow relationship
      await tx.userFollow.deleteMany({
        where: {
          followerId,
          followingId,
        },
      });

      // Update counts
      await tx.user.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } },
      });

      await tx.user.update({
        where: { id: followingId },
        data: { followersCount: { decrement: 1 } },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if user is following another user
 */
export async function isFollowing(followerId, followingId) {
  try {
    const follow = await prisma.userFollow.findFirst({
      where: {
        followerId,
        followingId,
      },
    });

    return { success: true, data: !!follow };
  } catch (error) {
    console.error('Error checking follow status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's followers
 */
export async function getUserFollowers(userId) {
  try {
    const followers = await prisma.userFollow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePictureUrl: true,
            targetLanguage: true,
            level: true,
          },
        },
      },
      orderBy: { followedAt: 'desc' },
    });

    const followersList = followers.map(f => ({
      userId: f.follower.id,
      ...f.follower,
      followedAt: f.followedAt,
    }));

    return { success: true, data: followersList };
  } catch (error) {
    console.error('Error getting followers:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get users that a user is following
 */
export async function getUserFollowing(userId) {
  try {
    const following = await prisma.userFollow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePictureUrl: true,
            targetLanguage: true,
            level: true,
          },
        },
      },
      orderBy: { followedAt: 'desc' },
    });

    const followingList = following.map(f => ({
      userId: f.following.id,
      ...f.following,
      followedAt: f.followedAt,
    }));

    return { success: true, data: followingList };
  } catch (error) {
    console.error('Error getting following:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Block a user
 */
export async function blockUser(blockerId, blockedId) {
  try {
    await prisma.$transaction(async (tx) => {
      // Create block relationship
      await tx.userBlock.create({
        data: {
          blockerId,
          blockedId,
        },
      });

      // Remove any existing follow relationships
      await tx.userFollow.deleteMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId },
          ],
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Error blocking user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Search users by name or email
 */
export async function searchUsers(searchQuery, limit = 20) {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { email: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePictureUrl: true,
        targetLanguage: true,
        level: true,
        followersCount: true,
      },
      take: limit,
    });

    return { success: true, data: users };
  } catch (error) {
    console.error('Error searching users:', error);
    return { success: false, error: error.message };
  }
}

// ==================== NEWS CACHE OPERATIONS ====================

/**
 * Save posts to cache
 */
export async function savePostsToCache(cacheKey, posts) {
  try {
    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete existing cache entries for this key
      await tx.newsCache.deleteMany({
        where: { cacheKey },
      });

      // Create new cache entries using individual creates to handle potential conflicts
      for (const post of posts) {
        await tx.newsCache.create({
          data: {
            cacheKey,
            postId: post.id,
            title: post.title,
            content: post.content,
            url: post.url,
            author: post.author,
            publishedAt: new Date(post.publishedAt),
            source: post.source || 'reddit',
            tags: post.tags || [],
            difficulty: post.difficulty,
            targetLang: post.targetLang,
            translatedTitle: post.translatedTitle || null,
            translatedContent: post.translatedContent || null,
            originalTitle: post.originalTitle,
            originalContent: post.originalContent,
            version: '1.0',
          },
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving posts to cache:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get posts from cache
 */
export async function getPostsFromCache(cacheKey) {
  try {
    const posts = await prisma.newsCache.findMany({
      where: { cacheKey },
      orderBy: { fetchedAt: 'desc' },
    });

    return { success: true, data: posts };
  } catch (error) {
    console.error('Error getting posts from cache:', error);
    return { success: false, error: error.message };
  }
}

// ==================== UTILITY ====================

/**
 * Close Prisma connection (call on app shutdown)
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

// Export prisma instance for advanced queries
export { prisma };
