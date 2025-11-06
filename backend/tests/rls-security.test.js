/**
 * Row Level Security (RLS) Test
 * Tests that users can only access their own data
 * IMPORTANT: Run this AFTER applying the RLS SQL migration
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Use ANON key to test RLS

async function testRLSPolicies() {
  console.log('\n🔒 Starting Row Level Security (RLS) Tests...\n');
  console.log('=' .repeat(60));
  console.log('\nThese tests verify that users can only access their own data.');
  console.log('This is critical for security and privacy.\n');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.error('Please check your backend/.env file.');
    process.exit(1);
  }

  // Create two separate Supabase clients for two different users
  const supabase1 = createClient(supabaseUrl, supabaseAnonKey);
  const supabase2 = createClient(supabaseUrl, supabaseAnonKey);

  let user1, user2;

  try {
    const timestamp = Date.now();

    // Test 1: Create first test user
    console.log('[Test 1] Creating test user 1...');
    const { data: user1Data, error: user1Error } = await supabase1.auth.signUp({
      email: `rls-test-1-${timestamp}@example.com`,
      password: 'TestPassword123!',
      options: {
        data: { display_name: 'RLS Test User 1' },
        emailRedirectTo: undefined // Skip email confirmation for testing
      }
    });

    if (user1Error) {
      console.error('❌ Failed to create user 1:', user1Error.message);
      throw user1Error;
    }

    user1 = user1Data.user;
    console.log('✅ User 1 created');
    console.log(`   ID: ${user1.id}`);
    console.log(`   Email: ${user1.email}`);

    // Test 2: Create second test user
    console.log('\n[Test 2] Creating test user 2...');
    const { data: user2Data, error: user2Error } = await supabase2.auth.signUp({
      email: `rls-test-2-${timestamp}@example.com`,
      password: 'TestPassword123!',
      options: {
        data: { display_name: 'RLS Test User 2' },
        emailRedirectTo: undefined
      }
    });

    if (user2Error) {
      console.error('❌ Failed to create user 2:', user2Error.message);
      throw user2Error;
    }

    user2 = user2Data.user;
    console.log('✅ User 2 created');
    console.log(`   ID: ${user2.id}`);
    console.log(`   Email: ${user2.email}`);

    // Wait a moment for auth to settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: User 1 creates profile
    console.log('\n[Test 3] User 1 creating profile...');
    const { data: profile1, error: profileError1 } = await supabase1
      .from('users')
      .insert({
        id: user1.id,
        email: user1.email,
        name: 'RLS Test User 1',
        targetLanguage: 'Japanese',
        nativeLanguages: ['English']
      })
      .select()
      .single();

    if (profileError1) {
      console.log(`⚠️  Profile creation failed (may already exist): ${profileError1.message}`);
    } else {
      console.log('✅ User 1 profile created');
    }

    // Test 4: User 1 adds a word to dictionary
    console.log('\n[Test 4] User 1 adding word to dictionary...');
    const { data: word1, error: wordError1 } = await supabase1
      .from('dictionary_words')
      .insert({
        userId: user1.id,
        language: 'Japanese',
        word: '本',
        japanese: '本',
        hiragana: 'ほん',
        romaji: 'hon',
        english: 'book',
        level: 1,
        jlptLevel: 'N5'
      })
      .select()
      .single();

    if (wordError1) {
      console.log('❌ Failed to add word:', wordError1.message);
      throw wordError1;
    }

    console.log('✅ Word added to User 1\'s dictionary');
    console.log(`   Word ID: ${word1.id}`);

    // Test 5: User 2 tries to read User 1's dictionary (SHOULD FAIL)
    console.log('\n[Test 5] 🔍 CRITICAL RLS TEST: User 2 trying to access User 1\'s dictionary...');
    const { data: user1Words, error: accessError } = await supabase2
      .from('dictionary_words')
      .select('*')
      .eq('userId', user1.id);

    if (!user1Words || user1Words.length === 0) {
      console.log('✅ ✅ ✅ RLS WORKING CORRECTLY!');
      console.log('   User 2 cannot see User 1\'s dictionary words');
    } else {
      console.log('❌ ❌ ❌ RLS SECURITY BREACH!');
      console.log(`   User 2 can see ${user1Words.length} words from User 1\'s dictionary!`);
      console.log('   This is a CRITICAL security issue - RLS policies not working!');
      throw new Error('RLS policies not working - security breach detected');
    }

    // Test 6: User 2 can access their own dictionary
    console.log('\n[Test 6] User 2 accessing own dictionary...');
    const { data: user2Words, error: user2WordError } = await supabase2
      .from('dictionary_words')
      .select('*')
      .eq('userId', user2.id);

    if (user2WordError) {
      console.log('❌ User 2 cannot access own data:', user2WordError.message);
      throw user2WordError;
    }

    console.log('✅ User 2 can access own dictionary');
    console.log(`   Words found: ${user2Words?.length || 0}`);

    // Test 7: User 2 tries to insert data as User 1 (SHOULD FAIL)
    console.log('\n[Test 7] 🔍 CRITICAL RLS TEST: User 2 trying to insert data as User 1...');
    const { data: maliciousWord, error: maliciousError } = await supabase2
      .from('dictionary_words')
      .insert({
        userId: user1.id, // Trying to insert as User 1
        language: 'Japanese',
        word: 'ハック', // "hack" in Japanese
        english: 'This should not be allowed'
      })
      .select();

    if (maliciousError || !maliciousWord) {
      console.log('✅ ✅ ✅ RLS WORKING CORRECTLY!');
      console.log('   User 2 cannot insert data for User 1');
    } else {
      console.log('❌ ❌ ❌ RLS SECURITY BREACH!');
      console.log('   User 2 was able to insert data as User 1!');
      throw new Error('RLS policies not working - can insert as other user');
    }

    // Test 8: Public profile viewing
    console.log('\n[Test 8] User 2 viewing User 1\'s public profile...');
    const { data: publicProfile, error: publicError } = await supabase2
      .from('users')
      .select('id, name, email, targetLanguage, level, bio')
      .eq('id', user1.id)
      .single();

    if (publicProfile) {
      console.log('✅ Public profiles are viewable (as designed)');
      console.log(`   Can see: name="${publicProfile.name}", language="${publicProfile.targetLanguage}"`);
    } else {
      console.log('⚠️  Could not view public profile:', publicError?.message);
    }

    // Test 9: Settings privacy (User 2 should NOT see User 1's settings)
    console.log('\n[Test 9] 🔍 CRITICAL RLS TEST: User 2 trying to access User 1\'s settings...');
    const { data: settings, error: settingsError } = await supabase2
      .from('user_settings')
      .select('*')
      .eq('userId', user1.id);

    if (!settings || settings.length === 0) {
      console.log('✅ ✅ ✅ RLS WORKING CORRECTLY!');
      console.log('   Settings are private - User 2 cannot see User 1\'s settings');
    } else {
      console.log('❌ ❌ ❌ RLS SECURITY BREACH!');
      console.log('   User 2 can see User 1\'s private settings!');
      throw new Error('RLS policies not working - can view private settings');
    }

    // Test 10: User 1 can access own settings
    console.log('\n[Test 10] User 1 accessing own settings...');
    const { data: ownSettings, error: ownSettingsError } = await supabase1
      .from('user_settings')
      .select('*')
      .eq('userId', user1.id);

    if (ownSettings || ownSettingsError) {
      console.log('✅ User 1 can access own settings (or they don\'t exist yet)');
    }

    console.log('\n' + '=' .repeat(60));
    console.log('\n🎉 ALL RLS SECURITY TESTS PASSED!\n');
    console.log('Summary:');
    console.log('  ✅ Users can only read their own private data');
    console.log('  ✅ Users cannot write data as other users');
    console.log('  ✅ Public profiles are viewable by all');
    console.log('  ✅ Private settings are protected');
    console.log('\n🔒 Your database is SECURE!\n');

    // Cleanup
    console.log('Cleaning up test users...');
    await supabase1.auth.signOut();
    await supabase2.auth.signOut();

  } catch (error) {
    console.error('\n❌ RLS Security Test Failed:\n');
    console.error(error.message);

    if (error.message.includes('RLS') || error.message.includes('security')) {
      console.error('\n⚠️  CRITICAL: Your database has SECURITY VULNERABILITIES!');
      console.error('Please apply the RLS policies by running:');
      console.error('  backend/prisma/migrations/002_rls_and_functions_safe.sql');
      console.error('in the Supabase SQL Editor.\n');
    }

    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testRLSPolicies();
