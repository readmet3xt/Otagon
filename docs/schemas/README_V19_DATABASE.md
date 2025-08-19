# 🚀 OTAKON V19 Enhanced Database Setup Guide

## 📋 Overview

This guide covers the setup and configuration of the enhanced database schema for Otakon v19, featuring:
- **Enhanced Insight Generation** with profile-aware tabs
- **Proactive AI Suggestions** with intelligent triggers
- **Cross-Game Awareness** and session management
- **RLS Protection** for complete data security
- **Performance Optimizations** with no warnings or issues

## 🔒 Security Features

### Row Level Security (RLS)
- **100% RLS Protected**: All tables enforce user isolation
- **Policy-Based Access**: Users can only access their own data
- **Cascade Protection**: Related data automatically protected
- **Audit Trail**: All operations logged with user context

### Data Validation
- **Check Constraints**: Enforce data integrity at database level
- **Foreign Key Relationships**: Maintain referential integrity
- **Type Safety**: Strict typing for all critical fields

## 🏗️ Database Schema

### Core Tables

#### 1. **User Management**
```sql
user_profiles          -- Basic user information
player_profiles        -- Gaming preferences and style
user_preferences       -- App behavior settings
```

#### 2. **Game Context**
```sql
game_contexts          -- Game-specific user data
build_snapshots        -- Character progression tracking
session_summaries      -- Gameplay session records
```

#### 3. **Enhanced Insights**
```sql
enhanced_insights      -- Profile-aware insight tabs
conversation_contexts  -- AI context understanding
```

#### 4. **Proactive Features**
```sql
proactive_triggers     -- Event triggers for AI suggestions
proactive_insights     -- Generated AI recommendations
```

#### 5. **Analytics & Usage**
```sql
usage                  -- User activity tracking
ai_feedback           -- AI response quality metrics
```

## ⚡ Performance Optimizations

### Index Strategy
- **Composite Indexes**: Optimize multi-column queries
- **Partial Indexes**: Focus on active/unread data
- **Concurrent Creation**: No downtime during index creation
- **Statistics Optimization**: Better query planning

### Query Optimization
- **Efficient Joins**: Optimized table relationships
- **Smart Filtering**: Index-optimized WHERE clauses
- **Batch Operations**: Efficient bulk data handling

### Maintenance
- **Automatic Cleanup**: Remove old data automatically
- **Vacuum Optimization**: Maintain table performance
- **Statistics Updates**: Keep query planner informed

## 🚀 Setup Instructions

### Prerequisites
1. **Supabase Project**: Active project with database access
2. **PostgreSQL 14+**: Required for advanced features
3. **Admin Access**: To create tables and policies

### Step 1: Run Safe Migration Script (Recommended)
```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the safe migration script (checks existing tables)
\i OTAKON_V19_MIGRATION_SCRIPT.sql
```

**⚠️ Alternative: Clean Slate (DESTROYS ALL DATA)**
If you want a completely fresh start and don't mind losing existing data:
```bash
# WARNING: This will delete ALL existing tables and data!
\i OTAKON_V19_ENHANCED_SCHEMA.sql
```

### Step 2: Verify Setup
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';
```

### Step 3: Test RLS Policies
```sql
-- Test as authenticated user
-- This should only return user's own data
SELECT * FROM player_profiles;
SELECT * FROM game_contexts;
```

## 🔧 Configuration

### Environment Variables
```bash
# Required for database connection
VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=[YOUR-ANON-KEY]
```

### Database Connection
```typescript
import { supabase } from './services/supabase';

// Test connection
const testConnection = async () => {
  const { data, error } = await supabase
    .from('player_profiles')
    .select('count')
    .limit(1);
  
  if (error) {
    console.error('Connection failed:', error);
  } else {
    console.log('Database connected successfully');
  }
};
```

## 📊 Monitoring & Maintenance

### Health Checks
```typescript
import { databaseService } from './services/databaseService';

// Check database health
const health = await databaseService.checkHealth();
console.log('Database healthy:', health);
```

### Performance Monitoring
```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Monitor table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Automated Cleanup
```typescript
// Clean up old data (run weekly)
await databaseService.cleanupOldData();
```

## 🚨 Troubleshooting

### Migration Issues

