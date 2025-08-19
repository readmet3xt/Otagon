
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-transparent border-t-[#FF4D4D] border-r-[#FFAB40] border-b-[#5CBB7B]"></div>
    </div>
  );
};

export default Spinner;