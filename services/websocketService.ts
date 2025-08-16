
let ws: WebSocket | null = null;
const SERVER_ADDRESS = 'wss://otakon-relay.onrender.com';

const connect = (
  code: string,
  onOpen: () => void,
  onMessage: (data: any) => void,
  onError: (error: string) => void,
  onClose: () => void
) => {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    console.log("WebSocket is already open or connecting.");
    return;
  }

  if (!/^\d{4}$/.test(code)) {
    onError("Invalid code format. Please enter a 4-digit code.");
    return;
  }

  // The 4-digit code is used to identify the connection channel on the server.
  const fullUrl = `${SERVER_ADDRESS}/${code}`;

  try {
    ws = new WebSocket(fullUrl);
  } catch (e) {
    const message = e instanceof Error ? e.message : "An unknown error occurred.";
    onError(`Connection failed: ${message}. Please check the URL and your network connection.`);
    return;
  }

  ws.onopen = () => {
    console.log("WebSocket connection established to:", fullUrl);
    onOpen();
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("WebSocket message received:", data);
      onMessage(data);
    } catch (e) {
      console.error("Failed to parse WebSocket message:", event.data, e);
      // The application logic expects a JSON object, so we'll log the error and ignore non-JSON messages.
    }
  };

  ws.onerror = (event: Event) => {
    // The 'error' event is generic and is always followed by a 'close' event
    // which contains more specific details about the error. We delegate all
    // user-facing error handling to the onclose handler to avoid duplication.
  };

  ws.onclose = (event: CloseEvent) => {
    console.log(`WebSocket connection closed. Code: ${event.code}, Reason: '${event.reason}', Clean: ${event.wasClean}`);
    
    // A "clean" close means the connection was closed intentionally (e.g., user clicked Disconnect).
    // We only want to show an error for unclean/abnormal closures.
    if (!event.wasClean) {
        let errorMessage = "Connection closed unexpectedly.";
        if (event.code === 1006) { // Abnormal closure
            errorMessage = "Connection to the server failed. Please check your network, verify the code, and ensure the PC client is running.";
        } else if (event.reason) {
            errorMessage = `Connection closed: ${event.reason}`;
        }
        onError(errorMessage);
    }

    ws = null;
    onClose();
  };
};

const send = (data: object) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  } else {
    console.warn("WebSocket is not connected. Cannot send message:", data);
  }
};

const disconnect = () => {
  if (ws) {
    // Use the 1000 code for a normal, intentional closure.
    ws.close(1000, "User disconnected");
    ws = null;
  }
};

export { connect, disconnect, send };
