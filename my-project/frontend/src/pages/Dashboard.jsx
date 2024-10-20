// Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";

const Dashboard = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [timeRecords, setTimeRecords] = useState([]);

  useEffect(() => {
    document.title = "Dashboard";
    
    const token = localStorage.getItem("adminToken");
    if (!token) {
      Swal.fire({
        title: "Not Logged In",
        text: "You are not logged in. Redirecting to login page...",
        icon: "warning",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/login");
      });
    } else {
      fetchEmployees();
      fetchTimeRecords();
    }
  }, [navigate]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchTimeRecords = async () => {
    try {
      const response = await fetch("/api/time-tracking");
      const data = await response.json();
      setTimeRecords(data);
    } catch (error) {
      console.error("Error fetching time records:", error);
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-80" : "ml-0"}`}>
        <Navbar toggleSidebar={toggleSidebar} />
        
        {/* MAIN CONTENT */}
        <div className="m-5 p-5 border rounded-lg">
          <h1 className="text-2xl font-bold">Welcome to Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {/* Summary Cards */}
            <div className="bg-white p-4 rounded shadow">
              <h2 className="font-bold">Total Employees</h2>
              <p className="text-lg">{employees.length}</p>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h2 className="font-bold">Total Time Records</h2>
              <p className="text-lg">{timeRecords.length}</p>
            </div>

            {/* Additional cards can be added here */}
          </div>
        </div>
        {/* END OF MAIN CONTENT */}
      </div>
    </div>
  );
};

export default Dashboard;
