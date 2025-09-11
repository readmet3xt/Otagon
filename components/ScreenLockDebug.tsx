import React, { useState, useEffect } from 'react';
// Dynamic import to avoid circular dependency
// import { smartNotificationService } from '../services/smartNotificationService';

const ScreenLockDebug: React.FC = () => {
  const [screenStatus, setScreenStatus] = useState({
    locked: false,
    lastActivity: 0,
    timeSinceLastActivity: 0
  });

  useEffect(() => {
    const updateStatus = async () => {
      const { smartNotificationService } = await import('../services/smartNotificationService');
      setScreenStatus(smartNotificationService.getScreenStatus());
    };

    // Update status every second
    const interval = setInterval(updateStatus, 1000);
    updateStatus(); // Initial update

    return () => clearInterval(interval);
  }, []);

  

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${screenStatus.locked ? 'bg-red-500' : 'bg-green-500'}`}></div>
          <span>{screenStatus.locked ? 'LOCKED' : 'UNLOCKED'}</span>
        </div>
      </div>
      <div className="space-y-1 text-gray-300">
        <div>Last Activity: {formatTime(screenStatus.timeSinceLastActivity)}</div>
        <div>Timestamp: {new Date(screenStatus.lastActivity).toLocaleTimeString()}</div>
      </div>

    </div>
  );
};

export default ScreenLockDebug;
