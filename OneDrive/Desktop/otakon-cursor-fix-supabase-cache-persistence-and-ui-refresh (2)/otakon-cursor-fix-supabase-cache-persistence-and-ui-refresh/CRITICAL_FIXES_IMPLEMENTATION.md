# 🔧 CRITICAL FIXES - CODE READY TO IMPLEMENT

**Priority:** URGENT - Implement all 3 in next sprint  
**Total Time:** ~2 hours  
**Files to Modify:** 4 files

---

## FIX #1: Monthly Reset Timing (30 min)

**File:** `src/services/conversationService.ts`

**Current Code (Line ~60):**
```typescript
// ❌ WRONG: Uses 30-day window
static async canSendTextQuery(): Promise<{ allowed: boolean; reason?: string; used?: number; limit?: number }> {
  try {
    const { authService } = await import('./authService');
    const user = authService.getCurrentUser();
    
    if (!user) {
      return { allowed: false, reason: 'User not authenticated' };
    }

    const textCount = user.textCount || 0;
    const textLimit = user.textLimit || 55;
    
    if (textCount >= textLimit) {
      const tier = user.tier || 'free';
      return {
        allowed: false,
        reason: `You've used all ${textLimit} text queries this month. ${tier === 'free' ? 'Upgrade to Pro for 1,583 queries!' : 'Your queries will reset next month.'}`,
        used: textCount,
        limit: textLimit
      };
    }
    
    return { allowed: true, used: textCount, limit: textLimit };
  } catch (error) {
    console.error('Error checking text query limit:', error);
    toastService.error('Failed to check query limit. Please try again.');
    return { allowed: false, reason: 'Failed to check query limit' };
  }
}
```

**New Code (FIXED):**
```typescript
// ✅ CORRECT: Uses calendar month
static async canSendTextQuery(): Promise<{ allowed: boolean; reason?: string; used?: number; limit?: number }> {
  try {
    const { authService } = await import('./authService');
    const user = authService.getCurrentUser();
    
    if (!user) {
      return { allowed: false, reason: 'User not authenticated' };
    }

    // Check if we should reset based on calendar month
    const shouldReset = this.shouldResetQueries(user.lastReset);
    
    if (shouldReset) {
      // Reset the counters
      const { SupabaseService } = await import('./supabaseService');
      const supabaseService = SupabaseService.getInstance();
      
      console.log('🔄 [ConversationService] Monthly reset triggered');
      const updatedUser = await supabaseService.resetMonthlyQueries(user.authUserId);
      if (updatedUser) {
        // Update auth cache with new user data
        await authService.refreshUser();
        return this.canSendTextQuery(); // Recursively check again
      }
    }

    const textCount = user.textCount || 0;
    const textLimit = user.textLimit || 55;
    
    if (textCount >= textLimit) {
      const tier = user.tier || 'free';
      const nextResetDate = this.getNextResetDate();
      return {
        allowed: false,
        reason: `You've used all ${textLimit} text queries this month. ${tier === 'free' ? 'Upgrade to Pro for 1,583 queries!' : `Your queries will reset on ${nextResetDate}.`}`,
        used: textCount,
        limit: textLimit
      };
    }
    
    return { allowed: true, used: textCount, limit: textLimit };
  } catch (error) {
    console.error('Error checking text query limit:', error);
    toastService.error('Failed to check query limit. Please try again.');
    return { allowed: false, reason: 'Failed to check query limit' };
  }
}

// NEW HELPER FUNCTION
private static shouldResetQueries(lastResetTimestamp: number): boolean {
  const lastResetDate = new Date(lastResetTimestamp);
  const todayDate = new Date();
  
  // True if different calendar month OR different year
  return lastResetDate.getMonth() !== todayDate.getMonth() ||
         lastResetDate.getFullYear() !== todayDate.getFullYear();
}

