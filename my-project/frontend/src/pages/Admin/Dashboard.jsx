import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import BreadCrumbs from "../../Components/BreadCrumb";
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
import { GiConsoleController } from "react-icons/gi";

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

  const firstName = localStorage.getItem('firstName');
  console.log(firstName);


  localStorage.getItem("gatewayToken");


  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const Local = "http://localhost:7685";

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
    document.title = "Admin Dashboard - HRMS";
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

        // console.log("Recent logins:", recentLogins); // Add this line to debug
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

  // FETCH DATA ADMIN
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      console.error("No token found in localStorage");
      return;
    }
    axios
      .get(`${APIBASED_URL}/api/employee/protected`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: true,
      })
      .then((response) => {
        // // Log the real fetched data
        // console.log("Protected Data:", response.data);
      })
      .catch((error) => {
        console.error("Error fetching protected data:", error);
      });
  }, []);

  // FETCH ALL APPROVED DOCUMENTS
  const fetchApprovedRequests = async () => {
    try {
      const response = await fetch(
        `${APIBASED_URL}/api/uploaded-documents/approved`
      );
      const data = await response.json();
      // console.log("Approved Documents in Frontend:", data);
    } catch (error) {
      console.error("Error fetching approved requests:", error);
    }
  };

  useEffect(() => {
    fetchApprovedRequests();
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

        {/* BREADCRUMBS */}
        <div className="bg-white pb-4 px-5">
          <BreadCrumbs />
          <span className="px-4 font-bold text-2xl"> Dashboard Overview</span>
        </div>

        {/* MAIN CONTENT */}
        <div className="p-6 bg-gray-100 min-h-screen">
        
        </div>
        {/* END OF MAIN CONTENT */}
      </div>
    </div>
  );
};

export default Dashboard;
