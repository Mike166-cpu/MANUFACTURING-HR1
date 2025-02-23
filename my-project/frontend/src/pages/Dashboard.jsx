import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import axios from "axios";
import { FaUsers, FaClock, FaExclamationTriangle } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";
import { Bar, Line } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
  const [employees, setEmployees] = useState([]);
  const [timeRecords, setTimeRecords] = useState([]);
  const [incidentReport, setIncidentReport] = useState([]);
  const [employeeStats, setEmployeeStats] = useState({
    totalEmployees: 0,
    departmentCounts: {},
    activeEmployees: 0,
    newEmployees: 0,
  });
  const [lastLogins, setLastLogins] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [count, setCount] = useState(0);

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";

  const colors = [
    "text-red-500",
    "text-blue-500",
    "text-green-500",
    "text-yellow-500",
    "text-purple-500",
  ];

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.clear();
    Swal.fire({
      title: "Session Expired",
      text: "Your session has expired. Please log in again.",
      icon: "warning",
      confirmButtonText: "OK",
    }).then(() => {
      navigate("/login");
    });
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const timeRecordsData = {
    labels: timeRecords.map((record) => record.date),
    datasets: [
      {
        label: "Total Hours",
        data: timeRecords.map((record) => record.total_hours),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const loginTime = new Date(date);
    const diffInMinutes = Math.floor((now - loginTime) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${APIBASED_URL}/api/employee/`);
        const employeeData = response.data;
        setEmployees(employeeData);

        // Ensure we get exactly 3 recent logins
        const recentLogins = employeeData
          .filter((emp) => emp.lastLogin)
          .sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin))
          .slice(0, 3);

        console.log("Recent logins:", recentLogins); // Add this line to debug
        setLastLogins(recentLogins);

        // Calculate statistics
        const stats = {
          totalEmployees: employeeData.length,
          departmentCounts: {},
          activeEmployees: employeeData.filter(
            (emp) => emp.employee_status === "Active"
          ).length,
          newEmployees: employeeData.filter((emp) => {
            const joinDate = new Date(emp.employee_dateJoined);
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            return joinDate >= oneMonthAgo;
          }).length,
        };

        employeeData.forEach((employee) => {
          stats.departmentCounts[employee.employee_department] =
            (stats.departmentCounts[employee.employee_department] || 0) + 1;
        });

        setEmployeeStats(stats);
      } catch (error) {
        console.error("Error fetching employee data:", error);
        if (error.response && error.response.status === 401) {
          handleLogout();
        }
      }
    };

    fetchData();
  }, []);

  // Add this function to get the full profile picture URL
  const getProfilePicUrl = (profilePath) => {
    if (!profilePath) return null;
    return `${APIBASED_URL}${profilePath}`;
  };

  //FETCH DATA ADMIN
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      console.error("No token found in localStorage");
      return;
    }
    axios
      .get("http://localhost:7685/api/employee/protected", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        // Log the real fetched data
        console.log("Protected Data:", response.data);
      })
      .catch((error) => {
        console.error("Error fetching protected data:", error);
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

        <div className="p-6 bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="flex-grow">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Dashboard Overview
              </h2>

              {/* Analytics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Employees Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Total Employees
                      </p>
                      <h3 className="text-3xl font-bold text-gray-800 mt-1">
                        {employeeStats.totalEmployees}
                      </h3>
                      <p className="text-sm text-green-500 mt-2">
                        +2% from last month
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <FaUsers className="text-2xl text-blue-500" />
                    </div>
                  </div>
                </div>

                {/* Active Employees Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Active Employees
                      </p>
                      <h3 className="text-3xl font-bold text-gray-800 mt-1">
                        {employeeStats.activeEmployees}
                      </h3>
                      <p className="text-sm text-green-500 mt-2">
                        Currently Working
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <FaClock className="text-2xl text-green-500" />
                    </div>
                  </div>
                </div>

                {/* New Employees Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        New Employees
                      </p>
                      <h3 className="text-3xl font-bold text-gray-800 mt-1">
                        {employeeStats.newEmployees}
                      </h3>
                      <p className="text-sm text-blue-500 mt-2">Last 30 days</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <FaArrowRight className="text-2xl text-purple-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Department Distribution */}
              <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Department Distribution
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(employeeStats.departmentCounts).map(
                    ([dept, count], index) => (
                      <div key={dept} className="bg-gray-50 rounded-lg p-4">
                        <p
                          className={`${
                            colors[index % colors.length]
                          } font-medium`}
                        >
                          {dept}
                        </p>
                        <p className="text-2xl font-bold text-gray-800 mt-2">
                          {count}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Recent Logins Sidebar */}
            <div className="lg:w-80">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                  <FaClock className="mr-2 text-blue-500" />
                  Recent Employe Login
                </h3>
                <div className="space-y-4">
                  {lastLogins.map((employee, index) => (
                    <div
                      key={index}
                      className="p-4 border-l-4 border-blue-500 bg-gray-50 rounded-r-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3 capitalize">
                        {employee.profile_picture ? (
                          <img
                            src={getProfilePicUrl(employee.profile_picture)}
                            alt={`${employee.employee_firstname}'s profile`}
                            className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${employee.employee_firstname}+${employee.employee_lastname}&background=random`;
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {employee.employee_firstname[0]}
                            </span>
                          </div>
                        )}
                        <div className="flex-grow">
                          <p className="font-medium text-gray-800 truncate">
                            {employee.employee_firstname}{" "}
                            {employee.employee_lastname}
                          </p>
                          <p className="text-sm text-gray-500">
                            {employee.employee_department}
                          </p>
                          <p className="text-xs text-blue-500 mt-1">
                            {getTimeAgo(employee.lastLogin)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
