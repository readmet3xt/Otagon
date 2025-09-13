

import React from 'react';

const ThumbDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 14V2" />
    <path d="M15 18.12 14 14H8.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 10.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3 3 0 0 1-3-3.12z" />
  </svg>
);

export default ThumbDownIcon;
