import React, { useState, useEffect } from "react";

const LazyLoader = ({ children, delay = 2000 }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return isLoading ? <SkeletonLoader /> : children;
};

export default LazyLoader;
