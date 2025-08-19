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
    // Only show notification when auto-connecting
    if (!isAutoConnecting) {
        return null;
    }

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
};

export default AutoConnectionNotification;
