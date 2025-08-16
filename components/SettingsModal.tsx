import React, { useState } from 'react';
import { Usage, UserTier } from '../services/types';
import UserCircleIcon from './UserCircleIcon';
import CreditCardIcon from './CreditCardIcon';
import QuestionMarkCircleIcon from './QuestionMarkCircleIcon';
import GeneralSettingsTab from './GeneralSettingsTab';
import SubscriptionSettingsTab from './SubscriptionSettingsTab';
import HelpGuideTab from './HelpGuideTab';
import UserPreferencesTab from './UserPreferencesTab';


interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  usage: Usage;
  onShowUpgrade: () => void;
  onShowVanguardUpgrade: () => void;
  onLogout: () => void;
  onResetApp: () => void;
  userEmail?: string;
}

type ActiveTab = 'general' | 'preferences' | 'subscription' | 'help';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, usage, onShowUpgrade, onShowVanguardUpgrade, onLogout, onResetApp, userEmail }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');

  if (!isOpen) {
    return null;
  }

  const TabButton: React.FC<{ id: ActiveTab; label: string; icon: React.ReactNode }> = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        activeTab === id
          ? 'bg-[#E53A3A]/20 text-white'
          : 'text-neutral-400 hover:bg-neutral-700/50 hover:text-white'
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl w-full max-w-4xl m-4 relative animate-scale-in flex flex-col max-h-[90vh] h-auto md:h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors z-10 md:hidden"
          aria-label="Close settings"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            <nav className="flex-shrink-0 w-full md:w-56 p-4 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-row md:flex-col justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white mb-4 px-2 hidden md:block">Settings</h2>
                    <ul className="flex flex-row md:flex-col gap-1 w-full">
                        <li className="flex-1 md:flex-none"><TabButton id="general" label="General" icon={<UserCircleIcon className="w-5 h-5" />} /></li>
                        <li className="flex-1 md:flex-none"><TabButton id="preferences" label="AI Preferences" icon={<StarIcon className="w-5 h-5" />} /></li>
                        {usage.tier !== 'free' && (
                            <li className="flex-1 md:flex-none"><TabButton id="subscription" label="Subscription" icon={<CreditCardIcon className="w-5 h-5" />} /></li>
                        )}
                        <li className="flex-1 md:flex-none"><TabButton id="help" label="Help Guide" icon={<QuestionMarkCircleIcon className="w-5 h-5" />} /></li>
                    </ul>
                </div>
            </nav>

            <main className="flex-1 overflow-y-auto p-6 sm:p-8">
                {activeTab === 'general' && (
                    <GeneralSettingsTab
                        usage={usage}
                        onShowUpgrade={() => { onShowUpgrade(); onClose(); }}
                        onShowVanguardUpgrade={() => { onShowVanguardUpgrade(); onClose(); }}
                        onResetApp={() => { onResetApp(); onClose(); }}
                        onLogout={() => { onLogout(); onClose(); }}
                        userEmail={userEmail}
                    />
                )}
                {activeTab === 'preferences' && <UserPreferencesTab />}
                {activeTab === 'subscription' && <SubscriptionSettingsTab />}
                {activeTab === 'help' && <HelpGuideTab />}
            </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;