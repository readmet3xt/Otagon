import { enhancedInsightService } from './enhancedInsightService';
import { playerProfileService } from './playerProfileService';
import { generateInsightWithSearch } from './geminiService';
import { PlayerProfile, GameContext, EnhancedInsightTab } from './types';

/**
 * 🚨 API COST OPTIMIZATION STRATEGY:
 * 
 * 1. NO AUTOMATIC API CALLS - Only when user explicitly requests help
 * 2. FREE USERS: Always use Gemini 2.5 Flash for all queries
 * 3. PAID USERS: 
 *    - Gemini 2.5 Flash for regular queries (text, image, image+text)
 *    - Gemini 2.5 Pro ONLY ONCE when new game pill is created for insights
 *    - After that, always use Flash for updates and follow-up queries
 * 
 * This ensures maximum cost efficiency while maintaining quality for paid users
 */
export interface ProfileAwareInsightResult {
    tabId: string;
    title: string;
    content: string;
    priority: 'high' | 'medium' | 'low';
    isProfileSpecific: boolean;
    generationModel: 'flash' | 'pro';
    lastUpdated: number;
}

class ProfileAwareInsightService {
    private static instance: ProfileAwareInsightService;
    
    private constructor() {}
    
    static getInstance(): ProfileAwareInsightService {
        if (!ProfileAwareInsightService.instance) {
            ProfileAwareInsightService.instance = new ProfileAwareInsightService();
        }
        return ProfileAwareInsightService.instance;
    }

    /**
     * Generate insights for a NEW GAME PILL (ONLY when explicitly requested by user)
     * This is the ONLY time we use Gemini 2.5 Pro for paid users
     */
    async generateInsightsForNewGamePill(
        gameName: string, 
        genre: string, 
        progress: number, 
        userTier: 'free' | 'paid',
        profile: Promise<PlayerProfile>,
        gameContext?: GameContext,
        onError?: (message: string) => void
    ): Promise<ProfileAwareInsightResult[]> {
        try {
            // Await the profile
            const resolvedProfile = await profile;

            // Generate tabs based on user tier
            const tabs = enhancedInsightService.generateProfileAwareTabsForNewGame(
                genre, 
                resolvedProfile, 
                gameContext || playerProfileService.getDefaultGameContext(),
                userTier
            );

            // For free users, return basic content without API calls
            if (userTier === 'free') {
                return tabs.map(tab => ({
                    tabId: tab.id,
                    title: tab.title,
                    content: tab.content || 'Content will be generated when you ask for help.',
                    priority: tab.priority,
                    isProfileSpecific: tab.isProfileSpecific,
                    generationModel: 'flash' as const,
                    lastUpdated: Date.now()
                }));
            }

            // For NEW GAME PILLS: Use Pro model ONCE for paid users, Flash for others and subsequent tabs
            const results: ProfileAwareInsightResult[] = [];
            let proCallUsed = false;

            // Persistent one-time Pro guard per game (best-effort): localStorage + Supabase app cache
            try {
                const guardKey = `pro_call_guard_${gameName.toLowerCase()}`;
                // LocalStorage check
                const ls = localStorage.getItem(guardKey);
                if (ls) {
                    proCallUsed = true;
                } else {
                    // Supabase app cache check
                    const { supabaseDataService } = require('./supabaseDataService');
                    const existing = await supabaseDataService.getAppCache(guardKey);
                    if (existing?.cacheData?.used === true) {
                        proCallUsed = true;
                    }
                }
            } catch (_) { /* ignore */ }

            for (const tab of tabs) {
                if (tab.isNewGamePill) {
                    try {
                        let content: string;
                        
                        if (userTier === 'paid' && !proCallUsed) {
                            // PAID USERS: Use Pro model ONCE for new game pill insights
                            console.log(`💰 Using Gemini 2.5 Pro for new game pill insight: ${tab.title}`);
                            if (!gameContext) {
                                onError?.(`Game context not found for ${gameName}`);
                                continue;
                            }
                            content = await this.generateContentWithProModel(
                                tab, 
                                gameName, 
                                genre, 
                                progress, 
                                resolvedProfile, 
                                gameContext
                            );
                            proCallUsed = true;

                            // Log cost usage and set persistent guard
                            try {
                                const { apiCostService } = require('./apiCostService');
                                await apiCostService.recordAPICall(
                                    'pro',
                                    'insight_update',
                                    'paid',
                                    2000,
                                    true,
                                    undefined,
                                    undefined,
                                    gameName,
                                    genre,
                                    progress,
                                    { reason: 'one_time_pro_new_game_pill' }
                                );
                            } catch {}
                            try {
                                const guardKey = `pro_call_guard_${gameName.toLowerCase()}`;
                                // Set localStorage immediately
                                localStorage.setItem(guardKey, JSON.stringify({ used: true, timestamp: Date.now() }));
                                // Also set Supabase app cache (1 year)
                                const { supabaseDataService } = require('./supabaseDataService');
                                const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
                                await supabaseDataService.setAppCache(guardKey, { used: true, timestamp: Date.now() }, expiresAt);
                            } catch {}
                        } else {
                            // FREE USERS: Use Flash model for new game pill insights
                            console.log(`🆓 Using Gemini 2.5 Flash for new game pill insight: ${tab.title}`);
                            if (!gameContext) {
                                onError?.(`Game context not found for ${gameName}`);
                                continue;
                            }
                            content = await this.generateContentWithFlashModel(
                                tab, 
                                gameName, 
                                genre, 
                                progress, 
                                resolvedProfile, 
                                gameContext
                            );
                        }
                        
                        results.push({
                            tabId: tab.id,
                            title: tab.title,
                            content: content,
                            priority: tab.priority,
                            isProfileSpecific: tab.isProfileSpecific,
                            generationModel: (userTier === 'paid' && proCallUsed) ? 'pro' : 'flash',
                            lastUpdated: Date.now()
                        });
                    } catch (error) {
                        console.error(`Error generating content for tab ${tab.id}:`, error);
                        onError?.(`Failed to generate content for ${tab.title}`);
                        
                        // Fallback to basic content
                        results.push({
                            tabId: tab.id,
                            title: tab.title,
                            content: `Content generation failed. Ask me about ${tab.title} for personalized help.`,
                            priority: tab.priority,
                            isProfileSpecific: tab.isProfileSpecific,
                            generationModel: 'flash',
                            lastUpdated: Date.now()
                        });
                    }
                }
            }

            return results;
            
        } catch (error) {
            console.error('Error generating insights for new game pill:', error);
            onError?.(`Failed to generate game insights`);
            return [];
        }
    }

