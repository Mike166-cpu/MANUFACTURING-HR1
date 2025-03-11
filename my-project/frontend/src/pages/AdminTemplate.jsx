import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import axios from "axios";

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setMatches(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const Local = "http://localhost:7685";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const adminToken = localStorage.getItem("adminToken");
  const gatewayToken = localStorage.getItem("gatewayToken");

  // console.log("Admin Token:", adminToken);
  // console.log("Gateway Token:", gatewayToken);

  const handleResize = () => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };



  // DISPLAY DATA ON TABLE
  const [employeeData, setEmployeeData] = useState([]);
  useEffect(() => {
    axios
      .get("http://localhost:7685/api/hr/all-employee") // Replace with your actual backend URL
      .then((response) => {
        console.log("Fetched employees:", response.data); // ✅ Log response
        setEmployeeData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching employees:", error);
      });
  }, []);


  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
        } relative`}
      >
        <Navbar toggleSidebar={toggleSidebar} />
        {isSidebarOpen && isMobileView && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-10"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <div className="p-6 bg-gray-50 min-h-screen">
          {/* EMPLOYEE TABLE */}
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Mobile</th>
                <th className="border px-4 py-2">Address</th>
                <th className="border px-4 py-2">Position</th>
                <th className="border px-4 py-2">Role</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Gender</th>
                <th className="border px-4 py-2">Joining Date</th>
              </tr>
            </thead>
            <tbody>
              {employeeData.length > 0 ? (
                employeeData.map((employee, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="border px-4 py-2">{employee.employee_id}</td>
                    <td className="border px-4 py-2">{employee.email}</td>
                    <td className="border px-4 py-2">{employee.mobile}</td>
                    <td className="border px-4 py-2">{employee.address}</td>
                    <td className="border px-4 py-2">{employee.position}</td>
                    <td className="border px-4 py-2">{employee.role}</td>
                    <td className="border px-4 py-2">
                      {employee.employeeStatus}
                    </td>
                    <td className="border px-4 py-2">{employee.gender}</td>
                    <td className="border px-4 py-2">
                      {new Date(employee.joiningDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center border px-4 py-2">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {/* END OF THE TABLE */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
