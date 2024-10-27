import React, { useEffect, useState } from "react";
import useIdleLogout from "../hooks/useIdleLogout";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import axios from "axios";
import { FaUsers, FaClock, FaExclamationTriangle } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [timeRecords, setTimeRecords] = useState([]);
  const [incidentReport, setIncidentReport] = useState([]);

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";

  const colors = [
    "text-red-500",
    "text-blue-500",
    "text-green-500",
    "text-yellow-500",
    "text-purple-500",
  ];

  const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

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
      const response = await axios.get(
        `${APIBASED_URL}/api/incidentreport/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );
      setIncidentReport(response.data);
    } catch (error) {
      console.error("Error fetching incident reports:", error);
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  
  const timeRecordsData = {
    labels: timeRecords.map(record => record.date),
    datasets: [
      {
        label: "Total Hours",
        data: timeRecords.map(record => record.total_hours),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  // Chart data for Incident Reports
  const incidentReportData = {
    labels: incidentReport.map(report => report.date), 
    datasets: [
      {
        label: "Incidents",
        data: incidentReport.map(report => 1), 
        backgroundColor: "rgba(255, 99, 132, 0.6)",
      },
    ],
  };

  return (
    <div className="flex">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? "ml-80" : "ml-0"
        }`}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="min-h-screen">
          <div className="m-5 p-5 border rounded-lg">
            <h1 className="text-2xl font-bold">Welcome to Dashboard</h1>
          </div>
          <div className="px-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              <div
                className="bg-white p-6 rounded shadow cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-lg"
                onClick={() => navigate("/employeeInfo")}
              >
                <FaUsers className={`text-3xl ${getRandomColor()}`} />{" "}
                <div className="flex gap-x-5">
                  <h2 className="font-bold text-xl mb-2 text-gray-700">
                    Total Employees
                  </h2>
                  <p className="text-lg text-gray-500">{employees.length}</p>
                </div>
              </div>

              <div
                className="bg-white p-6 rounded shadow cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-lg"
                onClick={() => navigate("/attendancetime")}
              >
                <FaClock className={`text-3xl ${getRandomColor()}`} />{" "}
                <div className="flex gap-x-5">
                  <h2 className="font-bold text-xl mb-2 text-gray-700">
                    Total Time Records
                  </h2>
                  <p className="text-lg text-gray-500">{timeRecords.length}</p>
                </div>
              </div>

              <div
                className="bg-white p-6 rounded shadow cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-lg"
                onClick={() => navigate("/incidentreport")}
              >
                <FaExclamationTriangle className={`text-3xl ${getRandomColor()}`} />{" "}
                <div className="flex gap-x-5">
                  <h2 className="font-bold text-xl mb-2 text-gray-700">
                    Incident Report
                  </h2>
                  <p className="text-lg text-gray-500">{incidentReport.length}</p>
                </div>
              </div>
            </div>

            {/* Data Charts Section */}
            <div className="mt-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded shadow">
                  <h3 className="text-lg font-semibold text-gray-700">Time Records</h3>
                  <Bar data={timeRecordsData} options={{ responsive: true, maintainAspectRatio: true }} />
                </div>
                <div className="bg-white p-5 rounded shadow">
                  <h3 className="text-lg font-semibold text-gray-700">Incident Reports</h3>
                  <Bar data={incidentReportData} options={{ responsive: true, maintainAspectRatio: true }} />
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
