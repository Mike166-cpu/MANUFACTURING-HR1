import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import BreadCrumbs from "../../Components/BreadCrumb";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const APIBASE_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const email = localStorage.getItem("email");
  console.log("Email from localStorage:", email);

  useEffect(() => {
    document.title = "Dashboard | HRMS";
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
        }`}
      >
        <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Header Section */}
        <div className="bg-white p-5 shadow-sm mb-6">
          <BreadCrumbs />
          <h1 className="font-bold px-4 text-xl">Overview</h1>
        </div>
        <div className="card bg-base-100 shadow-md p-4 w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-4">
            📊 Performance Score (Attendance-Based)
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span>Total Working Days:</span>
              <span className="font-semibold">20</span>
            </div>
            <div className="flex justify-between">
              <span>Days Present:</span>
              <span className="font-semibold">18</span>
            </div>
            <div className="flex justify-between">
              <span>Late Days:</span>
              <span className="font-semibold">3</span>
            </div>
            <div className="flex justify-between">
              <span>Undertime Days:</span>
              <span className="font-semibold">2</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-base font-medium">
                📈 Calculated Performance Score:
              </span>
              <span className="badge badge-success text-base px-4 py-2">
                89 / 100
              </span>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-500">
              *Score is based on attendance reliability: presence, tardiness,
              and undertime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
