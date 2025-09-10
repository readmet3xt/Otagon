#!/bin/bash

# Script to fix user creation and RLS policies
# This fixes the 404 and 403 errors after authentication

echo "🚀 FIXING USER CREATION AND RLS POLICIES..."
echo ""
echo "This script fixes two critical issues:"
echo "  ❌ 404 errors for users table (user records not created)"
echo "  ❌ 403 errors for games table (RLS policies blocking access)"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed. Please install PostgreSQL client tools."
    echo "   On macOS: brew install postgresql"
    echo "   On Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Check if FIX_USER_CREATION_AND_RLS.sql exists
if [ ! -f "FIX_USER_CREATION_AND_RLS.sql" ]; then
    echo "❌ FIX_USER_CREATION_AND_RLS.sql not found. Please make sure the file exists."
    exit 1
fi

echo "📋 What will be fixed:"
echo "  ✅ Auto user creation trigger (creates user records when auth users are created)"
echo "  ✅ RLS policies fixed for users, games, conversations, and cache tables"
echo "  ✅ Manual user creation function (ensures user exists)"
echo "  ✅ Database functions updated to handle missing users"
echo ""

echo "🔧 Deployment Options:"
echo ""
echo "Option 1 - Using Supabase Dashboard (RECOMMENDED):"
echo "  1. Go to your Supabase project dashboard"
echo "  2. Navigate to SQL Editor"
echo "  3. Copy and paste the contents of FIX_USER_CREATION_AND_RLS.sql"
echo "  4. Run the SQL"
echo ""
echo "Option 2 - Using psql with connection string:"
echo "  psql 'your-supabase-connection-string' -f FIX_USER_CREATION_AND_RLS.sql"
echo ""
echo "Option 3 - Using Supabase CLI:"
echo "  supabase db reset --linked"
echo "  # Then run: psql 'your-connection-string' -f FIX_USER_CREATION_AND_RLS.sql"
echo ""

echo "🎯 After deployment, you should see:"
echo "  ✅ No more 404 errors for users table"
echo "  ✅ No more 403 errors for games table"
echo "  ✅ New users automatically created when they authenticate"
echo "  ✅ Proper access to all user data"
echo "  ✅ Google login working completely"
echo "  ✅ App functioning without console errors"
echo ""

echo "💡 TIP: This fixes the root cause of the authentication issues"
echo "   by ensuring user records exist and RLS policies allow access."
echo ""

echo "✅ Ready to deploy! Choose one of the options above."
echo ""
echo "🚨 NOTE: This will create triggers and update RLS policies."
echo "   Make sure to test thoroughly after deployment."
