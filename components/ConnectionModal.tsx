

import React, { useState, useEffect } from 'react';
import { ConnectionStatus } from '../services/types';
import PCClientDownload from './PCClientDownload';

interface ConnectionModalProps {
  onClose: () => void;
  onConnect: (code: string) => void;
  onDisconnect: () => void;
  status: ConnectionStatus;
  error: string | null;
  connectionCode: string | null;
  isAutoConnecting?: boolean;
  autoConnectAttempts?: number;
  lastSuccessfulConnection?: number | null;
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({
  onClose,
  onConnect,
  onDisconnect,
  status,
  error,
  connectionCode,
  isAutoConnecting = false,
  autoConnectAttempts = 0,
  lastSuccessfulConnection = null,
}) => {
  const [code, setCode] = useState('');

  useEffect(() => {
    if (connectionCode) {
        setCode(connectionCode);
    } else {
        setCode('');
    }
  }, [connectionCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(code);
  };

  const formatLastConnection = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };
  
  const isConnecting = status === ConnectionStatus.CONNECTING || isAutoConnecting;
  const isConnected = status === ConnectionStatus.CONNECTED;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl p-8 w-full max-w-md m-4 relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
    >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">PC Connection</h2>
        <p className="text-[#A3A3A3] mb-4">Sync with the PC client to send screenshots directly from your game.</p>
        
        {/* Auto-connection status */}
        {isAutoConnecting && (
          <div className="mb-4 p-3 bg-blue-600/20 border border-blue-600/30 rounded-lg">
            <div className="flex items-center gap-2 text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span className="text-sm font-medium">
                Auto-connecting... (Attempt {autoConnectAttempts}/3)
              </span>
            </div>
            <p className="text-xs text-blue-300 mt-1">
              Using saved connection code: {connectionCode}
            </p>
          </div>
        )}

        {/* Saved connection info */}
        {connectionCode && !isAutoConnecting && (
          <div className="mb-4 p-3 bg-[#2E2E2E] border border-[#424242] rounded-lg">
            <div className="text-sm text-[#A3A3A3]">
              <span className="font-medium text-[#F5F5F5]">Saved connection:</span> {connectionCode}
              {lastSuccessfulConnection && (
                <span className="block text-xs text-[#6E6E6E] mt-1">
                  Last connected: {formatLastConnection(lastSuccessfulConnection)}
                </span>
              )}
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <PCClientDownload 
            variant="card" 
            showVersion={true} 
            showReleaseNotes={true}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="connection-code" className="block text-sm font-medium text-[#CFCFCF] mb-1">
              4-Digit Connection Code
            </label>
            <input
              id="connection-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="1234"
              maxLength={4}
              pattern="\d{4}"
              title="Enter exactly 4 digits"
              disabled={isConnecting || isConnected}
              required
              className="w-full bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] placeholder-[#6E6E6E] focus:outline-none focus:ring-2 focus:ring-[#FFAB40] disabled:opacity-50"
            />
          </div>
          
          {error && <p className="text-[#E53A3A] text-sm">{error}</p>}
          {isConnected && <p className="text-[#5CBB7B] text-sm">Connected successfully. Ready to receive screenshots.</p>}

          <div className="flex flex-col sm:flex-row items-center pt-4 gap-3">
            {isConnected ? (
                <button
                    type="button"
                    onClick={onDisconnect}
                    className="w-full flex items-center justify-center bg-[#E53A3A] hover:bg-[#E53A3A] hover:brightness-90 text-[#F5F5F5] font-bold py-2.5 px-4 rounded-md transition-colors"
                >
                    Disconnect
                </button>
            ) : (
                <button
                    type="submit"
                    disabled={isConnecting || !/^\d{4}$/.test(code)}
                    className="w-full flex items-center justify-center bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] disabled:from-[#5A5A5A] disabled:to-[#424242] disabled:cursor-not-allowed text-[#F5F5F5] font-bold py-2.5 px-4 rounded-md transition-all duration-200"
                >
                {isConnecting ? (
                    <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#F5F5F5] mr-3"></div>
                    Connecting...
                    </>
                ) : (
                    'Connect'
                )}
                </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};

export default React.memo(ConnectionModal);