// ========================================
// SECURE CONVERSATION SERVICE FIX
// Fixes 406 "Not Acceptable" error in getConversation method
// ========================================

// This file contains the updated getConversation method that handles
// the 406 error more gracefully and provides fallback mechanisms

// The fix includes:
// 1. Better error handling for 406 errors
// 2. Fallback query methods
// 3. Retry logic with different query approaches
// 4. Proper logging for debugging

export const getConversationFixed = async (conversationId: string): Promise<ConversationResult> => {
  try {
    // Check cache first
    const cached = this.getCachedData<Conversation>(conversationId);
    if (cached) {
      return {
        success: true,
        conversation: cached
      };
    }

    // Get current user directly from Supabase auth
    console.log('🔧 [SecureConversationService] Getting user from Supabase auth...');
    let { data: { user }, error: userError } = await this.getUserWithTimeout(5000);
    console.log('🔧 [SecureConversationService] Initial auth result:', { user: !!user, error: userError });
    
    if (userError || !user) {
      console.log('🔧 [SecureConversationService] User not found, retrying with delay...');
      // Add a longer delay to allow auth state to settle after OAuth callback
      await new Promise(resolve => setTimeout(resolve, 500));
      const { data: { user: retryUser }, error: retryError } = await this.getUserWithTimeout(5000);
      console.log('🔧 [SecureConversationService] Retry auth result:', { user: !!retryUser, error: retryError });
      if (retryError || !retryUser) {
        console.log('🔧 [SecureConversationService] User still not found, final retry...');
        // Try one more time with even longer delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data: { user: finalUser }, error: finalError } = await this.getUserWithTimeout(5000);
        console.log('🔧 [SecureConversationService] Final auth result:', { user: !!finalUser, error: finalError });
        if (finalError || !finalUser) {
          throw new Error('User not authenticated');
        }
        // Use the final user
        user = finalUser;
      } else {
        // Use the retry user
        user = retryUser;
      }
    }
    console.log('🔧 [SecureConversationService] User authenticated successfully:', user.id);

    // Check if developer mode
    if (localStorage.getItem('otakon_developer_mode') === 'true') {
      return this.getConversationDeveloperMode(conversationId);
    }

    // Method 1: Try the original query with better error handling
    try {
      console.log('🔧 [SecureConversationService] Attempting original query...');
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.log('🔧 [SecureConversationService] Original query failed:', error);
        
        // Check if it's a 406 error (Not Acceptable)
        if (error.message.includes('406') || error.message.includes('Cannot coerce the result to a single JSON object')) {
          console.log('🔧 [SecureConversationService] 406 error detected, trying alternative query...');
          throw new Error('406_ERROR'); // Special error to trigger fallback
        }
        
        throw new Error(`Failed to get conversation: ${error.message}`);
      }

      // Success with original query
      const conversation: Conversation = {
        id: data.id,
        title: data.title,
        messages: data.messages || [],
        insights: data.insights || [],
        context: data.context || {},
        game_id: data.game_id,
        is_pinned: data.is_pinned || false,
        version: data.version || 1,
        checksum: data.checksum || '',
        last_modified: data.last_modified || data.updated_at,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      // Cache the result
      this.setCachedData(conversationId, conversation);

      this.log('Conversation retrieved successfully', { conversationId });

      return {
        success: true,
        conversation
      };

    } catch (originalError) {
      console.log('🔧 [SecureConversationService] Original query failed, trying fallback methods...');
      
      // Method 2: Try without .single() and handle multiple results
      try {
        console.log('🔧 [SecureConversationService] Trying query without .single()...');
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error) {
          console.log('🔧 [SecureConversationService] Fallback query failed:', error);
          throw new Error(`Fallback query failed: ${error.message}`);
        }

        if (!data || data.length === 0) {
          throw new Error('Conversation not found');
        }

        // Take the first (most recent) result
        const conversationData = data[0];
        const conversation: Conversation = {
          id: conversationData.id,
          title: conversationData.title,
          messages: conversationData.messages || [],
          insights: conversationData.insights || [],
          context: conversationData.context || {},
          game_id: conversationData.game_id,
          is_pinned: conversationData.is_pinned || false,
          version: conversationData.version || 1,
          checksum: conversationData.checksum || '',
          last_modified: conversationData.last_modified || conversationData.updated_at,
          created_at: conversationData.created_at,
          updated_at: conversationData.updated_at
        };

        // Cache the result
        this.setCachedData(conversationId, conversation);

        this.log('Conversation retrieved successfully via fallback', { conversationId });

        return {
          success: true,
          conversation
        };

      } catch (fallbackError) {
        console.log('🔧 [SecureConversationService] Fallback query failed, trying database function...');
        
        // Method 3: Try using the database function
        try {
          const { data, error } = await supabase.rpc('get_conversation_safe', {
            p_conversation_id: conversationId,
            p_user_id: user.id
          });

          if (error) {
            console.log('🔧 [SecureConversationService] Database function failed:', error);
            throw new Error(`Database function failed: ${error.message}`);
          }

          if (!data || !data.success) {
            throw new Error(data?.error || 'Conversation not found');
          }

          const conversation: Conversation = {
            id: data.conversation.id,
            title: data.conversation.title,
            messages: data.conversation.messages || [],
            insights: data.conversation.insights || [],
            context: data.conversation.context || {},
            game_id: data.conversation.game_id,
            is_pinned: data.conversation.is_pinned || false,
            version: data.conversation.version || 1,
            checksum: data.conversation.checksum || '',
            last_modified: data.conversation.last_modified,
            created_at: data.conversation.created_at,
            updated_at: data.conversation.updated_at
          };

          // Cache the result
          this.setCachedData(conversationId, conversation);

          this.log('Conversation retrieved successfully via database function', { conversationId });

          return {
            success: true,
            conversation
          };

        } catch (functionError) {
          console.log('🔧 [SecureConversationService] All methods failed, returning error...');
          
          // If all methods fail, return the original error
          throw originalError;
        }
      }
    }

  } catch (error) {
    this.error('Failed to get conversation', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// ========================================
// USAGE INSTRUCTIONS
// ========================================
/*
To apply this fix to your secureConversationService.ts:

1. Replace the existing getConversation method with the getConversationFixed method above
2. Make sure to import any missing types (Conversation, ConversationResult)
3. Ensure the getUserWithTimeout method exists
4. Test the fix with the problematic conversation ID

The fix provides three fallback methods:
1. Original query with better error handling
2. Query without .single() to handle multiple results
3. Database function call as final fallback

This should resolve the 406 "Not Acceptable" error you're experiencing.
*/
