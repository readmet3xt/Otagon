

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

    const onMessageRef = useRef(onMessage);
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    const statusRef = useRef(status);
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    const connectionTimeoutRef = useRef<number | null>(null);

    const clearConnectionTimeout = () => {
        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
        }
    };

    const connect = useCallback((code: string) => {
        if (statusRef.current === ConnectionStatus.CONNECTING || statusRef.current === ConnectionStatus.CONNECTED) {
            return;
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
            }
        }, 10000); // 10 seconds

        wsConnect(
            code,
            () => { // onOpen - socket is open, but we wait for partner
                console.log(`WebSocket open. Waiting for partner on code ${code}.`);
                localStorage.setItem('lastConnectionCode', code);
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
                    }
                }
                onMessageRef.current(data);
            },
            (err) => { // onError - This is usually called for unclean disconnects.
                clearConnectionTimeout();
                setStatus(ConnectionStatus.ERROR);
                setError(err);
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
            }
        );
    }, []);

    const disconnect = useCallback(() => {
        clearConnectionTimeout();
        wsDisconnect();
        setStatus(ConnectionStatus.DISCONNECTED);
        setError(null);
        setConnectionCode(null);
        localStorage.removeItem('lastConnectionCode');
    }, []);
    
    useEffect(() => {
        const savedCode = localStorage.getItem('lastConnectionCode');
        if (savedCode && status === ConnectionStatus.DISCONNECTED) {
            console.log("Attempting to auto-reconnect with saved code:", savedCode);
            connect(savedCode);
        }
    }, [connect, status]);

    const send = useCallback((data: object) => {
        wsSend(data);
    }, []);

    return { status, error, connect, disconnect, connectionCode, send };
};