#### **"relation already exists" Error**
If you get errors like `ERROR: 42P07: relation "user_profiles" already exists`:

1. **Use the Safe Migration Script** (Recommended):
   ```bash
   \i OTAKON_V19_MIGRATION_SCRIPT.sql
   ```
   This script checks for existing tables and only creates new ones.

2. **Check Existing Tables**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

3. **Verify Table Structure**:
   ```sql
   \d user_profiles
   \d conversations
   \d usage
   ```

#### **RLS Policy Conflicts**
If you get policy creation errors:

1. **Check Existing Policies**:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'player_profiles';
   ```

2. **Drop Conflicting Policies** (if needed):
   ```sql
   DROP POLICY IF EXISTS "Users can view own player profile" ON player_profiles;
   ```

3. **Re-run Migration**:
   ```bash
   \i OTAKON_V19_MIGRATION_SCRIPT.sql
   ```

### Common Issues

#### 1. **RLS Policy Errors**
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'player_profiles';

-- Verify policies exist
SELECT * FROM pg_policies 
WHERE tablename = 'player_profiles';
```

#### 2. **Index Creation Failures**
```sql
-- Check for duplicate indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Drop and recreate if needed
DROP INDEX CONCURRENTLY IF EXISTS idx_player_profiles_user_id;
CREATE INDEX CONCURRENTLY idx_player_profiles_user_id ON player_profiles(user_id);
```

#### 3. **Performance Issues**
```sql
-- Check table statistics
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables
WHERE schemaname = 'public';

-- Update statistics if needed
ANALYZE player_profiles;
ANALYZE game_contexts;
```

### Performance Tips
1. **Use Prepared Statements**: Reduce query parsing overhead
2. **Batch Operations**: Group multiple operations together
3. **Connection Pooling**: Reuse database connections
4. **Regular Maintenance**: Run VACUUM and ANALYZE regularly

## 🔄 Migration from Previous Versions

### Local Storage Migration
```typescript
// Migrate existing data
const migrateData = async () => {
  // Load from localStorage
  const localProfile = localStorage.getItem('otakon_player_profile');
  const localGameContext = localStorage.getItem('otakon_game_contexts');
  
  if (localProfile) {
    const profile = JSON.parse(localProfile);
    await databaseService.syncPlayerProfile(profile);
  }
  
  if (localGameContext) {
    const contexts = JSON.parse(localGameContext);
    for (const [gameId, context] of Object.entries(contexts)) {
      await databaseService.syncGameContext(gameId, context);
    }
  }
};
```

### Data Validation
```typescript
// Verify migration success
const verifyMigration = async () => {
  const dbProfile = await databaseService.getPlayerProfile();
  const localProfile = localStorage.getItem('otakon_player_profile');
  
  if (dbProfile && localProfile) {
    const local = JSON.parse(localProfile);
    console.log('Migration verified:', 
      dbProfile.hintStyle === local.hintStyle &&
      dbProfile.playerFocus === local.playerFocus
    );
  }
};
```

## 📈 Scaling Considerations

### Horizontal Scaling
- **Read Replicas**: Distribute read load
- **Connection Pooling**: Manage connection limits
- **Caching Layer**: Reduce database load

### Vertical Scaling
- **Resource Monitoring**: Track CPU, memory, disk usage
- **Query Optimization**: Identify and fix slow queries
- **Index Maintenance**: Keep indexes efficient

## 🎯 Best Practices

### Development
1. **Always Use RLS**: Never disable row-level security
2. **Test with Real Data**: Use realistic data volumes
3. **Monitor Performance**: Track query execution times
4. **Version Control**: Keep schema changes in version control

### Production
1. **Backup Strategy**: Regular automated backups
2. **Monitoring**: Set up alerts for performance issues
3. **Maintenance Windows**: Schedule regular maintenance
4. **Rollback Plan**: Have schema rollback procedures

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [Index Best Practices](https://www.postgresql.org/docs/current/indexes.html)

## 🆘 Support

For database-related issues:
1. Check the troubleshooting section above
2. Review Supabase logs in your project dashboard
3. Test with minimal data to isolate issues
4. Contact the development team with specific error messages

---

**🎉 Congratulations!** Your Otakon v19 database is now set up with enterprise-grade security, performance, and scalability features.
