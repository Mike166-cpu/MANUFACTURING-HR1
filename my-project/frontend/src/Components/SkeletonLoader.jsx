import React from 'react';

const SkeletonLoader = () => {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-64 w-full bg-gray-200 rounded-lg"></div>
    </div>
  );
};

export default SkeletonLoader;
