

import { useState, useCallback, useEffect, useRef } from 'react';
import { ConnectionStatus } from '../services/types';
import { connect as wsConnect, disconnect as wsDisconnect, send as wsSend } from '../services/websocketService';

type MessageHandler = (data: any) => void;

export const useConnection = (onMessage: MessageHandler) => {
    const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
    const [error, setError] = useState<string | null>(null);
    const [connectionCode, setConnectionCode] = useState<string | null>(() => {
        return localStorage.getItem('lastConnectionCode');
    });
    const [isAutoConnecting, setIsAutoConnecting] = useState(false);
    const [autoConnectAttempts, setAutoConnectAttempts] = useState(0);
    const [lastSuccessfulConnection, setLastSuccessfulConnection] = useState<number | null>(() => {
        const saved = localStorage.getItem('lastSuccessfulConnection');
        return saved ? parseInt(saved) : null;
    });

    const onMessageRef = useRef(onMessage);
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    const statusRef = useRef(status);
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    const connectionTimeoutRef = useRef<number | null>(null);
    const autoConnectTimeoutRef = useRef<number | null>(null);

    const clearConnectionTimeout = () => {
        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
        }
    };

    const clearAutoConnectTimeout = () => {
        if (autoConnectTimeoutRef.current) {
            clearTimeout(autoConnectTimeoutRef.current);
            autoConnectTimeoutRef.current = null;
        }
    };

    const saveSuccessfulConnection = (code: string) => {
        localStorage.setItem('lastConnectionCode', code);
        localStorage.setItem('lastSuccessfulConnection', Date.now().toString());
        setLastSuccessfulConnection(Date.now());
        setAutoConnectAttempts(0); // Reset attempts on successful connection
    };

    const connect = useCallback((code: string, isAutoConnect: boolean = false) => {
        if (statusRef.current === ConnectionStatus.CONNECTING || statusRef.current === ConnectionStatus.CONNECTED) {
            return;
        }

        if (isAutoConnect) {
            setIsAutoConnecting(true);
            setAutoConnectAttempts(prev => prev + 1);
        }

        setStatus(ConnectionStatus.CONNECTING);
        setError(null);
        clearConnectionTimeout();

        connectionTimeoutRef.current = window.setTimeout(() => {
            if (statusRef.current === ConnectionStatus.CONNECTING) {
                console.log("Connection attempt timed out.");
                wsDisconnect(); // Close the WebSocket connection attempt
                setStatus(ConnectionStatus.ERROR);
                setError("Connection timed out. Please check your code and ensure the PC client is running.");
                
                if (isAutoConnect) {
                    setIsAutoConnecting(false);
                    // Schedule next auto-connect attempt with exponential backoff
                    const nextAttemptDelay = Math.min(5000 * Math.pow(2, autoConnectAttempts), 30000); // Max 30 seconds
                    autoConnectTimeoutRef.current = window.setTimeout(() => {
                        if (autoConnectAttempts < 3) { // Max 3 auto-connect attempts
                            const savedCode = localStorage.getItem('lastConnectionCode');
                            if (savedCode) {
                                connect(savedCode, true);
                            }
                        } else {
                            setIsAutoConnecting(false);
                            console.log("Max auto-connect attempts reached. User must manually connect.");
                        }
                    }, nextAttemptDelay);
                }
            }
        }, 10000); // 10 seconds

        wsConnect(
            code,
            () => { // onOpen - socket is open, but we wait for partner
                console.log(`WebSocket open. Waiting for partner on code ${code}.`);
                setConnectionCode(code);
                wsSend({ type: 'get_history' });
            },
            (data) => { // onMessage
                if (data.type === 'partner_connected') {
                    console.log("Partner connected message received. Finalizing connection.");
                    if (statusRef.current === ConnectionStatus.CONNECTING) {
                        clearConnectionTimeout();
                        setStatus(ConnectionStatus.CONNECTED);
                        setError(null);
                        setIsAutoConnecting(false);
                        saveSuccessfulConnection(code);
                    }
                }
                onMessageRef.current(data);
            },
            (err) => { // onError - This is usually called for unclean disconnects.
                clearConnectionTimeout();
                setStatus(ConnectionStatus.ERROR);
                setError(err);
                
                if (isAutoConnect) {
                    setIsAutoConnecting(false);
                }
            },
            () => { // onClose
                clearConnectionTimeout();
                // If an error has already been set (e.g., by timeout or onError), don't overwrite it.
                // Only set the generic error if we were connecting and no specific error was provided.
                if (statusRef.current === ConnectionStatus.CONNECTING) {
                    setStatus(ConnectionStatus.ERROR);
                    setError(prev => prev || "Connection failed. Please check the code and ensure the PC client is running.");
                } else if (statusRef.current !== ConnectionStatus.ERROR) {
                    setStatus(ConnectionStatus.DISCONNECTED);
                }
                
                if (isAutoConnect) {
                    setIsAutoConnecting(false);
                }
            }
        );
    }, [autoConnectAttempts]);

    const disconnect = useCallback(() => {
        clearConnectionTimeout();
        clearAutoConnectTimeout();
        wsDisconnect();
        setStatus(ConnectionStatus.DISCONNECTED);
        setError(null);
        setConnectionCode(null);
        setIsAutoConnecting(false);
        setAutoConnectAttempts(0);
        localStorage.removeItem('lastConnectionCode');
        localStorage.removeItem('lastSuccessfulConnection');
    }, []);

    const forceReconnect = useCallback(() => {
        const savedCode = localStorage.getItem('lastConnectionCode');
        if (savedCode) {
            disconnect();
            // Small delay to ensure cleanup is complete
            setTimeout(() => {
                connect(savedCode, false);
            }, 100);
        }
    }, [connect, disconnect]);

    // Auto-connect logic with improved timing and user feedback
    useEffect(() => {
        const savedCode = localStorage.getItem('lastConnectionCode');
        const lastConnection = localStorage.getItem('lastSuccessfulConnection');
        
        if (savedCode && status === ConnectionStatus.DISCONNECTED && !isAutoConnecting) {
            // Only auto-connect if:
            // 1. We have a saved code
            // 2. We're not currently connected
            // 3. We're not already trying to auto-connect
            // 4. The last successful connection was within the last 24 hours (optional)
            
            const shouldAutoConnect = lastConnection ? 
                (Date.now() - parseInt(lastConnection)) < (24 * 60 * 60 * 1000) : // Within 24 hours
                true; // Always try if no timestamp
            
            if (shouldAutoConnect) {
                console.log("Attempting to auto-reconnect with saved code:", savedCode);
                // Small delay to ensure app is fully initialized
                const autoConnectDelay = setTimeout(() => {
                    connect(savedCode, true);
                }, 2000); // 2 second delay
                
                return () => clearTimeout(autoConnectDelay);
            }
        }
    }, [connect, status, isAutoConnecting]);

    const send = useCallback((data: object) => {
        wsSend(data);
    }, []);

    return { 
        status, 
        error, 
        connect, 
        disconnect, 
        connectionCode, 
        send,
        isAutoConnecting,
        autoConnectAttempts,
        lastSuccessfulConnection,
        forceReconnect
    };
};