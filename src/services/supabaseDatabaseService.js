/**
 * Supabase Database Service (Frontend)
 * Replaces Firebase Firestore operations
 * Uses Supabase client with Row Level Security (RLS)
 */

import { supabase } from '@/lib/supabase';

// ==================== USER PROFILE OPERATIONS ====================

/**
 * Create user profile
 */
export const createUserProfile = async (userId, profileData) => {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .insert({
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
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) throw error;

    // Create default settings
    const settingsId = crypto.randomUUID();
    await supabase.from('user_settings').insert({
      id: settingsId,
      userId,
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
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        settings:user_settings(*)
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Transform settings to match Firebase structure
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
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    // Separate settings from profile updates and remove fields that don't exist in schema
    const { settings, interests, levelName, ...profileUpdates } = updates;

    // Remove undefined values and fields that don't exist in schema
    Object.keys(profileUpdates).forEach(key => {
      if (profileUpdates[key] === undefined) {
        delete profileUpdates[key];
      }
    });

    // Only update if there are fields to update
    if (Object.keys(profileUpdates).length > 0) {
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', userId)
        .maybeSingle();

      if (existingProfile) {
        // Profile exists, just update it
        const { error: profileError } = await supabase
          .from('users')
          .update(profileUpdates)
          .eq('id', userId);

        if (profileError) throw profileError;
      } else {
        // Profile doesn't exist, we need to create it with required fields
        // This can happen after email confirmation with stale session
        console.warn('Profile does not exist during update, cannot create without email. userId:', userId);
        // We can't create the profile here because we don't have the email
        // This should be handled by createUserProfile in AuthContext
        throw new Error('Profile does not exist. Please complete onboarding first.');
      }
    }

    // Update settings if provided
    if (settings) {
      const settingsUpdate = {
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
      };

      // Remove undefined values
      Object.keys(settingsUpdate).forEach(key => {
        if (settingsUpdate[key] === undefined) {
          delete settingsUpdate[key];
        }
      });

      // Use upsert for settings as well to ensure they're created if missing
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({ userId, ...settingsUpdate }, { onConflict: 'userId' })

      if (settingsError) throw settingsError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update encrypted credentials
 */
export const updateUserCredentials = async (userId, encryptedData) => {
  try {
    const { error } = await supabase
      .from('encrypted_credentials')
      .upsert({
        userId,
        encryptedData,
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating credentials:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get encrypted credentials
 */
export const getUserCredentials = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('encrypted_credentials')
      .select('encryptedData')
      .eq('userId', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" errors

    return { success: true, data: data?.encryptedData || null };
  } catch (error) {
    console.error('Error getting credentials:', error);
    return { success: false, error: error.message };
  }
};

// ==================== DICTIONARY OPERATIONS ====================

/**
 * Add word to dictionary
 */
export const addWordToDictionary = async (userId, wordData) => {
  try {
    const wordId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('dictionary_words')
      .insert({
        id: wordId,
        userId,
        language: wordData.targetLanguage || wordData.language,
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
        dateAdded: now,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error adding word to dictionary:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user dictionary
 */
export const getUserDictionary = async (userId, targetLanguage) => {
  try {
    let query = supabase
      .from('dictionary_words')
      .select('*')
      .eq('userId', userId)
      .order('dateAdded', { ascending: false });

    if (targetLanguage) {
      query = query.eq('language', targetLanguage);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting dictionary:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove word from dictionary
 */
export const removeWordFromDictionary = async (userId, wordId) => {
  try {
    const { error } = await supabase
      .from('dictionary_words')
      .delete()
      .eq('id', wordId)
      .eq('userId', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error removing word:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Listen to dictionary changes (Realtime)
 */
export const onDictionaryChange = (userId, callback, targetLanguage) => {
  const channel = supabase
    .channel(`dictionary:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'dictionary_words',
        filter: `userId=eq.${userId}${targetLanguage ? ` AND language=eq.${targetLanguage}` : ''}`,
      },
      async (payload) => {
        // Fetch updated dictionary
        const result = await getUserDictionary(userId, targetLanguage);
        if (result.success) {
          callback(result.data);
        }
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
};

// ==================== FLASHCARD OPERATIONS ====================

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
        lastReviewed: progressData.lastReviewed,
        nextReview: progressData.nextReview,
        correctCount: progressData.correctCount || 0,
        incorrectCount: progressData.incorrectCount || 0,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error saving flashcard progress:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get flashcard progress
 */
export const getFlashcardProgress = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('flashcards')
      .select(`
        *,
        word:dictionary_words(*)
      `)
      .eq('userId', userId);

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting flashcard progress:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Batch update flashcards
 */
export const batchUpdateFlashcards = async (userId, updates) => {
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
};

// ==================== SAVED POSTS OPERATIONS ====================

/**
 * Save a post
 */
export const savePost = async (userId, postData) => {
  try {
    const { data, error } = await supabase
      .from('saved_posts')
      .insert({
        userId,
        postId: postData.id || postData.postId,
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
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error saving post:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get saved posts
 */
export const getSavedPosts = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('saved_posts')
      .select('*')
      .eq('userId', userId)
      .order('savedAt', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting saved posts:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove saved post
 */
export const removeSavedPost = async (userId, postId) => {
  try {
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .eq('userId', userId)
      .eq('postId', postId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error removing saved post:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Listen to saved posts changes (Realtime)
 */
export const onSavedPostsChange = (userId, callback) => {
  const channel = supabase
    .channel(`saved_posts:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'saved_posts',
        filter: `userId=eq.${userId}`,
      },
      async (payload) => {
        // Fetch updated saved posts
        const result = await getSavedPosts(userId);
        if (result.success) {
          callback(result.data);
        }
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
};

// ==================== COLLECTION OPERATIONS ====================

/**
 * Create collection
 */
export const createCollection = async (userId, collectionData) => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .insert({
        userId,
        name: collectionData.name,
        description: collectionData.description,
        isDefault: collectionData.isDefault || false,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error creating collection:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get collections
 */
export const getCollections = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        collectionWords:collection_words(
          *,
          word:dictionary_words(*)
        )
      `)
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting collections:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update collection
 */
export const updateCollection = async (userId, collectionId, updates) => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', collectionId)
      .eq('userId', userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating collection:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete collection
 */
export const deleteCollection = async (userId, collectionId) => {
  try {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId)
      .eq('userId', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting collection:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add word to collection
 */
export const addWordToCollection = async (userId, collectionId, wordId) => {
  try {
    const { data, error } = await supabase
      .from('collection_words')
      .insert({
        collectionId,
        wordId,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    // Handle unique constraint violation
    if (error.code === '23505') {
      return { success: true, message: 'Word already in collection' };
    }
    console.error('Error adding word to collection:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove word from collection
 */
export const removeWordFromCollection = async (userId, collectionId, wordId) => {
  try {
    const { error } = await supabase
      .from('collection_words')
      .delete()
      .eq('collectionId', collectionId)
      .eq('wordId', wordId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error removing word from collection:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get or create Learning collection
 */
export const getOrCreateLearningCollection = async (userId) => {
  try {
    // Try to get existing
    let { data: collection, error } = await supabase
      .from('collections')
      .select('*')
      .eq('userId', userId)
      .eq('isDefault', true)
      .single();

    if (error && error.code === 'PGRST116') {
      // Doesn't exist, create it
      const result = await createCollection(userId, {
        name: 'Learning',
        description: 'Your main learning collection',
        isDefault: true,
      });

      if (!result.success) throw new Error(result.error);
      collection = result.data;
    } else if (error) {
      throw error;
    }

    return { success: true, data: collection };
  } catch (error) {
    console.error('Error getting/creating Learning collection:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Listen to collections changes (Realtime)
 */
export const onCollectionsChange = (userId, callback, errorCallback) => {
  const channel = supabase
    .channel(`collections:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'collections',
        filter: `userId=eq.${userId}`,
      },
      async (payload) => {
        // Fetch updated collections
        const result = await getCollections(userId);
        if (result.success) {
          callback(result.data);
        } else if (errorCallback) {
          errorCallback(result.error);
        }
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
};

// ==================== SOCIAL OPERATIONS ====================

/**
 * Follow user
 */
export const followUser = async (followerId, followingId) => {
  try {
    // Use RPC function for atomic operation
    const { error } = await supabase.rpc('follow_user', {
      follower_id: followerId,
      following_id: followingId,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error following user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Unfollow user
 */
export const unfollowUser = async (followerId, followingId) => {
  try {
    // Use RPC function for atomic operation
    const { error } = await supabase.rpc('unfollow_user', {
      follower_id: followerId,
      following_id: followingId,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if following
 */
export const isFollowing = async (followerId, followingId) => {
  try {
    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('followerId', followerId)
      .eq('followingId', followingId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, data: !!data };
  } catch (error) {
    console.error('Error checking follow status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get followers
 */
export const getUserFollowers = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        *,
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
      .order('followedAt', { ascending: false });

    if (error) throw error;

    const followers = data.map(f => ({
      userId: f.follower.id,
      ...f.follower,
      followedAt: f.followedAt,
    }));

    return { success: true, data: followers };
  } catch (error) {
    console.error('Error getting followers:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get following
 */
export const getUserFollowing = async (userId) => {
  try {
    const { data, error} = await supabase
      .from('user_follows')
      .select(`
        *,
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
      .order('followedAt', { ascending: false });

    if (error) throw error;

    const following = data.map(f => ({
      userId: f.following.id,
      ...f.following,
      followedAt: f.followedAt,
    }));

    return { success: true, data: following };
  } catch (error) {
    console.error('Error getting following:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Block user
 */
export const blockUser = async (blockerId, blockedId) => {
  try {
    // Use RPC function for atomic operation
    const { error } = await supabase.rpc('block_user', {
      blocker_id: blockerId,
      blocked_id: blockedId,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error blocking user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Search users
 */
export const searchUsers = async (searchQuery, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, profilePictureUrl, targetLanguage, level, followersCount')
      .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      .limit(limit);

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error searching users:', error);
    return { success: false, error: error.message };
  }
};

// ==================== UTILITY ====================

/**
 * Migrate flashcard data from localStorage to database
 */
export const migrateFlashcardData = async (userId) => {
  const localData = localStorage.getItem('flashcardData');
  if (!localData) {
    return { success: true, message: 'No local data to migrate' };
  }

  try {
    const flashcardData = JSON.parse(localData);
    await batchUpdateFlashcards(userId, flashcardData);
    localStorage.removeItem('flashcardData');

    return { success: true, message: 'Flashcard data migrated successfully' };
  } catch (error) {
    console.error('Error migrating flashcard data:', error);
    return { success: false, error: error.message };
  }
};
