import { supabase } from './supabase';

export interface UserPreferences {
  id?: string;
  user_id: string;
  game_genre: GameGenre;
  hint_style: HintStyle;
  detail_level: DetailLevel;
  spoiler_sensitivity: SpoilerSensitivity;
  ai_personality: AIPersonality;
  preferred_response_format: ResponseFormat;
  gaming_patterns: GamingPatterns;
  skill_level: SkillLevel;
  created_at?: string;
  updated_at?: string;
}

export type GameGenre = 
  | 'rpg' | 'fps' | 'strategy' | 'adventure' | 'puzzle' 
  | 'simulation' | 'sports' | 'racing' | 'fighting' | 'mmo';

export type HintStyle = 
  | 'direct' | 'subtle' | 'progressive' | 'socratic' | 'story-based';

export type DetailLevel = 
  | 'minimal' | 'concise' | 'detailed' | 'comprehensive';

export type SpoilerSensitivity = 
  | 'very_sensitive' | 'sensitive' | 'moderate' | 'low' | 'none';

export type AIPersonality = 
  | 'casual' | 'formal' | 'humorous' | 'mysterious' | 'encouraging' | 'analytical';

export type ResponseFormat = 
  | 'text_only' | 'text_with_bullets' | 'step_by_step' | 'story_narrative' | 'technical';

export interface GamingPatterns {
  preferred_play_time: string[]; // ['morning', 'evening', 'weekends']
  session_duration: 'short' | 'medium' | 'long';
  frequency: 'daily' | 'weekly' | 'occasional';
  multiplayer_preference: boolean;
  completionist_tendency: boolean;
}

export type SkillLevel = 
  | 'beginner' | 'casual' | 'intermediate' | 'advanced' | 'expert';

class UserPreferencesService {
  private cache: Map<string, UserPreferences> = new Map();

  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check cache first
      if (this.cache.has(user.id)) {
        return this.cache.get(user.id)!;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, create default ones
          return this.createDefaultPreferences(user.id);
        }
        throw error;
      }

      // Cache the result
      this.cache.set(user.id, data);
      return data;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  async updatePreferences(updates: Partial<UserPreferences>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update cache
      const current = this.cache.get(user.id);
      if (current) {
        this.cache.set(user.id, { ...current, ...updates });
      }

      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  }

  private async createDefaultPreferences(userId: string): Promise<UserPreferences> {
    const defaultPrefs: UserPreferences = {
      user_id: userId,
      game_genre: 'rpg',
      hint_style: 'progressive',
      detail_level: 'concise',
      spoiler_sensitivity: 'moderate',
      ai_personality: 'encouraging',
      preferred_response_format: 'text_with_bullets',
      gaming_patterns: {
        preferred_play_time: ['evening', 'weekends'],
        session_duration: 'medium',
        frequency: 'weekly',
        multiplayer_preference: false,
        completionist_tendency: true
      },
      skill_level: 'intermediate'
    };

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .insert(defaultPrefs)
        .select()
        .single();

      if (error) throw error;

      // Cache the result
      this.cache.set(userId, data);
      return data;
    } catch (error) {
      console.error('Error creating default preferences:', error);
      return defaultPrefs;
    }
  }

  async getGameSpecificContext(gameGenre: GameGenre): Promise<string> {
    const genreContexts: Record<GameGenre, string> = {
      rpg: 'RPG games focus on character development, story progression, and strategic combat. I provide detailed lore explanations, character building advice, and quest guidance.',
      fps: 'FPS games emphasize quick reflexes, map knowledge, and weapon mastery. I offer tactical positioning tips, weapon loadout advice, and map strategy.',
      strategy: 'Strategy games require long-term planning, resource management, and tactical thinking. I provide strategic overviews, build order advice, and counter-strategies.',
      adventure: 'Adventure games focus on exploration, puzzle-solving, and story discovery. I offer exploration hints, puzzle solutions, and narrative guidance.',
      puzzle: 'Puzzle games challenge logical thinking and pattern recognition. I provide step-by-step solutions, pattern explanations, and logical reasoning.',
      simulation: 'Simulation games model real-world systems and require understanding of complex mechanics. I explain game systems, provide optimization tips, and clarify mechanics.',
      sports: 'Sports games require understanding of rules, strategies, and player management. I offer strategy advice, rule explanations, and team building tips.',
      racing: 'Racing games focus on vehicle control, track knowledge, and racing lines. I provide driving tips, track guides, and vehicle setup advice.',
      fighting: 'Fighting games require frame data knowledge, combo execution, and matchup understanding. I offer combo guides, matchup advice, and frame data explanations.',
      mmo: 'MMO games involve social interaction, group coordination, and long-term progression. I provide group strategy advice, progression guides, and social tips.'
    };

    return genreContexts[gameGenre] || genreContexts.rpg;
  }

  async getPersonalizedAIInstructions(): Promise<string> {
    const prefs = await this.getUserPreferences();
    if (!prefs) return '';

    const instructions = [
      `**User Preferences:**`,
      `- Game Genre: ${prefs.game_genre.toUpperCase()}`,
      `- Hint Style: ${prefs.hint_style.replace('_', ' ')}`,
      `- Detail Level: ${prefs.detail_level}`,
      `- Spoiler Sensitivity: ${prefs.spoiler_sensitivity.replace('_', ' ')}`,
      `- AI Personality: ${prefs.ai_personality}`,
      `- Response Format: ${prefs.preferred_response_format.replace('_', ' ')}`,
      `- Skill Level: ${prefs.skill_level}`,
      `- Gaming Patterns: ${prefs.gaming_patterns.session_duration} sessions, ${prefs.gaming_patterns.frequency} play`,
      ``,
      `**Adaptation Instructions:**`,
      `- Adjust response detail based on user's detail level preference`,
      `- Use the specified hint style (${prefs.hint_style})`,
      `- Maintain spoiler sensitivity level: ${prefs.spoiler_sensitivity}`,
      `- Match the ${prefs.ai_personality} personality style`,
      `- Format responses according to ${prefs.preferred_response_format} preference`,
      `- Consider user's ${prefs.skill_level} skill level`,
      `- Adapt to ${prefs.gaming_patterns.session_duration} session preferences`
    ];

    return instructions.join('\n');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const userPreferencesService = new UserPreferencesService();
