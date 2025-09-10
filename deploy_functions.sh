#!/bin/bash

# Script to deploy missing database functions for Google login fix
# This fixes the 404 errors that prevent users from accessing the app after OAuth login

echo "🚀 Deploying missing database functions to fix Google login issue..."

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed. Please install PostgreSQL client tools."
    echo "   On macOS: brew install postgresql"
    echo "   On Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Check if DEPLOY_MISSING_FUNCTIONS.sql exists
if [ ! -f "DEPLOY_MISSING_FUNCTIONS.sql" ]; then
    echo "❌ DEPLOY_MISSING_FUNCTIONS.sql not found. Please make sure the file exists."
    exit 1
fi

echo "📝 Functions to be deployed (SCHEMA CORRECTED):"
echo "  - migrate_user_usage_data (fixes 404 error for usage data)"
echo "  - migrate_user_app_state (fixes 404 error for app state - FIXED schema)"
echo "  - should_show_welcome_message (fixes 404 error for welcome message)"
echo "  - update_user_usage (enables usage tracking)"
echo "  - update_user_app_state (enables app state updates - FIXED schema)"
echo ""
echo "🔧 CRITICAL FIX: The functions now use the correct 'app_state' JSONB column"
echo "   instead of the non-existent 'app_settings' column that was causing 400 errors."
echo ""

echo "⚠️  To deploy these functions, you need to run one of the following commands:"
echo ""
echo "Option 1 - Using Supabase CLI (recommended):"
echo "  supabase db reset --linked"
echo ""
echo "Option 2 - Using psql with connection string:"
echo "  psql 'your-supabase-connection-string' -f DEPLOY_MISSING_FUNCTIONS.sql"
echo ""
echo "Option 3 - Using Supabase Dashboard:"
echo "  1. Go to your Supabase project dashboard"
echo "  2. Navigate to SQL Editor"
echo "  3. Copy and paste the contents of DEPLOY_MISSING_FUNCTIONS.sql"
echo "  4. Run the SQL"
echo ""

echo "🔧 After deploying the functions:"
echo "  1. The 404 errors for users and games tables will be resolved"
echo "  2. The 400 'column app_settings does not exist' error will be fixed"
echo "  3. Google login will work properly and redirect to the app"
echo "  4. Users will no longer get stuck on the landing page"
echo "  5. Console flooding with 'User not authenticated' will be reduced"
echo ""

echo "🚨 CRITICAL: The functions have been corrected to use the proper schema."
echo "   The previous version had incorrect column references that caused 400 errors."
echo ""

echo "✅ Ready to deploy! Choose one of the options above."
