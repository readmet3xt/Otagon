import React from 'react';

interface AIAvatarProps {
  className?: string;
}

const AIAvatar: React.FC<AIAvatarProps> = ({ className }) => (
  <img
    src="/images/AvatarAI.png"
    alt="AI Avatar"
    className={`${className} rounded-full object-cover`}
    aria-label="AI Avatar"
  />
);

export default AIAvatar;
