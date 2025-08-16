
import React from 'react';

const UserAvatar: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="User Avatar"
    >
        <defs>
            <linearGradient id="avatar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF4D4D" />
                <stop offset="100%" stopColor="#FFAB40" />
            </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="12" fill="url(#avatar-gradient)" />
    </svg>
);

export default UserAvatar;
