/**
 * Prisma Service Integration Test
 * Tests all CRUD operations through the Prisma service
 */

import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  addWordToDictionary,
  getUserDictionary,
  removeWordFromDictionary,
  createCollection,
  getCollections,
  addWordToCollection,
  followUser,
  getUserFollowers,
  getUserFollowing,
  savePost,
  getSavedPosts,
  saveFlashcardProgress,
  getFlashcardProgress
} from '../services/prismaService.js';

async function runPrismaTests() {
  console.log('\n🧪 Starting Prisma Service Integration Tests...\n');
  console.log('=' .repeat(60));

  const testUserId = `test-user-${Date.now()}`;
  const testUserId2 = `test-user-2-${Date.now()}`;
  let createdWordId = null;
  let createdCollectionId = null;

  try {
    // Test 1: Create user profile
    console.log('\n[Test 1] Creating user profile...');
    const createResult = await createUserProfile(testUserId, {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      bio: 'Testing Prisma service',
      targetLanguage: 'Japanese',
      nativeLanguages: ['English'],
      level: 3,
      onboardingCompleted: true,
      settings: {
        notifications: { email: true, push: false, comments: true },
        privacy: { profileVisibility: 'public' },
        appearance: { theme: 'dark', accentColor: 'blue' },
        goals: { dailyWords: 20, dailyReading: 10 }
      }
    });

    if (createResult.success) {
      console.log('✅ User created successfully');
      console.log(`   User ID: ${testUserId}`);
    } else {
      throw new Error(`Failed to create user: ${createResult.error}`);
    }

    // Test 2: Get user profile
    console.log('\n[Test 2] Getting user profile...');
    const getResult = await getUserProfile(testUserId);
    if (getResult.success && getResult.data.email) {
      console.log('✅ Profile retrieved successfully');
      console.log(`   Name: ${getResult.data.name}`);
      console.log(`   Email: ${getResult.data.email}`);
      console.log(`   Target Language: ${getResult.data.targetLanguage}`);
    } else {
      throw new Error(`Failed to get user: ${getResult.error}`);
    }

    // Test 3: Update user profile
    console.log('\n[Test 3] Updating user profile...');
    const updateResult = await updateUserProfile(testUserId, {
      bio: 'Updated bio text',
      level: 4
    });
    if (updateResult.success) {
      console.log('✅ Profile updated successfully');
    } else {
      throw new Error(`Failed to update user: ${updateResult.error}`);
    }

    // Test 4: Add word to dictionary
    console.log('\n[Test 4] Adding word to dictionary...');
    const wordResult = await addWordToDictionary(testUserId, {
      language: 'Japanese',
      word: '犬',
      japanese: '犬',
      hiragana: 'いぬ',
      romaji: 'inu',
      english: 'dog',
      meaning: 'A domesticated animal',
      partOfSpeech: 'noun',
      level: 1,
      jlptLevel: 'N5'
    });

    if (wordResult.success) {
      createdWordId = wordResult.data.id;
      console.log('✅ Word added successfully');
      console.log(`   Word: ${wordResult.data.japanese} (${wordResult.data.romaji})`);
      console.log(`   English: ${wordResult.data.english}`);
    } else {
      throw new Error(`Failed to add word: ${wordResult.error}`);
    }

    // Test 5: Get dictionary
    console.log('\n[Test 5] Getting user dictionary...');
    const dictResult = await getUserDictionary(testUserId);
    if (dictResult.success) {
      console.log(`✅ Dictionary retrieved (${dictResult.data.length} words)`);
    } else {
      throw new Error(`Failed to get dictionary: ${dictResult.error}`);
    }

    // Test 6: Create collection
    console.log('\n[Test 6] Creating collection...');
    const collResult = await createCollection(testUserId, {
      name: 'JLPT N5 Vocabulary',
      description: 'Basic Japanese words for beginners',
      isDefault: false
    });

    if (collResult.success) {
      createdCollectionId = collResult.data.id;
      console.log('✅ Collection created successfully');
      console.log(`   Name: ${collResult.data.name}`);
    } else {
      throw new Error(`Failed to create collection: ${collResult.error}`);
    }

    // Test 7: Add word to collection
    console.log('\n[Test 7] Adding word to collection...');
    const addToCollResult = await addWordToCollection(testUserId, createdCollectionId, createdWordId);
    if (addToCollResult.success) {
      console.log('✅ Word added to collection successfully');
    } else {
      throw new Error(`Failed to add word to collection: ${addToCollResult.error}`);
    }

    // Test 8: Get collections
    console.log('\n[Test 8] Getting all collections...');
    const getCollResult = await getCollections(testUserId);
    if (getCollResult.success) {
      console.log(`✅ Collections retrieved (${getCollResult.data.length} collections)`);
      if (getCollResult.data.length > 0) {
        console.log(`   First collection has ${getCollResult.data[0].collectionWords?.length || 0} words`);
      }
    } else {
      throw new Error(`Failed to get collections: ${getCollResult.error}`);
    }

    // Test 9: Save flashcard progress
    console.log('\n[Test 9] Saving flashcard progress...');
    const flashcardResult = await saveFlashcardProgress(testUserId, createdWordId, {
      interval: 3,
      repetitions: 2,
      easeFactor: 2.6,
      lastReviewed: new Date(),
      nextReview: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      correctCount: 5,
      incorrectCount: 1
    });

    if (flashcardResult.success) {
      console.log('✅ Flashcard progress saved successfully');
    } else {
      throw new Error(`Failed to save flashcard: ${flashcardResult.error}`);
    }

    // Test 10: Get flashcard progress
    console.log('\n[Test 10] Getting flashcard progress...');
    const getFlashResult = await getFlashcardProgress(testUserId);
    if (getFlashResult.success) {
      console.log(`✅ Flashcard progress retrieved (${getFlashResult.data.length} flashcards)`);
    } else {
      throw new Error(`Failed to get flashcards: ${getFlashResult.error}`);
    }

    // Test 11: Save post
    console.log('\n[Test 11] Saving post...');
    const postResult = await savePost(testUserId, {
      postId: `test_post_${Date.now()}`,
      title: 'Test Post Title',
      content: 'これはテストの投稿です。This is a test post.',
      url: 'https://reddit.com/r/LearnJapanese/test',
      author: 'test_author',
      publishedAt: new Date(),
      source: 'reddit',
      tags: ['test', 'japanese', 'learning'],
      difficulty: 2
    });

    if (postResult.success) {
      console.log('✅ Post saved successfully');
      console.log(`   Title: ${postResult.data.title}`);
    } else {
      throw new Error(`Failed to save post: ${postResult.error}`);
    }

    // Test 12: Get saved posts
    console.log('\n[Test 12] Getting saved posts...');
    const getSavedResult = await getSavedPosts(testUserId);
    if (getSavedResult.success) {
      console.log(`✅ Saved posts retrieved (${getSavedResult.data.length} posts)`);
    } else {
      throw new Error(`Failed to get saved posts: ${getSavedResult.error}`);
    }

    // Test 13: Create second user for social features
    console.log('\n[Test 13] Creating second user for social tests...');
    const user2Result = await createUserProfile(testUserId2, {
      email: `test2-${Date.now()}@example.com`,
      name: 'Test User 2',
      targetLanguage: 'Korean',
      nativeLanguages: ['English']
    });

    if (user2Result.success) {
      console.log('✅ Second user created successfully');
    } else {
      throw new Error(`Failed to create second user: ${user2Result.error}`);
    }

    // Test 14: Follow user
    console.log('\n[Test 14] Testing follow functionality...');
    const followResult = await followUser(testUserId, testUserId2);
    if (followResult.success) {
      console.log('✅ Follow successful');
    } else {
      throw new Error(`Failed to follow user: ${followResult.error}`);
    }

    // Test 15: Get followers
    console.log('\n[Test 15] Getting followers...');
    const followersResult = await getUserFollowers(testUserId2);
    if (followersResult.success) {
      console.log(`✅ Followers retrieved (${followersResult.data.length} followers)`);
    } else {
      throw new Error(`Failed to get followers: ${followersResult.error}`);
    }

    // Test 16: Get following
    console.log('\n[Test 16] Getting following list...');
    const followingResult = await getUserFollowing(testUserId);
    if (followingResult.success) {
      console.log(`✅ Following list retrieved (${followingResult.data.length} users)`);
    } else {
      throw new Error(`Failed to get following: ${followingResult.error}`);
    }

    // Test 17: Remove word from dictionary (cleanup)
    console.log('\n[Test 17] Removing word from dictionary...');
    const removeResult = await removeWordFromDictionary(testUserId, createdWordId);
    if (removeResult.success) {
      console.log('✅ Word removed successfully');
    } else {
      throw new Error(`Failed to remove word: ${removeResult.error}`);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('\n🎉 ALL PRISMA SERVICE TESTS PASSED!\n');
    console.log('Summary:');
    console.log('  - User CRUD operations: ✅');
    console.log('  - Dictionary operations: ✅');
    console.log('  - Collection operations: ✅');
    console.log('  - Flashcard operations: ✅');
    console.log('  - Saved posts operations: ✅');
    console.log('  - Social features (follow): ✅');
    console.log('\nYour Prisma service is working correctly!\n');

  } catch (error) {
    console.error('\n❌ Prisma test failed:\n');
    console.error(error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

runPrismaTests();
