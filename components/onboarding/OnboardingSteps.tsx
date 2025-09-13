import React from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  CogIcon, 
  UserIcon, 
  SparklesIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  HeartIcon,
  StarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { EnhancedButton, EnhancedCard, CardContent } from '../ui';

// ===== WELCOME STEP =====

export const WelcomeStep: React.FC = () => (
  <div className="text-center space-y-6">
    <div className="w-20 h-20 mx-auto bg-gradient-to-r from-[#E53A3A] to-[#FFAB40] rounded-full flex items-center justify-center">
      <SparklesIcon className="w-10 h-10 text-white" />
    </div>
    
    <div>
      <h4 className="text-2xl font-bold text-[#F5F5F5] mb-3">
        Welcome to Otagon! 🎌
      </h4>
      <p className="text-[#A3A3A3] text-lg leading-relaxed">
        Your personal AI companion for all things anime, manga, and gaming. 
        Let's get you set up for the ultimate otaku experience!
      </p>
    </div>

    <EnhancedCard variant="outlined" className="text-left">
      <CardContent>
        <h5 className="font-semibold text-[#F5F5F5] mb-2">What you'll get:</h5>
        <ul className="space-y-2 text-[#A3A3A3]">
          <li className="flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-4 h-4 text-[#FFAB40]" />
            AI-powered recommendations and discussions
          </li>
          <li className="flex items-center gap-2">
            <HeartIcon className="w-4 h-4 text-[#FFAB40]" />
            Personalized content based on your preferences
          </li>
          <li className="flex items-center gap-2">
            <StarIcon className="w-4 h-4 text-[#FFAB40]" />
            Track your favorite series and discover new ones
          </li>
        </ul>
      </CardContent>
    </EnhancedCard>
  </div>
);

// ===== PROFILE SETUP STEP =====

