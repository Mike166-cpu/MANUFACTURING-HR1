import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import Navigate
import EmployeeNavbar from "../Components/EmployeeNavbar";
import Swal from "sweetalert2";


const EmployeeDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar state

  const navigate = useNavigate();

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      // Show SweetAlert if not logged in
      Swal.fire({
        title: "Not Logged In",
        text: "You are not logged in. Redirecting to Login Page",
        icon: "warning",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/employeelogin");
      });
    }
  }, [navigate]);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div>
      <EmployeeNavbar
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <div
        className={`transition-all duration-300 ease-in-out flex-grow p-4 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
