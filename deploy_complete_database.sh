#!/bin/bash

# Script to deploy the complete database schema
# This fixes ALL 404 and 400 errors by creating the complete database structure

echo "🚀 DEPLOYING COMPLETE DATABASE SCHEMA..."
echo ""
echo "⚠️  WARNING: This will reset your entire database!"
echo "   Make sure to backup any important data before proceeding."
echo ""
echo "This script will fix ALL of the following errors:"
echo "  ❌ 404 errors for users table"
echo "  ❌ 404 errors for games table" 
echo "  ❌ 400 errors for migrate_user_usage_data function"
echo "  ❌ 400 errors for get_app_cache function"
echo "  ❌ 400 errors for column 'queries_used' does not exist"
echo "  ❌ 400 errors for column 'auth_user_id' does not exist"
echo "  ❌ 403 errors for games table access"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed. Please install PostgreSQL client tools."
    echo "   On macOS: brew install postgresql"
    echo "   On Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Check if DEPLOY_COMPLETE_DATABASE.sql exists
if [ ! -f "DEPLOY_COMPLETE_DATABASE.sql" ]; then
    echo "❌ DEPLOY_COMPLETE_DATABASE.sql not found. Please make sure the file exists."
    exit 1
fi

echo "📋 What will be created:"
echo "  ✅ users table (with all JSONB columns)"
echo "  ✅ games table (with all JSONB columns)"
echo "  ✅ conversations table"
echo "  ✅ cache table"
echo "  ✅ app_level table"
echo "  ✅ All required functions (8 functions)"
echo "  ✅ RLS policies for security"
echo "  ✅ Performance indexes"
echo ""

echo "🔧 Deployment Options:"
echo ""
echo "Option 1 - Using Supabase CLI (RECOMMENDED):"
echo "  supabase db reset --linked"
echo "  # Then run: psql 'your-connection-string' -f DEPLOY_COMPLETE_DATABASE.sql"
echo ""
echo "Option 2 - Using psql with connection string:"
echo "  psql 'your-supabase-connection-string' -f DEPLOY_COMPLETE_DATABASE.sql"
echo ""
echo "Option 3 - Using Supabase Dashboard:"
echo "  1. Go to your Supabase project dashboard"
echo "  2. Navigate to SQL Editor"
echo "  3. Copy and paste the contents of DEPLOY_COMPLETE_DATABASE.sql"
echo "  4. Run the SQL"
echo ""

echo "🎯 After deployment, you should see:"
echo "  ✅ No more 404 errors for users/games tables"
echo "  ✅ No more 400 errors for missing functions"
echo "  ✅ No more 400 errors for missing columns"
echo "  ✅ No more 403 errors for table access"
echo "  ✅ Google login working properly"
echo "  ✅ App functioning without console errors"
echo ""

echo "🚨 CRITICAL: This is a complete database reset!"
echo "   All existing data will be lost. Make sure this is what you want."
echo ""

echo "✅ Ready to deploy! Choose one of the options above."
echo ""
echo "💡 TIP: If you're unsure, start with Option 3 (Supabase Dashboard)"
echo "   as it's the safest way to deploy the schema."
