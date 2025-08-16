import React, { useState, useEffect } from 'react';
import { 
  UserPreferences, 
  GameGenre, 
  HintStyle, 
  DetailLevel, 
  SpoilerSensitivity, 
  AIPersonality, 
  ResponseFormat, 
  SkillLevel,
  userPreferencesService 
} from '../services/userPreferencesService';

interface UserPreferencesTabProps {
  onPreferencesUpdated?: () => void;
}

const UserPreferencesTab: React.FC<UserPreferencesTabProps> = ({ onPreferencesUpdated }) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const prefs = await userPreferencesService.getUserPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;
    
    try {
      setIsSaving(true);
      setSaveMessage('');
      
      const success = await userPreferencesService.updatePreferences(preferences);
      
      if (success) {
        setSaveMessage('Preferences saved successfully!');
        onPreferencesUpdated?.();
        
        // Clear message after 3 seconds
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveMessage('Error saving preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    if (!preferences) return;
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);
  };

  const updateGamingPattern = <K extends keyof UserPreferences['gaming_patterns']>(
    key: K, 
    value: UserPreferences['gaming_patterns'][K]
  ) => {
    if (!preferences) return;
    setPreferences(prev => prev ? {
      ...prev,
      gaming_patterns: {
        ...prev.gaming_patterns,
        [key]: value
      }
    } : null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53A3A]"></div>
        <span className="ml-3 text-neutral-400">Loading preferences...</span>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="p-8 text-center">
        <p className="text-neutral-400">Failed to load preferences. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">AI Personalization</h2>
        <p className="text-neutral-400">Customize how Otakon AI interacts with you based on your gaming preferences.</p>
      </div>

      {/* Game Genre & Skill Level */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white border-b border-neutral-700 pb-2">Game Preferences</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Primary Game Genre</label>
            <select
              value={preferences.game_genre}
              onChange={(e) => updatePreference('game_genre', e.target.value as GameGenre)}
              className="w-full bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FFAB40]"
            >
              <option value="rpg">RPG (Role-Playing Games)</option>
              <option value="fps">FPS (First-Person Shooter)</option>
              <option value="strategy">Strategy</option>
              <option value="adventure">Adventure</option>
              <option value="puzzle">Puzzle</option>
              <option value="simulation">Simulation</option>
              <option value="sports">Sports</option>
              <option value="racing">Racing</option>
              <option value="fighting">Fighting</option>
              <option value="mmo">MMO (Massively Multiplayer)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Skill Level</label>
            <select
              value={preferences.skill_level}
              onChange={(e) => updatePreference('skill_level', e.target.value as SkillLevel)}
              className="w-full bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FFAB40]"
            >
              <option value="beginner">Beginner</option>
              <option value="casual">Casual</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>
      </div>

      {/* AI Response Preferences */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white border-b border-neutral-700 pb-2">AI Response Style</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Hint Style</label>
            <select
              value={preferences.hint_style}
              onChange={(e) => updatePreference('hint_style', e.target.value as HintStyle)}
              className="w-full bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FFAB40]"
            >
              <option value="direct">Direct - Straight to the point</option>
              <option value="subtle">Subtle - Gentle nudges</option>
              <option value="progressive">Progressive - Build up hints gradually</option>
              <option value="socratic">Socratic - Ask leading questions</option>
              <option value="story-based">Story-based - Wrap hints in narrative</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Detail Level</label>
            <select
              value={preferences.detail_level}
              onChange={(e) => updatePreference('detail_level', e.target.value as DetailLevel)}
              className="w-full bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FFAB40]"
            >
              <option value="minimal">Minimal - Just the essentials</option>
              <option value="concise">Concise - Brief but complete</option>
              <option value="detailed">Detailed - Comprehensive explanations</option>
              <option value="comprehensive">Comprehensive - In-depth analysis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">AI Personality</label>
            <select
              value={preferences.ai_personality}
              onChange={(e) => updatePreference('ai_personality', e.target.value as AIPersonality)}
              className="w-full bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FFAB40]"
            >
              <option value="casual">Casual - Friendly and relaxed</option>
              <option value="formal">Formal - Professional and structured</option>
              <option value="humorous">Humorous - Fun and entertaining</option>
              <option value="mysterious">Mysterious - Intriguing and enigmatic</option>
              <option value="encouraging">Encouraging - Supportive and motivating</option>
              <option value="analytical">Analytical - Logical and systematic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Response Format</label>
            <select
              value={preferences.preferred_response_format}
              onChange={(e) => updatePreference('preferred_response_format', e.target.value as ResponseFormat)}
              className="w-full bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FFAB40]"
            >
              <option value="text_only">Text Only - Plain text responses</option>
              <option value="text_with_bullets">Bullet Points - Organized lists</option>
              <option value="step_by_step">Step by Step - Sequential instructions</option>
              <option value="story_narrative">Story Narrative - Engaging storytelling</option>
              <option value="technical">Technical - Detailed technical analysis</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spoiler Sensitivity */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white border-b border-neutral-700 pb-2">Spoiler Protection</h3>
        
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-2">Spoiler Sensitivity</label>
          <select
            value={preferences.spoiler_sensitivity}
            onChange={(e) => updatePreference('spoiler_sensitivity', e.target.value as SpoilerSensitivity)}
            className="w-full bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FFAB40]"
          >
            <option value="very_sensitive">Very Sensitive - No plot details at all</option>
            <option value="sensitive">Sensitive - Minimal plot information</option>
            <option value="moderate">Moderate - Some plot context allowed</option>
            <option value="low">Low - Most plot details acceptable</option>
            <option value="none">None - Full plot discussion allowed</option>
          </select>
          <p className="text-xs text-neutral-500 mt-1">
            This controls how carefully the AI avoids revealing game story elements.
          </p>
        </div>
      </div>

      {/* Gaming Patterns */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white border-b border-neutral-700 pb-2">Gaming Patterns</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Preferred Play Time</label>
            <div className="space-y-2">
              {['morning', 'afternoon', 'evening', 'weekends', 'weekdays'].map(time => (
                <label key={time} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.gaming_patterns.preferred_play_time.includes(time)}
                    onChange={(e) => {
                      const current = preferences.gaming_patterns.preferred_play_time;
                      const updated = e.target.checked
                        ? [...current, time]
                        : current.filter(t => t !== time);
                      updateGamingPattern('preferred_play_time', updated);
                    }}
                    className="mr-2 text-[#FFAB40] bg-[#2E2E2E] border-[#424242] rounded focus:ring-[#FFAB40]"
                  />
                  <span className="text-[#F5F5F5] capitalize">{time}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Session Duration</label>
              <select
                value={preferences.gaming_patterns.session_duration}
                onChange={(e) => updateGamingPattern('session_duration', e.target.value as any)}
                className="w-full bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FFAB40]"
              >
                <option value="short">Short (15-30 minutes)</option>
                <option value="medium">Medium (1-2 hours)</option>
                <option value="long">Long (3+ hours)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Play Frequency</label>
              <select
                value={preferences.gaming_patterns.frequency}
                onChange={(e) => updateGamingPattern('frequency', e.target.value as any)}
                className="w-full bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FFAB40]"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="occasional">Occasional</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Gaming Preferences</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.gaming_patterns.multiplayer_preference}
                  onChange={(e) => updateGamingPattern('multiplayer_preference', e.target.checked)}
                  className="mr-2 text-[#FFAB40] bg-[#2E2E2E] border-[#424242] rounded focus:ring-[#FFAB40]"
                />
                <span className="text-[#F5F5F5]">Prefer multiplayer games</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.gaming_patterns.completionist_tendency}
                  onChange={(e) => updateGamingPattern('completionist_tendency', e.target.checked)}
                  className="mr-2 text-[#FFAB40] bg-[#2E2E2E] border-[#424242] rounded focus:ring-[#FFAB40]"
                />
                <span className="text-[#F5F5F5]">Completionist (100% games)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button & Message */}
      <div className="pt-6 border-t border-neutral-700">
        <div className="flex items-center justify-between">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-8 rounded-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Preferences'
            )}
          </button>
          
          {saveMessage && (
            <div className={`text-sm ${saveMessage.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
              {saveMessage}
            </div>
          )}
        </div>
        
        <p className="text-xs text-neutral-500 mt-3">
          These preferences help Otakon AI provide personalized assistance tailored to your gaming style and preferences.
        </p>
      </div>
    </div>
  );
};

export default UserPreferencesTab;
