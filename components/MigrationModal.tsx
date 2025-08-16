import React from 'react';
import { MigrationState } from '../hooks/useMigration';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  migrationState: MigrationState;
  onMigrate: () => void;
  onRetry: () => void;
  onSkip: () => void;
}

const MigrationModal: React.FC<MigrationModalProps> = ({
  isOpen,
  onClose,
  migrationState,
  onMigrate,
  onRetry,
  onSkip,
}) => {
  if (!isOpen) return null;

  const { isMigrating, hasMigrated, error, progress } = migrationState;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div 
        className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl p-8 w-full max-w-md m-4 relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Migrate Your Data</h2>
          <p className="text-[#A3A3A3]">
            We're upgrading to a secure cloud storage system. Your conversations and settings will be safely transferred.
          </p>
        </div>

        {!hasMigrated && !isMigrating && !error && (
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h3 className="font-semibold text-blue-400 mb-2">What will be migrated:</h3>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• All your conversation history</li>
                <li>• Game progress and insights</li>
                <li>• Usage statistics</li>
                <li>• App preferences</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onMigrate}
                className="flex-1 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105"
              >
                Start Migration
              </button>
              <button
                onClick={onSkip}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Skip for Now
              </button>
            </div>
          </div>
        )}

        {isMigrating && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-[#A3A3A3]">
                <span>Migrating data...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center text-sm text-[#A3A3A3]">
              Please don't close this window during migration.
            </div>
          </div>
        )}

        {error && (
          <div className="space-y-4">
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-400 mb-2">Migration Failed</h3>
              <p className="text-red-300 text-sm">{error}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onRetry}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onSkip}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Skip Migration
              </button>
            </div>
          </div>
        )}

        {hasMigrated && (
          <div className="space-y-4">
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-green-400 mb-2">Migration Complete!</h3>
              <p className="text-green-300 text-sm">
                Your data has been successfully migrated to secure cloud storage.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MigrationModal;
