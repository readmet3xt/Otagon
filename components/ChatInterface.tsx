import React from 'react';

interface ChatInterfaceProps {
  onSendMessage?: (message: string) => void;
  messages?: any[];
  isLoading?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onSendMessage, messages = [], isLoading = false }) => {
  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className="message">
            {message.content}
          </div>
        ))}
      </div>
      {isLoading && <div>Loading...</div>}
    </div>
  );
};

export default ChatInterface;

