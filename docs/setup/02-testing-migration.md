# Testing and Migration Guide

This document covers the comprehensive testing infrastructure and migration from localStorage to Supabase backend storage.

## 🧪 Testing Infrastructure

### Setup

The project now includes a complete testing setup with:

- **Vitest** - Fast unit test runner
- **React Testing Library** - Component testing utilities
- **Jest DOM** - DOM testing matchers
- **User Event** - User interaction simulation

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
test/
├── setup.ts                 # Global test configuration
├── components/              # Component tests
│   └── ChatMessage.test.tsx
└── services/                # Service tests
    └── performanceService.test.tsx
```

### Writing Tests

#### Component Tests
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

#### Service Tests
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { myService } from '../myService';

describe('MyService', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('performs operation correctly', () => {
    const result = myService.doSomething();
    expect(result).toBe('expected');
  });
});
```

### Mocking

The test setup includes mocks for:
- `localStorage`
- `WebSocket`
- `Audio` API
- `navigator.share`
- `ResizeObserver`
- `IntersectionObserver`

## 🚀 Performance Monitoring

### Performance Service

The `PerformanceService` tracks:
- **Metrics**: Page load times, resource loading, custom measurements
- **Interactions**: User actions with success/failure tracking
- **Errors**: Global error catching and component error tracking

### Usage

```typescript
import { performanceService } from '../services/performanceService';

// Record custom metrics
performanceService.recordMetric('api_call_duration', 150, 'ms');

// Track user interactions
performanceService.recordInteraction('button_click', true, 50);

// Measure function performance
const result = await performanceService.measureAsync('api_call', async () => {
  return await api.getData();
});

// Subscribe to performance events
const unsubscribe = performanceService.subscribe((data) => {
  console.log('Performance event:', data);
});
```

## 🛡️ Error Boundaries

### Error Boundary Component

The `ErrorBoundary` component catches React errors and provides:
- User-friendly error messages
- Error recovery options
- Development error details
- Automatic error logging

### Usage

```typescript
import ErrorBoundary from '../components/ErrorBoundary';

<ErrorBoundary
  onError={(error, errorInfo) => {
    // Custom error handling
    console.error('Caught error:', error, errorInfo);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

## 🔐 Authentication & Backend Migration

### Supabase Integration

The project now includes:
- **Supabase Client** - Database and authentication
- **Auth Service** - User management
- **Database Service** - Data persistence
- **Migration System** - localStorage to backend migration

### Environment Variables

Create a `.env.local` file with:

```bash
# Existing
GEMINI_API_KEY=your_gemini_api_key

# New Supabase variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Get project URL and anon key

2. **Run Database Schema**
   ```sql
   -- Copy and run the contents of supabase-schema.sql
   -- This creates tables, indexes, and RLS policies
   ```

3. **Configure Authentication**
   - Enable email authentication in Supabase dashboard
   - Configure email templates if needed

### Migration Process

The migration system automatically:
1. **Detects** localStorage data
2. **Migrates** conversations and usage data
3. **Verifies** successful migration
4. **Cleans up** localStorage after migration
5. **Tracks** migration performance

### Migration Components

- **`useMigration` Hook** - Migration logic and state
- **`MigrationModal`** - User interface for migration
- **`DatabaseService`** - Data transfer operations

## 📊 Database Schema

### Tables

#### `conversations`
- Stores chat conversations with game context
- Includes messages, insights, progress tracking
- User-specific with RLS policies

#### `usage`
- Tracks API usage and limits
- Manages user tiers and quotas
- Auto-created for new users

#### `user_profiles`
- User preferences and settings
- Display names and avatars
- Auto-created for new users

### Security

- **Row Level Security (RLS)** enabled on all tables
- **User isolation** - users can only access their own data
- **JWT authentication** for secure API access

## 🔄 Migration Workflow

### Automatic Migration

1. User signs in/up
2. System checks for localStorage data
3. If data exists, migration modal appears
4. User chooses to migrate or skip
5. Data is transferred to Supabase
6. localStorage is cleaned up

### Manual Migration

```typescript
import { useMigration } from '../hooks/useMigration';

const { migrationState, migrateData } = useMigration();

// Trigger migration
await migrateData();
```

### Migration States

- **`isMigrating`** - Migration in progress
- **`hasMigrated`** - Migration completed
- **`error`** - Migration failed with error message
- **`progress`** - Migration progress percentage

## 🧪 Testing Migration

### Test Database

For testing, use a separate Supabase project or local setup:

```typescript
// Mock database service in tests
vi.mock('../services/databaseService', () => ({
  databaseService: {
    migrateFromLocalStorage: vi.fn(),
    loadConversations: vi.fn(),
    cleanupLocalStorage: vi.fn(),
  },
}));
```

### Integration Tests

Test the complete migration flow:

```typescript
describe('Migration Flow', () => {
  it('should migrate localStorage data to backend', async () => {
    // Setup localStorage data
    localStorage.setItem('otakonConversations', JSON.stringify(mockData));
    
    // Trigger migration
    await migrateData();
    
    // Verify migration
    expect(mockDatabaseService.migrateFromLocalStorage).toHaveBeenCalled();
    expect(localStorage.getItem('otakonConversations')).toBeNull();
  });
});
```

## 🚀 Performance Considerations

### Migration Performance

- **Batch operations** for large datasets
- **Progress tracking** for user feedback
- **Error handling** with retry mechanisms
- **Performance monitoring** of migration process

### Backend Performance

- **Database indexes** for fast queries
- **RLS policies** for efficient data filtering
- **Connection pooling** for concurrent users
- **Data compression** for large conversations

## 🔍 Monitoring & Analytics

### Performance Metrics

Track key performance indicators:
- **Migration success rate**
- **Data transfer speeds**
- **User engagement** during migration
- **Error rates** and recovery

### User Analytics

Monitor user behavior:
- **Migration completion rates**
- **Feature adoption** after migration
- **Performance improvements**
- **User satisfaction** metrics

## 🛠️ Troubleshooting

### Common Issues

1. **Migration Fails**
   - Check Supabase connection
   - Verify database schema
   - Check user authentication

2. **Performance Issues**
   - Monitor database query performance
   - Check network connectivity
   - Verify RLS policies

3. **Authentication Errors**
   - Verify environment variables
   - Check Supabase project settings
   - Verify email templates

### Debug Mode

Enable detailed logging:

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  console.log('Migration state:', migrationState);
  console.log('Database operations:', databaseOperations);
}
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)
- [Performance Monitoring Best Practices](https://web.dev/performance/)

## 🤝 Contributing

When adding new features:
1. **Write tests** for new functionality
2. **Update migration** if data structure changes
3. **Monitor performance** impact
4. **Document** new features and APIs
