import React from 'react';

interface ChatInterfaceProps {
  onMessage?: (message: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onMessage }) => {
  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="text-center text-gray-500">
          Chat interface placeholder
        </div>
      </div>
      <div className="p-4 border-t">
        <div className="flex">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => onMessage?.('Hello')}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
