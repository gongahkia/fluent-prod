# Database Migrations

This directory contains SQL migrations for Supabase PostgreSQL database.

## How to Apply Migrations

### 001_rls_and_functions.sql

This migration adds:
- Row Level Security (RLS) policies for all tables
- PostgreSQL functions for follow/unfollow/block operations
- Realtime subscriptions for live updates
- Performance indexes

**To apply:**

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `001_rls_and_functions.sql`
6. Paste into the SQL editor
7. Click **Run** (or press Ctrl+Enter)

**Verification:**

After running, verify it worked:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'dictionary_words', 'saved_posts');

-- Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('follow_user', 'unfollow_user', 'block_user');
```

All tables should show `rowsecurity = true` and all three functions should be listed.

## Troubleshooting

**Error: "relation already has a policy"**
- This means RLS policies already exist. You can drop them first:
  ```sql
  DROP POLICY IF EXISTS "policy_name" ON table_name;
  ```
- Then rerun the migration.

**Error: "function already exists"**
- Use `CREATE OR REPLACE FUNCTION` (already in the migration)
- Or drop the function first:
  ```sql
  DROP FUNCTION IF EXISTS follow_user;
  ```

**RLS blocking all access**
- Make sure you're authenticated as a valid user
- Check that `auth.uid()` returns your user ID:
  ```sql
  SELECT auth.uid();
  ```
- If it returns NULL, you're not authenticated

## Notes

- RLS policies are enforced automatically by PostgreSQL
- Functions run with `SECURITY DEFINER` to bypass RLS when needed
- Realtime subscriptions require policies to allow SELECT operations
- Indexes improve query performance significantly
