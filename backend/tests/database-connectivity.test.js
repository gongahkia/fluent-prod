/**
 * Database Connectivity Test
 * Tests basic Prisma connection and table existence
 */

import { prisma } from '../services/prismaService.js';

async function testDatabaseConnection() {
  console.log('\n🔍 Starting Database Connectivity Tests...\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Can we connect?
    console.log('\n[Test 1] Testing Prisma database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test 2: Can we query?
    console.log('\n[Test 2] Testing database query capability...');
    const userCount = await prisma.user.count();
    console.log(`✅ Database query successful (${userCount} users exist)`);

    // Test 3: Check all tables exist
    console.log('\n[Test 3] Verifying all tables exist...');
    const tables = [
      { name: 'user', display: 'users' },
      { name: 'userSettings', display: 'user_settings' },
      { name: 'encryptedCredentials', display: 'encrypted_credentials' },
      { name: 'dictionaryWord', display: 'dictionary_words' },
      { name: 'flashcard', display: 'flashcards' },
      { name: 'savedPost', display: 'saved_posts' },
      { name: 'collection', display: 'collections' },
      { name: 'collectionWord', display: 'collection_words' },
      { name: 'userFollow', display: 'user_follows' },
      { name: 'userBlock', display: 'user_blocks' },
      { name: 'newsCache', display: 'news_cache' }
    ];

    let allTablesExist = true;
    for (const table of tables) {
      try {
        const count = await prisma[table.name].count();
        console.log(`   ✅ Table '${table.display}' exists (${count} records)`);
      } catch (error) {
        console.log(`   ❌ Table '${table.display}' NOT FOUND or ERROR: ${error.message}`);
        allTablesExist = false;
      }
    }

    // Test 4: Check Prisma client generation
    console.log('\n[Test 4] Verifying Prisma client...');
    if (prisma.$connect && prisma.user && prisma.dictionaryWord) {
      console.log('✅ Prisma client properly generated with all models');
    } else {
      console.log('❌ Prisma client missing some models');
      allTablesExist = false;
    }

    await prisma.$disconnect();

    console.log('\n' + '=' .repeat(60));
    if (allTablesExist) {
      console.log('\n🎉 ALL DATABASE CONNECTIVITY TESTS PASSED!\n');
      console.log('Your database is properly configured and ready for use.');
      process.exit(0);
    } else {
      console.log('\n⚠️  SOME TESTS FAILED\n');
      console.log('Please check the errors above and verify your database schema.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Database test failed with error:\n');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testDatabaseConnection();
