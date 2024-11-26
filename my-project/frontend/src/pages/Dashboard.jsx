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
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
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

  const [count, setCount] = useState(0);
  const [progress, setProgress] = useState(0);

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";

  const colors = [
    "text-red-500",
    "text-blue-500",
    "text-green-500",
    "text-yellow-500",
    "text-purple-500",
  ];

  const getRandomColor = () =>
    colors[Math.floor(Math.random() * colors.length)];

  useEffect(() => {
    document.title = "Dashboard";

    const token = sessionStorage.getItem("adminToken");
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
      fetchIncidentReports();
    }
  }, [navigate]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${APIBASED_URL}/api/employee`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchTimeRecords = async () => {
    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/employee/time-tracking`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );
      setTimeRecords(response.data);
    } catch (error) {
      console.error("Error fetching time records:", error);
    }
  };

  const fetchIncidentReports = async () => {
    try {
      const response = await axios.get(`${APIBASED_URL}/api/incidentreport/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      setIncidentReport(response.data);
    } catch (error) {
      console.error("Error fetching incident reports:", error);
    }
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

  // Chart data for Incident Reports
  const groupByDate = (reports) => {
    const grouped = reports.reduce((acc, report) => {
      const date = new Date(report.date).toLocaleDateString(); // Format date as needed
      if (acc[date]) {
        acc[date]++;
      } else {
        acc[date] = 1;
      }
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, count]) => ({
      date,
      count,
    }));
  };

  const incidentReportData = {
    labels: groupByDate(incidentReport).map((entry) => entry.date), // Labels are the grouped dates
    datasets: [
      {
        label: "Incidents",
        data: groupByDate(incidentReport).map((entry) => entry.count), // Data is the count of incidents per day
        borderColor: "rgba(255, 99, 132, 0.6)", // Line color
        backgroundColor: "rgba(255, 99, 132, 0.2)", // Fill color under the line
        fill: true, // Fill area under the line
        tension: 0.4, // Smooth the line curve
      },
    ],
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
    const target = timeRecords.length;
    const duration = 200;
    const stepTime = duration / target;

    let current = 0;
    const interval = setInterval(() => {
      if (current < target) {
        current++;
        setCount(current);
      } else {
        clearInterval(interval);
      }
    }, stepTime);

    setProgress(Math.min(target / 100, 1));

    return () => clearInterval(interval);
  }, [timeRecords.length]);

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

        <div className="min-h-screen">
          <div className="m-5 p-5 border rounded-lg bg-white">
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <div className="px-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              <div
                className="bg-white p-6 rounded shadow cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-lg"
                onClick={() => navigate("/employeeInfo")}
              >
                <FaUsers className={`text-3xl ${getRandomColor()}`} />{" "}
                <div className="flex gap-x-5">
                  <h2 className="font-bold text-lg mb-2 text-gray-700">
                    Total Employees
                  </h2>
                  <p className="text-lg text-gray-500">{employees.length}</p>
                </div>
              </div>

              <div
                className="bg-white p-6 rounded-xl shadow-md cursor-pointer transform transition duration-300 "
                onClick={() => navigate("/attendancetime")}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-600">
                    Total Time Records
                  </h2>
                </div>

                <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                    style={{ width: `${progress * 100}%` }}
                  ></div>
                </div>

                <div className="flex flex-col items-center mt-4">
                  <p className="text-3xl font-semibold text-gray-800">
                    {count}
                  </p>{" "}
                  <p className="text-sm text-gray-500 mt-1">Records</p>
                </div>
                <div className="mt-4 text-center">
                  <button className="text-sm text-blue-500 hover:underline focus:outline-none flex items-center">
                    See Details
                    <FaArrowRight className="ml-2" />
                  </button>
                </div>
              </div>

              <div
                className="bg-white p-6 rounded shadow cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-lg"
                onClick={() => navigate("/incidentreport")}
              >
                <FaExclamationTriangle
                  className={`text-3xl ${getRandomColor()}`}
                />{" "}
                <div className="flex gap-x-5">
                  <h2 className="font-bold text-lg mb-2 text-gray-700">
                    Incident Report
                  </h2>
                  <p className="text-lg text-gray-500">
                    {incidentReport.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mt-5 pb-5">
              {/* left container */}

              <div className="flex-row md:flex-row gap-6 ">
                <div className="bg-white p-5 mb-10 rounded shadow">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Incident Reports
                  </h3>
                  <Line
                    data={incidentReportData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          position: "top",
                        },
                        tooltip: {
                          callbacks: {
                            label: (tooltipItem) =>
                              `${tooltipItem.raw} incidents`,
                          },
                        },
                      },
                    }}
                  />
                </div>
                <div className="bg-white mb-5 p-5 rounded shadow">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Time Records
                  </h3>
                  <Bar
                    data={timeRecordsData}
                    options={{ responsive: true, maintainAspectRatio: true }}
                  />
                </div>
              </div>

              {/* right container */}
              <div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
