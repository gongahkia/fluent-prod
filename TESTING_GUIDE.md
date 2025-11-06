# 🧪 Complete Testing Guide for Fluent Migration

## Quick Start Checklist

### Step 1: Apply RLS Policies (CRITICAL - DO THIS FIRST!)

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/yfircsqnszokomcpnewq
2. Go to: **SQL Editor** (left sidebar)
3. Click: **New Query**
4. Copy and paste the entire contents of: `backend/prisma/migrations/002_rls_and_functions_safe.sql`
5. Click: **Run** (or press Cmd+Enter)
6. You should see: "Success. No rows returned"

**Why this is critical:** Without RLS policies, your database has NO security. Users could access other users' data!

---

### Step 2: Run Backend Tests

```bash
# Test 1: Database Connectivity
cd backend
node tests/database-connectivity.test.js

# Expected output:
# ✅ Database connected successfully
# ✅ All 11 tables exist
# 🎉 ALL DATABASE CONNECTIVITY TESTS PASSED!
```

```bash
# Test 2: Prisma Service
node tests/prisma-service.test.js

# Expected output:
# ✅ User created
# ✅ Dictionary operations work
# ✅ Collections work
# ✅ Social features work
# 🎉 ALL PRISMA SERVICE TESTS PASSED!
```

```bash
# Test 3: RLS Security (ONLY after Step 1!)
node tests/rls-security.test.js

# Expected output:
# ✅ Users can only access their own data
# ✅ Cannot write data as other users
# 🔒 Your database is SECURE!
```

---

### Step 3: Run Frontend Tests

#### 3A: Add Test Routes

Add these routes to your router configuration (e.g., `src/App.jsx` or your routing file):

```javascript
import AuthTest from '@/pages/testing/AuthTest';
import DatabaseTest from '@/pages/testing/DatabaseTest';

// Add these routes:
{
  path: '/test/auth',
  element: <AuthTest />
},
{
  path: '/test/database',
  element: <DatabaseTest />
}
```

#### 3B: Start Frontend

```bash
# From project root
npm run dev

# Frontend should start at: http://localhost:5173
```

#### 3C: Test Authentication

1. Navigate to: http://localhost:5173/test/auth
2. Fill in:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Name: `Test User`
3. Click: **Test Signup**
4. Verify in Supabase Dashboard:
   - Go to: **Authentication** → **Users**
   - You should see your new user
   - Go to: **Database** → **users** table
   - You should see the user profile
   - Go to: **Database** → **user_settings** table
   - You should see the user settings
5. Click: **Test Logout**
6. Click: **Test Login** (with same credentials)
7. Should succeed!

#### 3D: Test Database Operations

1. Make sure you're logged in first (from Step 3C)
2. Navigate to: http://localhost:5173/test/database
3. Click: **Run All Tests**
4. Watch the test log - all should be ✅
5. Verify in Supabase Dashboard:
   - **Database** → **dictionary_words** (should have test word)
   - **Database** → **collections** (should have test collection)
   - **Database** → **saved_posts** (should have test post)

---

## What Each Test Does

### Backend Tests

| Test | File | Purpose |
|------|------|---------|
| **Database Connectivity** | `backend/tests/database-connectivity.test.js` | Verifies Prisma can connect and all 11 tables exist |
| **Prisma Service** | `backend/tests/prisma-service.test.js` | Tests all CRUD operations (create, read, update, delete) |
| **RLS Security** | `backend/tests/rls-security.test.js` | Verifies users can only access their own data |

### Frontend Tests

| Test | File | Purpose |
|------|------|---------|
| **Auth Test** | `src/pages/testing/AuthTest.jsx` | Tests signup, login, logout, password reset, OAuth |
| **Database Test** | `src/pages/testing/DatabaseTest.jsx` | Tests dictionary, collections, saved posts operations |

---

## Common Issues & Solutions

### Issue: "Policy already exists" error

**Solution:** Use `002_rls_and_functions_safe.sql` instead of the original file. It safely drops existing policies first.

### Issue: "Error: Missing Supabase environment variables"

**Solution:** Check that these exist in your `.env` files:

```bash
# Frontend (.env)
VITE_SUPABASE_URL=https://yfircsqnszokomcpnewq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Backend (backend/.env)
SUPABASE_URL=https://yfircsqnszokomcpnewq.supabase.co
SUPABASE_ANON_KEY=eyJ... # For RLS test
DATABASE_URL=postgresql://...
```

### Issue: Backend tests fail with "Cannot find module"

**Solution:**
```bash
cd backend
npm install
npx prisma generate
```

### Issue: "RLS SECURITY BREACH" in tests

**Solution:** You haven't applied the RLS policies yet! Go back to Step 1.

### Issue: Frontend pages show blank or 404

**Solution:** Make sure you added the routes to your router configuration (Step 3A).

### Issue: "Please login first" on Database Test page

**Solution:** Go to `/test/auth` first and login or signup.

---

## Verification Checklist

Use this to verify everything is working:

### Backend Verification
- [ ] `database-connectivity.test.js` passes (all 11 tables exist)
- [ ] `prisma-service.test.js` passes (all 17 tests pass)
- [ ] `rls-security.test.js` passes (users isolated from each other)

### Frontend Verification
- [ ] Can sign up new user
- [ ] User appears in Supabase Auth dashboard
- [ ] User profile created in database
- [ ] Can login with credentials
- [ ] Can logout
- [ ] Can add words to dictionary
- [ ] Can create collections
- [ ] Can save posts
- [ ] Data appears in Supabase database
- [ ] Other users cannot see my data (test with 2nd account)

### Supabase Dashboard Verification
- [ ] **Authentication** → Users shows test users
- [ ] **Database** → `users` table has profiles
- [ ] **Database** → `user_settings` table has settings
- [ ] **Database** → `dictionary_words` table has words
- [ ] **Database** → `collections` table has collections
- [ ] **Database** → `saved_posts` table has posts
- [ ] **SQL Editor** → Can query tables successfully

---

## Next Steps After Testing

Once all tests pass:

1. **Remove Test Data** (optional):
   ```sql
   -- In Supabase SQL Editor
   DELETE FROM users WHERE email LIKE '%test%';
   ```

2. **Integrate Test Pages into App** (optional):
   - Add links to test pages in your app's navigation
   - Or remove them for production

3. **Continue Migration**:
   - Remove legacy Firebase code
   - Update remaining components to use Supabase
   - Test real application flows

4. **Deploy**:
   - Test in production Supabase environment
   - Update environment variables for production
   - Deploy frontend and backend

---

## Support

If you encounter issues:

1. Check the browser console for errors (F12)
2. Check the terminal output for backend errors
3. Check Supabase Dashboard → Logs for database errors
4. Verify environment variables are correct
5. Make sure RLS policies are applied

---

## Summary

✅ You've created:
- 3 backend test scripts
- 2 frontend test pages
- 1 safe SQL migration script
- This comprehensive testing guide

🎯 Your testing workflow:
1. Apply RLS SQL
2. Run 3 backend tests
3. Run 2 frontend tests
4. Verify in Supabase Dashboard
5. Done!

Good luck! 🚀
