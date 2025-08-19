import React, { useState } from 'react';
import { Usage, UserTier } from '../services/types';
import UserCircleIcon from './UserCircleIcon';
import CreditCardIcon from './CreditCardIcon';
import QuestionMarkCircleIcon from './QuestionMarkCircleIcon';
import StarIcon from './StarIcon';
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
  onShowHowToUse: () => void;
  userEmail?: string;
}

type ActiveTab = 'general' | 'preferences' | 'subscription' | 'help';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, usage, onShowUpgrade, onShowVanguardUpgrade, onLogout, onResetApp, onShowHowToUse, userEmail }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');

  if (!isOpen) {
    return null;
  }

  const TabButton: React.FC<{ id: ActiveTab; label: string; icon: React.ReactNode }> = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center justify-center md:justify-start gap-4 px-4 py-3 text-base font-medium rounded-xl transition-all duration-300 ${
        activeTab === id
          ? 'bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 text-white border-2 border-[#E53A3A]/40 shadow-lg shadow-[#E53A3A]/10'
          : 'text-neutral-400 hover:bg-gradient-to-r hover:from-neutral-700/50 hover:to-neutral-600/50 hover:text-white hover:scale-105'
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/80 to-[#0A0A0A]/80 backdrop-blur-xl flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-gradient-to-r from-[#1C1C1C]/95 to-[#0A0A0A]/95 backdrop-blur-xl border-2 border-[#424242]/60 rounded-3xl shadow-2xl w-full max-w-5xl m-6 relative animate-scale-in flex flex-col max-h-[90vh] h-auto md:h-[75vh] hover:border-[#424242]/80 transition-all duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-white transition-all duration-300 z-10 md:hidden hover:scale-110"
          aria-label="Close settings"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            <nav className="flex-shrink-0 w-full md:w-64 p-6 border-b-2 md:border-b-0 md:border-r-2 border-neutral-800/60 flex flex-row md:flex-col justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white mb-6 px-2 hidden md:block leading-tight">Settings</h2>
                    <ul className="flex flex-row md:flex-col gap-2 w-full">
                        <li className="flex-1 md:flex-none"><TabButton id="general" label="General" icon={<UserCircleIcon className="w-6 h-6" />} /></li>
                        <li className="flex-1 md:flex-none"><TabButton id="preferences" label="AI Preferences" icon={<StarIcon className="w-6 h-6" />} /></li>
                        {usage.tier !== 'free' && (
                            <li className="flex-1 md:flex-none"><TabButton id="subscription" label="Subscription" icon={<CreditCardIcon className="w-6 h-6" />} /></li>
                        )}
                        <li className="flex-1 md:flex-none"><TabButton id="help" label="Help Guide" icon={<QuestionMarkCircleIcon className="w-6 h-6" />} /></li>
                    </ul>
                </div>
            </nav>

            <main className="flex-1 overflow-y-auto p-8 sm:p-10">
                {activeTab === 'general' && (
                    <GeneralSettingsTab
                        usage={usage}
                        onShowUpgrade={() => { onShowUpgrade(); onClose(); }}
                        onShowVanguardUpgrade={() => { onShowVanguardUpgrade(); onClose(); }}
                        onResetApp={() => { onResetApp(); onClose(); }}
                        onLogout={() => { onLogout(); onClose(); }}
                        onShowHowToUse={() => { onShowHowToUse(); onClose(); }}
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