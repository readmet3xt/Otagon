
import React from 'react';

const PinIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
        viewBox="0 0 24 24" 
        fill="currentColor" 
        aria-hidden="true"
    >
        <path d="M16 3a1 1 0 011 1v5.268l2.763 2.763a1 1 0 01-.707 1.707L16 14.732V20a1 1 0 01-1.447.894L12 18.5l-2.553 2.394a1 1 0 01-1.447-.894v-5.268l-3.056-1.006a1 1 0 01-.707-1.707L7 9.268V4a1 1 0 011-1h8z"></path>
    </svg>
);

export default PinIcon;
