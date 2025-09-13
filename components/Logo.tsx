
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => (
    <img
        src="/images/Dragon Circle Logo Design.png"
        alt="Otagon Logo"
        className={className || 'w-72 h-72'}
        style={{ 
            filter: 'drop-shadow(0 0 24px rgba(255, 140, 0, 0.3))',
            objectFit: 'contain'
        }}
    />
);

export default Logo;