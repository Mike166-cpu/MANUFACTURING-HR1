import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";

const EmployeeRecords = () => {
  useEffect(() => {
    document.title = "Employee Records Management";
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div>
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div
          className={`flex-1 transition-all duration-300 ${
            isSidebarOpen ? "ml-80" : "ml-0"
          }`}
        >
          <Navbar toggleSidebar={toggleSidebar} />

          {/* MAIN CONTENT */}
          <div className="p-4">
            <h1 className="text-2xl font-bold pb-6">
              Employee Records Management
            </h1>
            <div className="overflow-x-auto rounded-md"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRecords;