    /**
     * Update existing insights when user makes explicit queries
     * Always uses Gemini 2.5 Flash for cost optimization
     * Uses context from previous Pro calls for better continuity
     * Intelligently updates multiple relevant tabs based on AI response context
     */
    async updateInsightsForUserQuery(
        gameName: string, 
        genre: string, 
        progress: number, 
        conversationId: string,
        existingTabs: EnhancedInsightTab[],
        userTier: 'free' | 'paid',
        profile: Promise<PlayerProfile>,
        onError: (error: string) => void,
        existingInsights?: Record<string, any>, // Add existing insights for context
        aiResponseContext?: string // Add AI response context to determine relevant tabs
    ): Promise<ProfileAwareInsightResult[]> {
        try {
            // Only update if user explicitly requested it
            if (!existingTabs || existingTabs.length === 0) {
                return [];
            }

            // Await the profile
            const resolvedProfile = await profile;
            if (!resolvedProfile) {
                onError('Player profile not found');
                return [];
            }

            // Intelligently determine which tabs need updates based on AI response context
            const relevantTabs = this.determineRelevantTabsForUpdate(existingTabs, aiResponseContext);
            
            // Mark tabs for Flash model updates
            const updatedTabs = enhancedInsightService.updateExistingTabs(relevantTabs, userTier);
            
            const results: ProfileAwareInsightResult[] = [];
            
            for (const tab of updatedTabs) {
                try {
                    // ALWAYS use Flash model for updates (cost optimization for ALL users)
                    console.log(`🔄 Using Gemini 2.5 Flash for insight update: ${tab.title}`);
                    const content = await this.generateContentWithFlashModel(
                        tab, 
                        gameName, 
                        genre, 
                        progress, 
                        resolvedProfile, 
                        await playerProfileService.getGameContext(gameName),
                        existingInsights // Pass existing insights for context
                    );
                    
                    results.push({
                        tabId: tab.id,
                        title: tab.title,
                        content: content,
                        priority: tab.priority,
                        isProfileSpecific: tab.isProfileSpecific,
                        generationModel: 'flash',
                        lastUpdated: Date.now()
                    });
                } catch (error) {
                    console.error(`Error updating content for tab ${tab.id}:`, error);
                    onError(`Failed to update ${tab.title}`);
                    
                    // Keep existing content if update fails
                    if (tab.content) {
                        results.push({
                            tabId: tab.id,
                            title: tab.title,
                            content: tab.content,
                            priority: tab.priority,
                            isProfileSpecific: tab.isProfileSpecific,
                            generationModel: 'flash',
                            lastUpdated: tab.lastUpdated || Date.now()
                        });
                    }
                }
            }

        return results;
        
    } catch (error) {
        console.error('Error updating insights for user query:', error);
        onError('Failed to update insights');
        return [];
    }
}

