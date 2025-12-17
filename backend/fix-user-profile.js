/**
 * Fix User Profile Script
 * Use this to fix users who exist in Supabase Auth but have corrupted/missing profiles
 * 
 * Run with: node backend/fix-user-profile.js <user-email>
 */

import { PrismaClient } from './generated/prisma/index.js'

const prisma = new PrismaClient()

async function fixUserProfile(email) {
  try {
    console.log(`\n🔍 Looking for user with email: ${email}`)

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { settings: true }
    })

    if (existingUser) {
      console.log(`✅ User found in database:`)
      console.log(`   ID: ${existingUser.id}`)
      console.log(`   Name: ${existingUser.name}`)
      console.log(`   Onboarding completed: ${existingUser.onboardingCompleted}`)
      console.log(`   Target language: ${existingUser.targetLanguage || 'Not set'}`)
      console.log(`   Level: ${existingUser.level || 'Not set'}`)
      
      // Check if profile is incomplete
      if (!existingUser.onboardingCompleted && !existingUser.level) {
        console.log(`\n⚠️  User profile is incomplete. Deleting to allow fresh onboarding...`)
        
        // Delete user settings first (FK constraint)
        if (existingUser.settings) {
          await prisma.userSettings.delete({
            where: { userId: existingUser.id }
          })
          console.log(`   ✓ Deleted user settings`)
        }
        
        // Delete user
        await prisma.user.delete({
          where: { id: existingUser.id }
        })
        
        console.log(`   ✓ Deleted user profile`)
        console.log(`\n✅ User can now sign in and complete onboarding fresh!`)
      } else {
        console.log(`\n✅ User profile looks good! No action needed.`)
      }
    } else {
      console.log(`❌ No user found with email: ${email}`)
      console.log(`   This is normal if the user exists in Auth but hasn't completed onboarding yet.`)
    }

    console.log(`\n✅ Done!`)
  } catch (error) {
    console.error(`\n❌ Error:`, error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.error('❌ Please provide a user email')
  console.log('Usage: node backend/fix-user-profile.js <user-email>')
  process.exit(1)
}

fixUserProfile(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
