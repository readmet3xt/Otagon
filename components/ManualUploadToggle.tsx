import React from 'react';
import PlayIcon from './PlayIcon';
import PauseIcon from './PauseIcon';

interface ManualUploadToggleProps {
  isManualMode: boolean;
  onToggle: () => void;
}

const ManualUploadToggle: React.FC<ManualUploadToggleProps> = ({ isManualMode, onToggle }) => {
  const title = isManualMode
    ? 'Manual review is ON. Click to resume auto-sending screenshots.'
    : 'Auto-sending is ON. Click to pause and review screenshots manually.';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 group
      ${
        isManualMode
          ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
          : 'text-neutral-400 hover:bg-[#2E2E2E]'
      }
      `}
      aria-pressed={isManualMode}
      aria-label="Toggle screenshot auto-sending"
      title={title}
    >
      {isManualMode ? <PlayIcon className="w-5 h-5" /> : <PauseIcon className="w-5 h-5" />}
    </button>
  );
};

export default React.memo(ManualUploadToggle);