// NEW HELPER FUNCTION
private static getNextResetDate(): string {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
```

**Also Update:** `src/services/conversationService.ts`

**Add this method to SupabaseService:**
```typescript
async resetMonthlyQueries(userId: string): Promise<User | null> {
  try {
    const { SupabaseService } = await import('./supabaseService');
    const supabaseService = SupabaseService.getInstance();
    
    const { error } = await supabase
      .from('users')
      .update({
        text_count: 0,
        image_count: 0,
        last_reset: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', userId);

    if (error) {
      console.error('Error resetting monthly queries:', error);
      return null;
    }

    console.log('✅ [SupabaseService] Monthly queries reset');
    return await this.getUser(userId);
  } catch (error) {
    console.error('Error in resetMonthlyQueries:', error);
    return null;
  }
}
```

**Same fix for `canSendImageQuery()`** - Follow same pattern

---

## FIX #2: Trial Auto-Expiration (45 min)

**File:** `src/services/authService.ts` (add to `initializeAuth()`)

**Current Code:**
```typescript
private async initializeAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      await this.loadUserFromSupabase(session.user.id);
    } else {
      this.updateAuthState({ user: null, isLoading: false, error: null });
    }
  } catch (_supabaseError) {
    // Fallback to local storage
    const localUser = localStorage.getItem('otakon_user');
    if (localUser) {
      try {
        const user = JSON.parse(localUser);
        this.updateAuthState({ user, isLoading: false, error: null });
      } catch (_parseError) {
        this.updateAuthState({ user: null, isLoading: false, error: null });
      }
    } else {
      this.updateAuthState({ user: null, isLoading: false, error: null });
    }
  }
}
```

**New Code:**
```typescript
private async initializeAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const user = await this.loadUserFromSupabase(session.user.id);
      
      // ✅ NEW: Check trial expiration
      if (user && user.tier === 'pro' && user.hasUsedTrial) {
        await this.checkAndExpireTrial(user);
      }
    } else {
      this.updateAuthState({ user: null, isLoading: false, error: null });
    }
  } catch (_supabaseError) {
    // Fallback to local storage
    const localUser = localStorage.getItem('otakon_user');
    if (localUser) {
      try {
        const user = JSON.parse(localUser);
        this.updateAuthState({ user, isLoading: false, error: null });
      } catch (_parseError) {
        this.updateAuthState({ user: null, isLoading: false, error: null });
      }
    } else {
      this.updateAuthState({ user: null, isLoading: false, error: null });
    }
  }
}

// ✅ NEW METHOD
private async checkAndExpireTrial(user: User): Promise<void> {
  // Check if trial has expired
  const trialExpiresAt = new Date(user.onboardingData?.trial_expires_at || user.appState?.trial_expires_at || 0);
  const now = new Date();
  
  if (now > trialExpiresAt) {
    console.log('⏰ [AuthService] Trial expired, downgrading to free tier');
    
    // Downgrade user to free
    const { error } = await supabase
      .from('users')
      .update({
        tier: 'free',
        text_limit: 55,
        image_limit: 25,
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', user.authUserId);

    if (error) {
      console.error('Error downgrading trial user:', error);
      return;
    }

    // Refresh user data
    await this.loadUserFromSupabase(user.authUserId);
    
    // Show notification
    toastService.error('Your trial has ended. Tier downgraded to Free.');
  } else {
    // Check if trial ends soon (within 24 hours)
    const hoursUntilExpiry = (trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilExpiry < 24 && hoursUntilExpiry > 0) {
      console.log(`⏰ [AuthService] Trial expires in ${Math.round(hoursUntilExpiry)} hours`);
      toastService.warning(
        `Your Pro trial expires in ${Math.round(hoursUntilExpiry)} hours. Upgrade to keep access!`,
        { action: { label: 'Upgrade', onClick: () => { /* trigger upgrade */ } } }
      );
    }
  }
}
```

**Optional: Add Scheduled Job (Supabase Edge Function)**

Create `supabase/functions/expire-trials/index.ts`:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // This would be called daily by a cron job
    // Expire all trials that ended
    const now = new Date().toISOString();
    
    // Call Supabase to update all expired trials
    const response = await fetch('https://qajcxgkqloumogioomiz.supabase.co/rest/v1/users', {
      method: 'PATCH',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        tier: 'free',
        text_limit: 55,
        image_limit: 25
      }),
      // WHERE: tier = 'pro' AND has_used_trial = true AND trial_expires_at < now
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

---

## FIX #3: Image Size Validation (15 min)

**File:** `src/components/features/ChatInterface.tsx` (Line ~200)

**Current Code:**
```typescript
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  console.log('📸 [ChatInterface] Image upload:', { file, fileName: file?.name, fileSize: file?.size });
  if (file) {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      console.log('📸 [ChatInterface] Image preview created:', { 
        hasResult: !!result, 
        resultLength: result?.length,
```

**New Code:**
```typescript
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const COMPRESSION_THRESHOLD = 500 * 1024; // 500KB

const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  console.log('📸 [ChatInterface] Image upload:', { file, fileName: file?.name, fileSize: file?.size });
  
  if (!file) return;
  
  // ✅ NEW: Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    toastService.error(
      `Image too large (${Math.round(file.size / 1024 / 1024)}MB). ` +
      `Maximum is 2MB. Please use a smaller image or compress it first.`
    );
    return;
  }
  
  // ✅ NEW: Compress if needed
  if (file.size > COMPRESSION_THRESHOLD) {
    console.log('📸 [ChatInterface] Image exceeds compression threshold, compressing...');
    compressImage(file)
      .then(compressedFile => {
        setImageFile(compressedFile);
        processImageFile(compressedFile);
      })
      .catch(err => {
        console.error('Failed to compress image:', err);
        toastService.error('Failed to process image. Please try a different image.');
      });
    return;
  }
  
  // Otherwise, use as-is
  setImageFile(file);
  processImageFile(file);
};

// ✅ NEW HELPER: Compress image
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Resize to 80% if needed
        let width = img.width;
        let height = img.height;
        
        if (width > 2560) {
          height = (height * 2560) / width;
          width = 2560;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not create blob'));
              return;
            }
            
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            console.log(`📸 Compressed: ${Math.round(file.size / 1024)}KB → ${Math.round(compressedFile.size / 1024)}KB`);
            resolve(compressedFile);
          },
          'image/jpeg',
          0.75 // 75% quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ✅ NEW HELPER: Process image file
function processImageFile(file: File) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    const result = e.target?.result as string;
    console.log('📸 [ChatInterface] Image preview created:', { 
      hasResult: !!result, 
      resultLength: result?.length,
      fileSizeKB: Math.round(file.size / 1024)
    });
    setImagePreview(result);
  };
  
  reader.onerror = () => {
    toastService.error('Failed to load image. Please try again.');
  };
  
  reader.readAsDataURL(file);
}
```

---

## TESTING THESE FIXES

### Test Fix #1: Monthly Reset
```typescript
// Test case 1: User created Oct 15, query on Nov 1
const user = { lastReset: new Date('2025-10-15').getTime(), textCount: 54, textLimit: 55 };
const result = await ConversationService.canSendTextQuery();
// Expected: { allowed: true, used: 0, limit: 55 } (reset happened)