    /**
     * Intelligently determine which tabs need updates based on AI response context
     */
    private determineRelevantTabsForUpdate(
        existingTabs: EnhancedInsightTab[],
        aiResponseContext?: string
    ): EnhancedInsightTab[] {
        if (!aiResponseContext) {
            // If no context provided, update all tabs
            return existingTabs;
        }

        const context = aiResponseContext.toLowerCase();
        const relevantTabs: EnhancedInsightTab[] = [];

        // Define keyword mappings for different tab types
        const tabKeywords: Record<string, string[]> = {
            'build': ['build', 'character', 'class', 'skill', 'ability', 'stats', 'equipment', 'weapon', 'armor', 'loadout', 'setup'],
            'lore': ['lore', 'story', 'narrative', 'plot', 'character', 'history', 'background', 'world', 'universe'],
            'combat': ['combat', 'fight', 'battle', 'enemy', 'boss', 'attack', 'defense', 'strategy', 'tactics'],
            'exploration': ['explore', 'location', 'area', 'map', 'secret', 'hidden', 'discover', 'find'],
            'quest': ['quest', 'mission', 'objective', 'task', 'goal', 'complete', 'finish'],
            'item': ['item', 'loot', 'reward', 'treasure', 'collect', 'gather', 'obtain'],
            'guide': ['guide', 'help', 'tip', 'advice', 'strategy', 'how to', 'walkthrough'],
            'story_so_far': ['story', 'narrative', 'plot', 'progress', 'journey', 'adventure', 'experience']
        };

        // Check each tab against the AI response context
        for (const tab of existingTabs) {
            const tabId = tab.id.toLowerCase();
            const tabTitle = tab.title.toLowerCase();
            
            // Check if any keywords match
            let isRelevant = false;
            
            // Check tab-specific keywords
            if (tabKeywords[tabId]) {
                isRelevant = tabKeywords[tabId].some(keyword => context.includes(keyword));
            }
            
            // Check title keywords
            if (!isRelevant) {
                const titleWords = tabTitle.split(' ');
                isRelevant = titleWords.some(word => context.includes(word));
            }
            
            // Always include certain tabs if they're mentioned
            if (context.includes('build') && (tabId.includes('build') || tabId.includes('character'))) {
                isRelevant = true;
            }
            if (context.includes('lore') && (tabId.includes('lore') || tabId.includes('story'))) {
                isRelevant = true;
            }
            if (context.includes('combat') && (tabId.includes('combat') || tabId.includes('battle'))) {
                isRelevant = true;
            }
            
            if (isRelevant) {
                relevantTabs.push(tab);
            }
        }

        // If no specific tabs were identified, update all tabs
        if (relevantTabs.length === 0) {
            console.log('No specific tabs identified, updating all tabs');
            return existingTabs;
        }

        console.log(`Identified ${relevantTabs.length} relevant tabs for update:`, relevantTabs.map(t => t.title));
        return relevantTabs;
    }

    /**
     * Generate content using Gemini 2.5 Pro (only for new game pills)
     */
    private async generateContentWithProModel(
        tab: EnhancedInsightTab,
        gameName: string,
        genre: string,
        progress: number,
        profile: PlayerProfile,
        gameContext: GameContext | null
    ): Promise<string> {
        const instructions = enhancedInsightService.generateContentInstructions(tab, profile, gameContext || playerProfileService.getDefaultGameContext());
        
        // Use Gemini 2.5 Pro for new game pill content
        const prompt = `Generate detailed content for the "${tab.title}" tab in ${gameName} (${genre}).
        
${instructions}

Game: ${gameName}
Genre: ${genre}
Progress: ${progress}%
Player Focus: ${profile.playerFocus}
Hint Style: ${profile.hintStyle}
Preferred Tone: ${profile.preferredTone}
Spoiler Tolerance: ${profile.spoilerTolerance}

Generate comprehensive, engaging content that matches the player's preferences.`;

        const content = await generateInsightWithSearch(prompt, 'pro'); // Use Pro model
        return content || `Content for ${tab.title} will be generated when you ask for help.`;
    }

