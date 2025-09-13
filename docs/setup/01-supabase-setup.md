# Supabase Setup Guide for Otakon

This guide will walk you through setting up Supabase for your Otakon project.

## 🚀 Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" or "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `otakon` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
5. Click "Create new project"
6. Wait for project setup to complete (usually 2-3 minutes)

## 🔑 Step 2: Get Project Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://qajcxgkqloumogioomiz.supabase.co`
   - **Anon/Public Key**: `sb_publishable_GoW6G_umt1lFF-KPbbm-Ow_D2PYxPLw`

## ⚙️ Step 3: Configure Authentication

1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add: `http://localhost:5174` (for development)
3. Under **Redirect URLs**, add: `http://localhost:5174/**`
4. Click **Save**

### 🔑 Configure OAuth Providers

#### Google OAuth
1. Go to **Authentication** → **Providers**
2. Enable **Google**
3. Get your **Client ID** and **Client Secret** from [Google Cloud Console](https://console.cloud.google.com/)
4. Add the credentials to Supabase
5. Set **Redirect URL** to: `https://qajcxgkqloumogioomiz.supabase.co/auth/v1/callback`

#### Discord OAuth
1. Go to **Authentication** → **Providers**
2. Enable **Discord**
3. Get your **Client ID** and **Client Secret** from [Discord Developer Portal](https://discord.com/developers/applications)
4. Add the credentials to Supabase
5. Set **Redirect URL** to: `https://qajcxgkqloumogioomiz.supabase.co/auth/v1/callback`

## 🗄️ Step 4: Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy and paste the entire content of `supabase-schema-minimal.sql`
4. Click **Run** to execute the schema
5. If successful, create another query and run `supabase-user-trigger.sql`

## 🔒 Step 5: Verify Row Level Security

1. Go to **Authentication** → **Policies**
2. You should see RLS enabled on all tables:
   - `conversations`
   - `usage`
   - `user_profiles`
3. Verify that policies are created for each table

## 🧪 Step 6: Test the Setup

1. Go to **Authentication** → **Users**
2. Click **Add User** to create a test user
3. Enter email and password
4. Check if the user profile and usage records are automatically created

## 🚨 Troubleshooting

### Common Issues:

#### 1. **Permission Denied Errors**
- **Problem**: `ERROR: 42501: permission denied`
- **Solution**: Use the `supabase-schema-minimal.sql` file instead of the original schema

#### 2. **Table Owner Errors**
- **Problem**: `ERROR: 42501: must be owner of table http_request_queue`
- **Solution**: Use the minimal schema that only creates your app tables, not system tables

#### 2. **RLS Policies Not Working**
- **Problem**: Users can't access their data
- **Solution**: Verify policies are created and RLS is enabled on all tables

#### 3. **Trigger Function Errors**
- **Problem**: `function "handle_new_user" does not exist`
- **Solution**: Run the `supabase-user-trigger.sql` file after the main schema

#### 4. **Authentication Not Working**
- **Problem**: Users can't sign up/sign in
- **Solution**: Check Site URL and Redirect URLs in Authentication settings

## 📱 Testing Your App

1. Start your development server: `npm run dev`
2. Open the app in your browser
3. Click the **"Sign In"** button
4. Try creating a new account
5. Verify that data is being stored in Supabase

## 🔍 Verifying Data Storage

1. In Supabase dashboard, go to **Table Editor**
2. Check the following tables:
   - `conversations` - Should contain chat data
   - `usage` - Should contain user quota information
   - `user_profiles` - Should contain user profile data

## 🚀 Production Deployment

When deploying to production:

1. Update **Site URL** to your production domain
2. Add production domain to **Redirect URLs**
3. Consider enabling additional security features:
   - Email confirmations
   - Two-factor authentication
   - Rate limiting

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
- [Authentication Best Practices](https://supabase.com/docs/guides/auth/auth-best-practices)

## 🆘 Need Help?

If you encounter issues:

1. Check the Supabase logs in your dashboard
2. Verify all environment variables are set correctly
3. Ensure the schema was executed completely
4. Check that RLS policies are properly configured

Your Supabase setup should now be working correctly! 🎉
