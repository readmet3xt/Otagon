import React from 'react';

const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5.52 19c.64-2.2 1.84-4 3.22-5.26A6.987 6.987 0 0 1 12 13a6.987 6.987 0 0 1 3.26-1.26c1.38-1.26 2.58-3.06 3.22-5.26" />
    <circle cx="12" cy="12" r="10" />
    <path d="M12 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
  </svg>
);

export default UserCircleIcon;
