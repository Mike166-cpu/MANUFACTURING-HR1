import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";

const EmployeeInfo = () => {
  useEffect(() => {
    document.title = "Employee Records Management";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  return (
    <div>
      <div>
        <div className="flex">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div
            className={`flex-1 transition-all duration-300 ${
              isSidebarOpen ? "ml-80" : "ml-0"
            }`}
          >
            <Navbar toggleSidebar={toggleSidebar} />
            <div className="p-4">
              <h1 className="text-2xl font-bold">
                Employee Information
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeInfo;