    /**
     * Generate content using Gemini 2.5 Flash (for updates and cost optimization)
     * Uses context from previous Pro calls for better continuity
     */
    private async generateContentWithFlashModel(
        tab: EnhancedInsightTab,
        gameName: string,
        genre: string,
        progress: number,
        profile: PlayerProfile,
        gameContext: GameContext | null,
        existingInsights?: Record<string, any>
    ): Promise<string> {
        const instructions = enhancedInsightService.generateContentInstructions(tab, profile, gameContext || playerProfileService.getDefaultGameContext());
        
        // Build context from existing insights (from previous Pro calls)
        let contextFromProCalls = '';
        if (existingInsights) {
            const relevantInsights = Object.entries(existingInsights)
                .filter(([key, insight]) => key !== tab.id && insight.content && insight.content !== 'Content will be generated when you ask for help.')
                .map(([key, insight]) => `**${insight.title}**: ${insight.content.substring(0, 200)}...`)
                .join('\n\n');
            
            if (relevantInsights) {
                contextFromProCalls = `\n\n**Context from previous insights (use this for continuity):**\n${relevantInsights}`;
            }
        }

        // Use Gemini 2.5 Flash for updates (cost optimization)
        const prompt = `Update content for the "${tab.title}" tab in ${gameName} (${genre}).

**CRITICAL CONTENT RULES (Non-negotiable):**
1. **FOCUSED UPDATES:** Generate focused, informative content that updates or adds to existing information. This is an update, not initial content, so be concise but valuable.
2. **CLEAR FORMATTING:** Structure content with clear sections and bullet points for easy reading. Keep it organized but not overwhelming.
3. **STRICT SPOILER-GATING:** All information provided MUST be relevant and accessible to a player who is ${progress}% through the game. You are strictly forbidden from mentioning, hinting at, or alluding to any characters, locations, items, or plot points that appear after this progress marker.
4. **RELEVANT UPDATES:** Focus on new information, updates, or clarifications that are relevant to the current context. Don't repeat everything from the original content.
5. **ACTIONABLE CONTENT:** Include specific, actionable advice, strategies, and information that the player can immediately use to enhance their gameplay experience.

**FORMATTING REQUIREMENTS:**
- Use clear Markdown headings (##, ###) to structure content
- Include bullet points and lists for better readability
- Content should be concise but informative (150-300 words) - this is an update, not initial content
- Write in an informative, wiki-style tone that's focused and accessible
- Focus on new or updated information relevant to the current context

${instructions}

Game: ${gameName}
Genre: ${genre}
Progress: ${progress}%
Player Focus: ${profile.playerFocus}
Hint Style: ${profile.hintStyle}
Preferred Tone: ${profile.preferredTone}
Spoiler Tolerance: ${profile.spoilerTolerance}${contextFromProCalls}

Provide updated, focused content that adds new information or updates existing details. Keep it concise (150-300 words) and focused on what's new or relevant to the current context. Use the context from previous insights to maintain continuity and build upon established information.`;

        const content = await generateInsightWithSearch(prompt, 'flash'); // Use Flash model
        return content || `Content for ${tab.title} will be updated when you ask for help.`;
    }

    /**
     * Get insight tabs for a profile (no API calls, just structure)
     */
    getInsightTabsForProfile(genre: string, profile: PlayerProfile, gameContext: GameContext): EnhancedInsightTab[] {
        const tabs = enhancedInsightService.generateProfileAwareTabsForNewGame(
            genre, 
            profile, 
            gameContext, 
            'paid' // Assume paid for structure generation
        );
        
        return enhancedInsightService.prioritizeTabsForProfile(tabs, profile);
    }

    /**
     * Check if insights need updating (only for explicit user requests)
     * 
     * CRITICAL: NO AUTOMATIC UPDATES - API calls only happen when user explicitly requests them
     */
    shouldUpdateInsights(currentProfile: PlayerProfile, currentGameContext: GameContext, lastUpdateTime: number): boolean {
        // NO AUTOMATIC UPDATES - Only update when explicitly requested by user
        // This prevents any background API calls and ensures cost optimization
        return false;
    }

    /**
     * Get the order for generating insights (only when explicitly requested)
     */
    async getInsightGenerationOrder(tabs: EnhancedInsightTab[]): Promise<string[]> {
        // Prioritize by importance and profile specificity
        const profile = await playerProfileService.getProfile() || playerProfileService.getDefaultProfile();
        const sortedTabs = enhancedInsightService.prioritizeTabsForProfile(tabs, profile);
        return sortedTabs.map(tab => tab.id);
    }

    /**
     * Check if this is a new game pill that needs Pro model generation
     */
    isNewGamePill(tabs: EnhancedInsightTab[]): boolean {
        return enhancedInsightService.needsContentGeneration(tabs);
    }

    /**
     * Get tabs that should use Pro model (only new game pills for paid users)
     */
    getTabsForProModel(tabs: EnhancedInsightTab[], userTier: 'free' | 'paid'): EnhancedInsightTab[] {
        return enhancedInsightService.getTabsForProModel(tabs, userTier);
    }

    /**
     * Get tabs that should use Flash model (updates and free users)
     */
    getTabsForFlashModel(tabs: EnhancedInsightTab[]): EnhancedInsightTab[] {
        return enhancedInsightService.getTabsForFlashModel(tabs);
    }
}

export const profileAwareInsightService = ProfileAwareInsightService.getInstance();
