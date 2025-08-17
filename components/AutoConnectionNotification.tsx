import React from 'react';
import { ConnectionStatus } from '../services/types';

interface AutoConnectionNotificationProps {
    isAutoConnecting: boolean;
    autoConnectAttempts: number;
    connectionStatus: ConnectionStatus;
    connectionCode: string | null;
    lastSuccessfulConnection: number | null;
}

const AutoConnectionNotification: React.FC<AutoConnectionNotificationProps> = ({
    isAutoConnecting,
    autoConnectAttempts,
    connectionStatus,
    connectionCode,
    lastSuccessfulConnection
}) => {
    if (!isAutoConnecting && connectionStatus !== ConnectionStatus.CONNECTED) {
        return null;
    }

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

    if (isAutoConnecting) {
        return (
            <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <div>
                        <div className="font-semibold">Auto-connecting to PC</div>
                        <div className="text-sm text-blue-100">
                            Attempt {autoConnectAttempts}/3 - Code: {connectionCode}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (connectionStatus === ConnectionStatus.CONNECTED && connectionCode) {
        return (
            <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <div className="font-semibold">Connected to PC</div>
                        <div className="text-sm text-green-100">
                            Code: {connectionCode}
                            {lastSuccessfulConnection && (
                                <span className="block text-xs text-green-200">
                                    Last connected: {formatLastConnection(lastSuccessfulConnection)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default AutoConnectionNotification;