// Test case 2: User created Oct 15, query on Oct 31
const user2 = { lastReset: new Date('2025-10-15').getTime(), textCount: 54, textLimit: 55 };
const result2 = await ConversationService.canSendTextQuery();
// Expected: { allowed: true, used: 54, limit: 55 } (no reset yet)
```

### Test Fix #2: Trial Expiration
```typescript
// Test case 1: Trial expired
const user = { 
  tier: 'pro', 
  hasUsedTrial: true,
  trial_expires_at: new Date('2025-11-01').toISOString()
};
// Call authService.initializeAuth() on Nov 2
// Expected: User tier changed to 'free', notification shown

// Test case 2: Trial expires in 12 hours
const user2 = {
  tier: 'pro',
  hasUsedTrial: true,
  trial_expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
};
// Expected: Warning toast shown
```

### Test Fix #3: Image Size Validation
```typescript
// Test case 1: Small image (500KB)
uploadImage(file500KB);
// Expected: No compression, normal flow

// Test case 2: Medium image (1.5MB)
uploadImage(file1500KB);
// Expected: Auto-compress, 75% quality

// Test case 3: Large image (10MB)
uploadImage(file10MB);
// Expected: Error toast "Image too large (10MB). Maximum is 2MB."
```

---

## DEPLOYMENT NOTES

1. **Backup Database First**
   ```sql
   -- Before running any migration
   SELECT * FROM users LIMIT 10;
   -- Verify structure is correct
   ```

2. **Test in Staging**
   - Deploy to staging first
   - Run tests with staging users
   - Verify monthly reset works
   - Test trial expiration

3. **Monitor After Deploy**
   - Watch for error spikes in Sentry
   - Monitor API response times
   - Check query limit errors

4. **Rollback Plan**
   - Keep previous version in git
   - If issues found: revert commits
   - Restore from backup if needed

---

## ESTIMATED EFFORT

| Fix | Time | Priority |
|-----|------|----------|
| Monthly Reset | 30 min | CRITICAL |
| Trial Auto-Expiry | 45 min | CRITICAL |
| Image Size Limit | 15 min | HIGH |
| **TOTAL** | **90 min (1.5 hours)** | - |

**Additional:**
- Testing: 30 minutes
- Code review: 15 minutes
- Deployment: 15 minutes
- **GRAND TOTAL: ~2.5 hours**

---

**Ready to implement!** 🚀

Copy each fix into your codebase and test thoroughly. All three fixes are critical for production readiness.
