# 🗄️ Otakon Database Schemas

This folder contains documentation for the Otakon database schemas.

## 🎯 **Current Schema**

**The single source of truth for the database schema is now:**
- **`MASTER_SCHEMA.sql`** (in the root directory)
  - 8 consolidated parent-child tables (reduced from 52)
  - 44 compatibility views for seamless app integration
  - Row Level Security (RLS) enabled
  - Performance optimized indexes
  - Essential RPC functions
  - **This is the ONLY schema file you need**

## 📁 **Folder Structure**

### **🚀 Production** (`/production/`)
**Production schema documentation.**

- **README_V19_ULTIMATE_MASTER.md** - Production schema documentation

### **📚 Documentation**
**Schema documentation and analysis.**

- **README_V19_DATABASE.md** - Database documentation
- **README.md** - This file

## 🚀 **Quick Start**

### **Database Setup:**
```bash
# Run the master schema in your Supabase SQL Editor
# File: MASTER_SCHEMA.sql (in root directory)
```

## 📊 **Schema Features**

### **8 Consolidated Tables:**
- **`app_level`** - System & global data
- **`users`** - All user-related data (consolidates 15+ tables)
- **`games`** - All game-related data (consolidates 10+ tables)
- **`conversations`** - All chat & AI data (consolidates 8+ tables)
- **`tasks`** - All task & objective data (consolidates 4+ tables)
- **`analytics`** - All analytics & tracking data (consolidates 6+ tables)
- **`cache`** - All caching & performance data (consolidates 3+ tables)
- **`admin`** - All admin & system data (consolidates 4+ tables)

### **44 Compatibility Views:**
- Maintains backward compatibility with existing app code
- No code changes required
- Seamless transition from 52 tables to 8

### **Security Features:**
- **Row Level Security (RLS)** - User data isolation
- **Admin Access Control** - Secure admin operations
- **Strict Data Separation** - Developer mode vs authenticated users

### **Performance Features:**
- **Strategic Indexing** - Optimized query performance
- **Parent-Child Structure** - Logical data organization
- **85% Complexity Reduction** - From 52 tables to 8

## ⚠️ **Important Notes**

1. **Single Source of Truth**: Only use `MASTER_SCHEMA.sql`
2. **Backup First**: Always backup before schema changes
3. **Test Environment**: Test in development first
4. **Zero Downtime**: App works without code changes

## 🔍 **Verification**

After deployment, verify:
- **Table Count**: Should be exactly 8 tables
- **View Count**: Should be 44 compatibility views
- **RLS Policies**: User isolation working correctly
- **App Functionality**: All features working seamlessly

---

**The consolidated schema is now the single source of truth! 🎮**



