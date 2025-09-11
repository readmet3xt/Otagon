import React, { useState } from 'react';
import { PlayerProfileSetupModal } from './PlayerProfileSetupModal';
import { PlayerProfile } from '../services/types';

export const TestProfileSetup: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  const handleComplete = (newProfile: PlayerProfile) => {
    setProfile(newProfile);
    setShowModal(false);
    console.log('Profile setup completed:', newProfile);
  };

  const handleSkip = () => {
    setShowModal(false);
    console.log('Profile setup skipped');
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Test Profile Setup</h2>
      
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Show Profile Setup Modal
      </button>

      {profile && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Profile Created:</h3>
          <pre className="text-gray-300 text-sm">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
      )}

      <PlayerProfileSetupModal
        isOpen={showModal}
        onComplete={handleComplete}
        onSkip={handleSkip}
      />
    </div>
  );
};