export const ProfileSetupStep: React.FC<{ onComplete: () => void }> = ({ onComplete }) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto bg-[#2E2E2E] rounded-full flex items-center justify-center mb-4">
        <UserIcon className="w-8 h-8 text-[#FFAB40]" />
      </div>
      <h4 className="text-xl font-semibold text-[#F5F5F5] mb-2">
        Set Up Your Profile
      </h4>
      <p className="text-[#A3A3A3]">
        Tell us about your anime and gaming preferences to get personalized recommendations.
      </p>
    </div>

    <EnhancedCard variant="outlined">
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#CFCFCF] mb-2">
              Favorite Anime Genres
            </label>
            <div className="flex flex-wrap gap-2">
              {['Action', 'Romance', 'Comedy', 'Drama', 'Fantasy', 'Sci-Fi', 'Slice of Life'].map(genre => (
                <button
                  key={genre}
                  className="px-3 py-1 text-sm bg-[#2E2E2E] text-[#A3A3A3] rounded-full hover:bg-[#FFAB40] hover:text-white transition-colors"
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#CFCFCF] mb-2">
              Gaming Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {['RPG', 'Action', 'Strategy', 'Puzzle', 'Simulation', 'Sports', 'Fighting'].map(genre => (
                <button
                  key={genre}
                  className="px-3 py-1 text-sm bg-[#2E2E2E] text-[#A3A3A3] rounded-full hover:bg-[#FFAB40] hover:text-white transition-colors"
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </EnhancedCard>

    <div className="text-center">
      <EnhancedButton
        variant="primary"
        size="lg"
        onClick={onComplete}
        className="w-full"
      >
        Save Preferences
      </EnhancedButton>
    </div>
  </div>
);

// ===== FEATURES TOUR STEP =====

export const FeaturesTourStep: React.FC = () => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto bg-[#2E2E2E] rounded-full flex items-center justify-center mb-4">
        <CogIcon className="w-8 h-8 text-[#FFAB40]" />
      </div>
      <h4 className="text-xl font-semibold text-[#F5F5F5] mb-2">
        Explore Key Features
      </h4>
      <p className="text-[#A3A3A3]">
        Discover the powerful features that make Otagon your ultimate otaku companion.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <EnhancedCard variant="outlined" className="text-center">
        <CardContent>
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-[#FFAB40] mx-auto mb-3" />
          <h5 className="font-semibold text-[#F5F5F5] mb-2">AI Chat</h5>
          <p className="text-sm text-[#A3A3A3]">
            Get personalized recommendations and discuss your favorite series
          </p>
        </CardContent>
      </EnhancedCard>

      <EnhancedCard variant="outlined" className="text-center">
        <CardContent>
          <HeartIcon className="w-8 h-8 text-[#FFAB40] mx-auto mb-3" />
          <h5 className="font-semibold text-[#F5F5F5] mb-2">Wishlist</h5>
          <p className="text-sm text-[#A3A3A3]">
            Track anime and games you want to watch or play
          </p>
        </CardContent>
      </EnhancedCard>

      <EnhancedCard variant="outlined" className="text-center">
        <CardContent>
          <StarIcon className="w-8 h-8 text-[#FFAB40] mx-auto mb-3" />
          <h5 className="font-semibold text-[#F5F5F5] mb-2">Ratings</h5>
          <p className="text-sm text-[#A3A3A3]">
            Rate and review your favorite content
          </p>
        </CardContent>
      </EnhancedCard>

      <EnhancedCard variant="outlined" className="text-center">
        <CardContent>
          <CogIcon className="w-8 h-8 text-[#FFAB40] mx-auto mb-3" />
          <h5 className="font-semibold text-[#F5F5F5] mb-2">Settings</h5>
          <p className="text-sm text-[#A3A3A3]">
            Customize your experience and preferences
          </p>
        </CardContent>
      </EnhancedCard>
    </div>
  </div>
);

// ===== PLATFORM SETUP STEP =====

export const PlatformSetupStep: React.FC = () => (
  <div className="space-y-6">
    <div className="text-center">
      <h4 className="text-xl font-semibold text-[#F5F5F5] mb-2">
        Choose Your Platform
      </h4>
      <p className="text-[#A3A3A3]">
        Otagon works great on all devices. Choose your preferred platform for the best experience.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <EnhancedCard variant="outlined" className="text-center hover:border-[#FFAB40] transition-colors cursor-pointer">
        <CardContent>
          <DevicePhoneMobileIcon className="w-12 h-12 text-[#FFAB40] mx-auto mb-4" />
          <h5 className="font-semibold text-[#F5F5F5] mb-2">Mobile App</h5>
          <p className="text-sm text-[#A3A3A3] mb-4">
            Get the native mobile app for the best experience on your phone
          </p>
          <EnhancedButton variant="outline" size="sm" className="w-full">
            Download App
          </EnhancedButton>
        </CardContent>
      </EnhancedCard>

      <EnhancedCard variant="outlined" className="text-center hover:border-[#FFAB40] transition-colors cursor-pointer">
        <CardContent>
          <ComputerDesktopIcon className="w-12 h-12 text-[#FFAB40] mx-auto mb-4" />
          <h5 className="font-semibold text-[#F5F5F5] mb-2">PC Client</h5>
          <p className="text-sm text-[#A3A3A3] mb-4">
            Download the desktop client for advanced features and better performance
          </p>
          <EnhancedButton variant="outline" size="sm" className="w-full">
            Download PC Client
          </EnhancedButton>
        </CardContent>
      </EnhancedCard>
    </div>

    <div className="text-center">
      <p className="text-sm text-[#A3A3A3]">
        You can always change your platform preference later in settings.
      </p>
    </div>
  </div>
);

// ===== COMPLETION STEP =====

export const CompletionStep: React.FC = () => (
  <div className="text-center space-y-6">
    <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
      <CheckCircleIcon className="w-10 h-10 text-white" />
    </div>
    
    <div>
      <h4 className="text-2xl font-bold text-[#F5F5F5] mb-3">
        You're All Set! 🎉
      </h4>
      <p className="text-[#A3A3A3] text-lg leading-relaxed">
        Welcome to the Otagon community! You're ready to start your anime and gaming journey.
      </p>
    </div>

    <EnhancedCard variant="elevated" className="text-left">
      <CardContent>
        <h5 className="font-semibold text-[#F5F5F5] mb-3">What's next?</h5>
        <ul className="space-y-2 text-[#A3A3A3]">
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FFAB40] rounded-full"></div>
            Start chatting with Otagon AI about your favorite series
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FFAB40] rounded-full"></div>
            Add anime and games to your wishlist
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FFAB40] rounded-full"></div>
            Explore personalized recommendations
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FFAB40] rounded-full"></div>
            Customize your experience in settings
          </li>
        </ul>
      </CardContent>
    </EnhancedCard>
  </div>
);
