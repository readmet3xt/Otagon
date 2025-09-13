# Contact Form Database Setup Guide

This guide will walk you through setting up the contact form database integration for your Otakon app.

## 🚀 Quick Setup

### Step 1: Run the Database Schema

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Create a **New Query**
3. Copy and paste the contents of `docs/schemas/contact-submissions-simple.sql`
4. Click **Run** to execute the schema

### Step 2: Verify the Setup

After running the schema, you should see:
- ✅ `contact_submissions` table created
- ✅ Indexes created for performance
- ✅ Row Level Security (RLS) enabled
- ✅ Policies created for access control
- ✅ Functions and triggers created

## 📊 Database Structure

### Table: `contact_submissions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `name` | VARCHAR(255) | User's full name |
| `email` | VARCHAR(255) | User's email address |
| `subject` | VARCHAR(500) | Contact form subject |
| `message` | TEXT | Contact form message |
| `user_id` | UUID | Associated user ID (if authenticated) |
| `status` | VARCHAR(50) | Submission status (new/in_progress/resolved/closed) |
| `priority` | VARCHAR(50) | Priority level (low/medium/high) |
| `source` | VARCHAR(100) | Submission source (landing_page) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Automatic Features

- **UUID Generation**: Each submission gets a unique ID
- **Timestamps**: Automatic creation and update tracking
- **Priority Detection**: Smart priority determination based on content
- **User Association**: Links to authenticated users when available

## 🔐 Security Features

### Row Level Security (RLS)

The table has RLS enabled with the following policies:

1. **Users can view their own submissions**
2. **Users can insert their own submissions**
3. **Users can update their own submissions**
4. **Anonymous users can insert submissions**
5. **Proper permissions for authenticated and anonymous users**

### Access Control

- **Authenticated Users**: Can view, insert, and update their own submissions
- **Anonymous Users**: Can only insert new submissions
- **Admin Users**: Can view and manage all submissions (requires role system)

## 🎯 Priority System

The system automatically determines priority based on message content:

### High Priority Keywords
- urgent, critical, broken, error, bug, issue, problem, help, support

### Medium Priority
- General inquiries, feature requests

### Low Priority
- Questions, information requests, general feedback

## 📈 Analytics & Reporting

### Built-in Statistics Function

```sql
-- Get statistics for the last 30 days
SELECT * FROM get_contact_statistics(30);

-- Get statistics for the last 7 days
SELECT * FROM get_contact_statistics(7);
```

### Available Metrics

- Total submission count
- Count by status (new, in_progress, resolved, closed)
- Count by priority (low, medium, high)
- Time-based filtering

## 🧪 Testing the Integration

### 1. Test Anonymous Submission

1. Open your app in an incognito window (not logged in)
2. Navigate to the landing page
3. Click "Contact Us" in the footer
4. Fill out and submit the form
5. Check your Supabase dashboard → `contact_submissions` table

### 2. Test Authenticated Submission

1. Log in to your app
2. Navigate to the landing page
3. Click "Contact Us" in the footer
4. Fill out and submit the form
5. Verify the submission is linked to your user ID

### 3. Verify Data Integrity

Check that:
- ✅ All form fields are properly stored
- ✅ Timestamps are automatically set
- ✅ Priority is correctly determined
- ✅ User association works for authenticated users
- ✅ Anonymous submissions work without user ID

## 🔧 Customization Options

### Modify Priority Keywords

Edit the `determinePriority` method in `services/contactService.ts`:

```typescript
private determinePriority(subject: string, message: string): ContactFormSubmission['priority'] {
  const urgentKeywords = ['your', 'custom', 'keywords', 'here'];
  const content = `${subject} ${message}`.toLowerCase();
  
  if (urgentKeywords.some(keyword => content.includes(keyword))) {
    return 'high';
  }
  
  // Add your custom logic here
  
  return 'medium';
}
```

### Add New Status Types

1. Update the database schema:
```sql
ALTER TABLE contact_submissions 
DROP CONSTRAINT contact_submissions_status_check;

ALTER TABLE contact_submissions 
ADD CONSTRAINT contact_submissions_status_check 
CHECK (status IN ('new', 'in_progress', 'resolved', 'closed', 'your_new_status'));
```

2. Update the TypeScript interface in `services/contactService.ts`

### Custom Fields

Add new columns to the table:

```sql
ALTER TABLE contact_submissions 
ADD COLUMN phone VARCHAR(20),
ADD COLUMN company VARCHAR(255),
ADD COLUMN category VARCHAR(100);
```

## 🚨 Troubleshooting

### Common Issues

1. **"Table doesn't exist"**
   - Make sure you ran the schema in the correct database
   - Check that you're connected to the right Supabase project

2. **"Permission denied"**
   - Verify RLS policies are properly created
   - Check that the `anon` role has INSERT permission

3. **"Function not found"**
   - Ensure all functions were created successfully
   - Check for syntax errors in the schema

4. **Form submissions not appearing**
   - Check browser console for errors
   - Verify Supabase connection in your environment variables
   - Check network tab for failed API calls

### Debug Steps

1. **Check Console Logs**: Look for error messages in browser console
2. **Verify Database**: Check Supabase dashboard for table creation
3. **Test Permissions**: Try manual database operations
4. **Check Environment**: Verify Supabase URL and keys are correct

## 📱 Frontend Integration

The contact form is already integrated into your app:

- **Component**: `components/ContactUsModal.tsx`
- **Service**: `services/contactService.ts`
- **Integration**: Landing page footer with "Contact Us" button
- **State Management**: Integrated with App.tsx modal system

## 🎉 Next Steps

After setup, consider:

1. **Admin Dashboard**: Create an interface to manage submissions
2. **Email Notifications**: Set up webhooks for new submissions
3. **Auto-responders**: Send confirmation emails to users
4. **Analytics Dashboard**: Visualize submission trends
5. **Integration**: Connect with your support ticket system

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your Supabase setup
3. Review the console logs for specific error messages
4. Ensure all environment variables are properly set

The contact form system is now fully integrated and ready to capture user inquiries in your database! 🎯
