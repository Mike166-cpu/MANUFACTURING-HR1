import React from "react";

const CustomLoader = () => {
  return (
    <div className="flex justify-center items-center w-full h-full">
      <div className="custom-spinner">
        <div className="spinner-inner"></div>
      </div>
    </div>
  );
};

export default CustomLoader;