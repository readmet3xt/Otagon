
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 border-2 border-transparent border-t-[#E53A3A] border-r-[#D98C1F] border-b-transparent"></div>
    </div>
  );
};

export default Spinner;