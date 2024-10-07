import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import { useNavigate } from "react-router-dom";

const AttendanceTime = () => {
  useEffect(() => {
    document.title = "Attendance and Time Tracking  ";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Offboarding";

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);
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
                Attendance and Time Tracking
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTime;
