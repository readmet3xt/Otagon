# API Key Configuration Fix

## Problem
The Gemini API key is not being loaded properly, causing the error:
```
API key not valid. Please pass a valid API key.
```

## Root Cause
The application is looking for `VITE_GEMINI_API_KEY` but it's not properly configured in your environment.

## Solution

### Step 1: Create Environment File
Create a `.env.local` file in your project root with:

```bash
# .env.local
VITE_GEMINI_API_KEY=your-actual-gemini-api-key-here
VITE_SUPABASE_URL=https://qajcxgkqloumogioomiz.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-anon-key-here
```

### Step 2: Get Your Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API Key"
3. Create a new API key
4. Copy the key and replace `your-actual-gemini-api-key-here` in the `.env.local` file

### Step 3: Verify Configuration
The application loads the API key in this order:
1. `import.meta.env.VITE_GEMINI_API_KEY` (from .env.local)
2. `process.env.API_KEY` (fallback)

### Step 4: Restart Development Server
After creating the `.env.local` file:
```bash
npm run dev
```

## Alternative: Environment Variable
If you prefer to use environment variables directly:

```bash
# Windows (PowerShell)
$env:VITE_GEMINI_API_KEY="your-actual-gemini-api-key-here"
npm run dev

# Windows (Command Prompt)
set VITE_GEMINI_API_KEY=your-actual-gemini-api-key-here
npm run dev

# macOS/Linux
export VITE_GEMINI_API_KEY="your-actual-gemini-api-key-here"
npm run dev
```

## Verification
After setting up the API key, you should see in the console:
```
🔧 AI Service Debug: {
  viteKey: '✅ Set',
  processKey: '❌ Missing',
  finalKey: '✅ Set'
}
```

## Important Notes
- Never commit `.env.local` to version control
- The `.env.local` file should be in your project root (same level as package.json)
- Make sure there are no spaces around the `=` sign
- Restart your development server after making changes
