#!/bin/bash

# Fluent Database Testing Script
# Run all backend tests in sequence

echo "═══════════════════════════════════════════════════════════════"
echo "🧪 Fluent Database Testing Suite"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Change to backend directory
cd backend || exit

# Test 1: Database Connectivity
echo "📊 Running Test 1: Database Connectivity"
echo "───────────────────────────────────────────────────────────────"
node tests/database-connectivity.test.js
TEST1_EXIT=$?

if [ $TEST1_EXIT -ne 0 ]; then
    echo ""
    echo "❌ Test 1 FAILED. Please fix database connectivity issues."
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test 2: Prisma Service
echo "🔧 Running Test 2: Prisma Service Integration"
echo "───────────────────────────────────────────────────────────────"
node tests/prisma-service.test.js
TEST2_EXIT=$?

if [ $TEST2_EXIT -ne 0 ]; then
    echo ""
    echo "❌ Test 2 FAILED. Please check Prisma service errors."
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test 3: RLS Security
echo "🔒 Running Test 3: RLS Security"
echo "───────────────────────────────────────────────────────────────"
echo "⚠️  WARNING: This test requires RLS policies to be applied first!"
echo "If you haven't run the SQL migration yet, press Ctrl+C to cancel."
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

node tests/rls-security.test.js
TEST3_EXIT=$?

if [ $TEST3_EXIT -ne 0 ]; then
    echo ""
    echo "❌ Test 3 FAILED. Please apply RLS policies:"
    echo "   1. Go to Supabase Dashboard → SQL Editor"
    echo "   2. Run: backend/prisma/migrations/002_rls_and_functions_safe.sql"
    echo "   3. Then run this script again"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🎉 🎉 🎉  ALL TESTS PASSED!  🎉 🎉 🎉"
echo ""
echo "Your Supabase + Prisma setup is working correctly!"
echo ""
echo "Next steps:"
echo "  1. Test frontend auth: http://localhost:5173/test/auth"
echo "  2. Test frontend database: http://localhost:5173/test/database"
echo "  3. Read NEXT_STEPS.md for complete guide"
echo ""
echo "═══════════════════════════════════════════════════════════════"
