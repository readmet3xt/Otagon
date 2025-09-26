
let ws: WebSocket | null = null;
const SERVER_ADDRESS = 'wss://otakon-relay.onrender.com';

let reconnectAttempts = 0;
const maxBackoffMs = 30000; // Increased to 30s max
const maxReconnectAttempts = 10; // Limit reconnection attempts
const sendQueue: object[] = [];
let lastCode: string | null = null;
let handlers: { onOpen: () => void; onMessage: (data: any) => void; onError: (error: string) => void; onClose: () => void } | null = null;
let heartbeatTimer: number | null = null;
let connectionHealthTimer: number | null = null;
const HEARTBEAT_MS = 30000; // Reduced to 30s for better health monitoring
const CONNECTION_TIMEOUT_MS = 10000; // 10s connection timeout

const connect = (
  code: string,
  onOpen: () => void,
  onMessage: (data: any) => void,
  onError: (error: string) => void,
  onClose: () => void
) => {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    // Skip logging for already connected state
    return;
  }

  // Only accept 6-digit codes
  if (!/^\d{6}$/.test(code)) {
    onError("Invalid code format. Please enter a 6-digit code.");
    return;
  }

  lastCode = code;
  handlers = { onOpen, onMessage, onError, onClose };

  const fullUrl = `${SERVER_ADDRESS}/${code}`;

  try {
    ws = new WebSocket(fullUrl);
    
    // Set connection timeout
    connectionHealthTimer = window.setTimeout(() => {
      if (ws && ws.readyState === WebSocket.CONNECTING) {
        console.warn('WebSocket connection timeout, closing...');
        ws.close();
        onError('Connection attempt timed out. Please check your network and try again.');
      }
    }, CONNECTION_TIMEOUT_MS);
    
  } catch (e) {
    const message = e instanceof Error ? e.message : "An unknown error occurred.";
    onError(`Connection failed: ${message}. Please check the URL and your network connection.`);
    return;
  }

  ws.onopen = () => {
    // Clear connection timeout
    if (connectionHealthTimer) {
      clearTimeout(connectionHealthTimer);
      connectionHealthTimer = null;
    }
    
    // Connection established - reset reconnection attempts
    reconnectAttempts = 0;
    onOpen();
    
    // Flush queued messages
    while (sendQueue.length && ws && ws.readyState === WebSocket.OPEN) {
      const payload = sendQueue.shift();
      try { ws.send(JSON.stringify(payload)); } catch {}
    }

    // Start heartbeat
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    heartbeatTimer = window.setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try { 
          ws.send(JSON.stringify({ type: 'ping', ts: Date.now() })); 
        } catch (e) {
          console.warn('Failed to send heartbeat:', e);
        }
      }
    }, HEARTBEAT_MS);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Only log errors in development, not every message
      onMessage(data);
    } catch (e) {
      if (import.meta.env.DEV) console.error("Failed to parse WebSocket message:", event.data, e);
      // Ignore non-JSON
    }
  };

  ws.onerror = () => {
    // Handled by onclose
  };

  ws.onclose = (event: CloseEvent) => {
    // Only log unexpected closures
    if (!event.wasClean && import.meta.env.DEV) {
      console.warn(`WebSocket connection closed unexpectedly. Code: ${event.code}, Reason: '${event.reason}'`);
    }

    if (!event.wasClean) {
      let errorMessage = "Connection closed unexpectedly.";
      if (event.code === 1006) {
        errorMessage = "Connection to the server failed. Please check your network, verify the code, and ensure the PC client is running.";
      } else if (event.reason) {
        errorMessage = `Connection closed: ${event.reason}`;
      }
      onError(errorMessage);
    }

    ws = null;
    onClose();

    // Stop heartbeat
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }

    // Auto-reconnect with exponential backoff and jitter
    if (lastCode && handlers && reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts += 1;
      const base = Math.min(maxBackoffMs, 1000 * Math.pow(2, reconnectAttempts - 1));
      const jitter = Math.random() * 1000; // Increased jitter for better distribution
      const delay = base + jitter;
      
      console.log(`🔄 WebSocket reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${Math.round(delay)}ms`);
      
      setTimeout(() => {
        if (!ws && handlers) {
          connect(lastCode!, handlers.onOpen, handlers.onMessage, handlers.onError, handlers.onClose);
        }
      }, delay);
    } else if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('🚫 WebSocket max reconnection attempts reached. Manual reconnection required.');
      onError('Connection lost. Please refresh the page to reconnect.');
    }
  };
};

const send = (data: object) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  } else {
    // Queue and let onopen flush
    sendQueue.push(data);
    // Message queued - no need to log every queued message
  }
};

const disconnect = () => {
  if (ws) {
    ws.close(1000, "User disconnected");
    ws = null;
  }
  reconnectAttempts = 0;
  
  // Clear all timers
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (connectionHealthTimer) {
    clearTimeout(connectionHealthTimer);
    connectionHealthTimer = null;
  }
  
  // Clear all connection state to prevent auto-reconnection after logout
  lastCode = null;
  handlers = null;
  
  // Clear any pending reconnection attempts
  if (import.meta.env.DEV) {
    console.log("🔌 WebSocket disconnected and all reconnection state cleared");
  }
};

export { connect, disconnect, send };
