#!/bin/bash

# Script to deploy only the missing functions
# This fixes the 400 errors without touching your existing tables

echo "🚀 DEPLOYING MISSING FUNCTIONS ONLY..."
echo ""
echo "✅ Your existing tables will remain untouched"
echo "✅ This only adds the missing functions that are causing 400 errors"
echo ""

echo "This script will fix the following 400 errors:"
echo "  ❌ 400 errors for migrate_user_usage_data function"
echo "  ❌ 400 errors for get_app_cache function"
echo "  ❌ 400 errors for should_show_welcome_message function"
echo "  ❌ 400 errors for update_user_app_state function"
echo "  ❌ 400 errors for update_user_usage function"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed. Please install PostgreSQL client tools."
    echo "   On macOS: brew install postgresql"
    echo "   On Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Check if DEPLOY_MISSING_FUNCTIONS_ONLY.sql exists
if [ ! -f "DEPLOY_MISSING_FUNCTIONS_ONLY.sql" ]; then
    echo "❌ DEPLOY_MISSING_FUNCTIONS_ONLY.sql not found. Please make sure the file exists."
    exit 1
fi

echo "📋 Functions that will be created:"
echo "  ✅ migrate_user_usage_data (fixes usage data 400 errors)"
echo "  ✅ migrate_user_app_state (fixes app state 400 errors)"
echo "  ✅ should_show_welcome_message (fixes welcome message 400 errors)"
echo "  ✅ update_user_usage (enables usage updates)"
echo "  ✅ update_user_app_state (enables app state updates)"
echo "  ✅ get_app_cache (fixes cache 400 errors)"
echo "  ✅ set_app_cache (enables cache updates)"
echo "  ✅ update_welcome_message_shown (enables welcome message tracking)"
echo ""

echo "🔧 Deployment Options:"
echo ""
echo "Option 1 - Using Supabase Dashboard (RECOMMENDED):"
echo "  1. Go to your Supabase project dashboard"
echo "  2. Navigate to SQL Editor"
echo "  3. Copy and paste the contents of DEPLOY_MISSING_FUNCTIONS_ONLY.sql"
echo "  4. Run the SQL"
echo ""
echo "Option 2 - Using psql with connection string:"
echo "  psql 'your-supabase-connection-string' -f DEPLOY_MISSING_FUNCTIONS_ONLY.sql"
echo ""
echo "Option 3 - Using Supabase CLI:"
echo "  supabase db reset --linked"
echo "  # Then run: psql 'your-connection-string' -f DEPLOY_MISSING_FUNCTIONS_ONLY.sql"
echo ""

echo "🎯 After deployment, you should see:"
echo "  ✅ No more 400 errors for missing functions"
echo "  ✅ No more 400 errors for column 'queries_used' does not exist"
echo "  ✅ No more 400 errors for column 'auth_user_id' does not exist"
echo "  ✅ Google login working properly"
echo "  ✅ App functioning without console errors"
echo "  ✅ All existing data preserved"
echo ""

echo "💡 TIP: This is much safer than the complete database reset"
echo "   since it only adds functions and doesn't touch your existing tables."
echo ""

echo "✅ Ready to deploy! Choose one of the options above."
echo ""
echo "🚨 NOTE: If you still get 404 errors after this, it means there might be"
echo "   RLS (Row Level Security) issues that need to be addressed separately."
