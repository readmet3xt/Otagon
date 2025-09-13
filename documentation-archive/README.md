# Otakon - AI-Powered Gaming Companion

A comprehensive gaming companion app with AI-powered insights, progress tracking, and personalized recommendations.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up the database:**
   - Run `MASTER_SCHEMA.sql` in your Supabase SQL Editor
   - This creates the consolidated 8-table schema with full compatibility

3. **Start development:**
   ```bash
   npm run dev
   ```

## 🏗️ Architecture

### Database Schema
- **8 consolidated tables** (reduced from 52) with parent-child structure
- **44 compatibility views** maintain seamless app integration
- **RLS security policies** for data protection
- **Performance indexes** for optimal queries

### Key Features
- **AI-powered insights** and recommendations
- **Progress tracking** across multiple games
- **Developer mode** with tier switching and analytics
- **Unified data service** with localStorage/Supabase separation
- **Real-time chat** with gaming context

## 📁 Project Structure

```
├── components/          # React components
├── services/           # Business logic and API services
├── hooks/              # Custom React hooks
├── config/             # Configuration files
├── documentation/      # All documentation and analysis
├── MASTER_SCHEMA.sql   # Single source of truth for database
└── README.md          # This file
```

## 🔧 Development

### Database Schema
The `MASTER_SCHEMA.sql` file contains the complete consolidated database schema. It includes:
- 8 parent-child tables consolidating all data
- Compatibility views for backward compatibility
- Security policies and performance indexes
- Essential RPC functions

### Key Services
- `UnifiedDataService` - Handles data storage (localStorage for dev mode, Supabase for authenticated users)
- `DatabaseService` - Manages Supabase operations
- `PlayerProfileService` - Handles player profile management

## 📚 Documentation

All documentation is organized in the `documentation/` folder:
- Schema analysis and consolidation guides
- Implementation documentation
- System diagnostics and reports
- Authentication and security guides

## 🎯 Features

### For Users
- **Game Progress Tracking** - Track progress across multiple games
- **AI Insights** - Personalized recommendations and insights
- **Chat Interface** - Context-aware gaming conversations
- **Task Management** - Organize gaming objectives and tasks

### For Developers
- **Developer Mode** - Local storage with tier switching
- **Analytics Dashboard** - Performance and usage analytics
- **Debug Tools** - Comprehensive debugging capabilities

## 🔒 Security

- **Row Level Security (RLS)** on all tables
- **Strict data separation** between developer mode and authenticated users
- **Secure authentication** with Google Sign-in
- **API rate limiting** and cost tracking

## 🚀 Deployment

The app is configured for deployment with:
- Vite build system
- Service worker for offline functionality
- Optimized bundle analysis
- Comprehensive testing setup

## 📊 Performance

- **Consolidated schema** reduces database complexity by 85%
- **Strategic indexing** for optimal query performance
- **Caching strategies** for improved response times
- **Bundle optimization** for faster loading

---

For detailed documentation, see the `documentation/` folder.
