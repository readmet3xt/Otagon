/**
 * Service for providing genre-specific character tones and immersion elements
 */
class CharacterImmersionService {
  private genreTones: Record<string, string> = {
    'Action RPG': 'epic and heroic',
    'FPS': 'intense and tactical',
    'Strategy': 'analytical and strategic',
    'Puzzle': 'thoughtful and methodical',
    'Horror': 'dark and mysterious',
    'RPG': 'adventurous and immersive',
    'Souls-like': 'dark and challenging',
    'Platformer': 'upbeat and energetic',
    'Racing': 'fast-paced and competitive',
    'Fighting': 'intense and competitive',
    'Adventure': 'exploratory and curious',
    'Simulation': 'detailed and realistic',
    'Sports': 'competitive and energetic',
    'Default': 'helpful and engaging'
  };

  /**
   * Get the appropriate tone for a game genre
   */
  public getGameTone(genre: string): string {
    return this.genreTones[genre] || this.genreTones['Default'];
  }

  /**
   * Get genre-specific personality traits
   */
  public getPersonalityTraits(genre: string): string[] {
    const traits: Record<string, string[]> = {
      'Action RPG': ['heroic', 'determined', 'wise'],
      'FPS': ['tactical', 'precise', 'focused'],
      'Strategy': ['analytical', 'patient', 'strategic'],
      'Puzzle': ['logical', 'patient', 'methodical'],
      'Horror': ['cautious', 'mysterious', 'protective'],
      'RPG': ['adventurous', 'curious', 'supportive'],
      'Souls-like': ['resilient', 'determined', 'wise'],
      'Platformer': ['energetic', 'optimistic', 'encouraging'],
      'Racing': ['competitive', 'fast-paced', 'exciting'],
      'Fighting': ['intense', 'confident', 'focused'],
      'Adventure': ['exploratory', 'curious', 'inspiring'],
      'Simulation': ['detailed', 'realistic', 'helpful'],
      'Sports': ['competitive', 'energetic', 'motivating'],
      'Default': ['helpful', 'friendly', 'knowledgeable']
    };

    return traits[genre] || traits['Default'];
  }

  /**
   * Get genre-specific response style
   */
  public getResponseStyle(genre: string): string {
    const styles: Record<string, string> = {
      'Action RPG': 'Use epic language and heroic metaphors. Reference quests and adventures.',
      'FPS': 'Use tactical terminology and military-style communication.',
      'Strategy': 'Use analytical language and strategic thinking patterns.',
      'Puzzle': 'Use logical reasoning and step-by-step explanations.',
      'Horror': 'Use atmospheric language and build tension appropriately.',
      'RPG': 'Use immersive language that draws the player into the world.',
      'Souls-like': 'Use challenging but encouraging language that respects the difficulty.',
      'Platformer': 'Use energetic and encouraging language.',
      'Racing': 'Use fast-paced and competitive language.',
      'Fighting': 'Use intense and confident language.',
      'Adventure': 'Use exploratory and curious language.',
      'Simulation': 'Use detailed and realistic language.',
      'Sports': 'Use competitive and energetic language.',
      'Default': 'Use helpful and engaging language.'
    };

    return styles[genre] || styles['Default'];
  }
}

export const characterImmersionService = new CharacterImmersionService();
