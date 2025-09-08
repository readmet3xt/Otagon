
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => (
    <img
        src="/images/Dragon Circle Logo Design.png"
        alt="Otagon Logo"
        className={`${className || 'w-24 h-24'} object-contain`}
    />
);

export default Logo;