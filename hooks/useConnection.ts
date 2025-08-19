

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
                    console.log("✅ Partner PC client has connected!");
                    if (statusRef.current === ConnectionStatus.CONNECTING) {
                        clearConnectionTimeout();
                        setStatus(ConnectionStatus.CONNECTED);
                        setError(null);
                        setIsAutoConnecting(false);
                        saveSuccessfulConnection(code);
                    }
                } else if (data.type === 'partner_disconnected') {
                    console.log("Partner PC client has disconnected.");
                    // Don't change status here - just log it
                } else if (data.type === 'waiting_for_client') {
                    console.log("Waiting for PC client to connect...");
                    // This is a status update from the relay server
                } else if (data.type === 'screenshot_batch') {
                    console.log("📸 Screenshot batch received from enhanced connector");
                    // Let the main handler process this
                } else if (data.type === 'screenshot') {
                    console.log("📸 Individual screenshot received from PC client");
                    console.log("📸 Screenshot details:", {
                        index: data.index,
                        total: data.total,
                        processImmediate: data.processImmediate,
                        timestamp: data.timestamp,
                        dataUrlLength: data.dataUrl?.length || 0
                    });
                    // Let the main handler process this
                } else if (data.type === 'connection_test') {
                    console.log("✅ Connection test received from PC client");
                    // Let the main handler process this
                }
                
                // Always forward all messages to the main handler
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
            
            console.log("Attempting to auto-reconnect with saved code:", savedCode);
            // Small delay to ensure app is fully initialized
            const autoConnectDelay = setTimeout(() => {
                connect(savedCode, true);
            }, 1000); // Reduced to 1 second delay
            
            return () => clearTimeout(autoConnectDelay);
        }
    }, [connect, status, isAutoConnecting]);

    // Additional auto-reconnect on error status
    useEffect(() => {
        const savedCode = localStorage.getItem('lastConnectionCode');
        
        if (savedCode && status === ConnectionStatus.ERROR && !isAutoConnecting) {
            console.log("Connection error detected, attempting auto-reconnect...");
            const errorReconnectDelay = setTimeout(() => {
                connect(savedCode, true);
            }, 3000); // 3 second delay after error
            
            return () => clearTimeout(errorReconnectDelay);
        }
    }, [connect, status, isAutoConnecting]);

    // Persistent connection check - keep trying to reconnect if disconnected
    useEffect(() => {
        const savedCode = localStorage.getItem('lastConnectionCode');
        
        if (savedCode && status === ConnectionStatus.DISCONNECTED && !isAutoConnecting) {
            const persistentReconnect = setInterval(() => {
                if (status === ConnectionStatus.DISCONNECTED && !isAutoConnecting) {
                    console.log("Persistent reconnection attempt...");
                    connect(savedCode, true);
                }
            }, 10000); // Try every 10 seconds
            
            return () => clearInterval(persistentReconnect);
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