// Script to apply SQL migrations to Supabase
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from './generated/prisma/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function applyMigrations() {
  try {
    console.log('Reading SQL migration file...');
    const sqlFile = fs.readFileSync(
      path.join(__dirname, 'prisma/migrations/001_rls_and_functions.sql'),
      'utf8'
    );

    console.log('Applying RLS policies and functions to database...');

    // Execute the entire SQL file as one statement
    // This preserves function bodies with $$ delimiters
    try {
      await prisma.$executeRawUnsafe(sqlFile);
      console.log('✓ Migration completed successfully!');
    } catch (err) {
      // If batch execution fails, try to extract useful error info
      if (err.message.includes('already exists') || err.message.includes('already has a policy')) {
        console.log('⚠ Some objects already exist (this is normal)');
      } else {
        console.error('✗ Error applying migration:', err.message);
        console.log('\nTrying alternative approach: executing via psql...');

        // Try using psql command instead
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execPromise = promisify(exec);

        const dbUrl = process.env.DATABASE_URL;
        const sqlPath = path.join(__dirname, 'prisma/migrations/001_rls_and_functions.sql');

        try {
          const { stdout, stderr } = await execPromise(`psql "${dbUrl}" -f "${sqlPath}"`);
          console.log('✓ Migration applied via psql');
          if (stderr && !stderr.includes('NOTICE')) {
            console.log('Warnings:', stderr);
          }
        } catch (psqlErr) {
          console.error('✗ psql also failed:', psqlErr.message);
          console.log('\nPlease apply the migration manually via Supabase SQL Editor');
          console.log('File location:', sqlPath);
        }
      }
    }

    console.log('\nVerifying RLS policies...');

    // Verify RLS is enabled
    const result = await prisma.$queryRaw`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('users', 'dictionary_words', 'saved_posts')
      ORDER BY tablename
    `;

    console.log('RLS Status:', result);

    // Check if functions exist
    const functions = await prisma.$queryRaw`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN ('follow_user', 'unfollow_user', 'block_user')
      ORDER BY routine_name
    `;

    console.log('\nPostgreSQL Functions:', functions);

  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigrations();
