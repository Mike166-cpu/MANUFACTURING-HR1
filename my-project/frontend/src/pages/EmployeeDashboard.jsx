import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import EmployeeSidebar from "../Components/EmployeeSidebar";
import EmployeeNav from "../Components/EmployeeNav";
import Swal from "sweetalert2";
import { RotatingLines } from "react-loader-spinner";
import Calendar from "react-calendar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faUserCheck } from "@fortawesome/free-solid-svg-icons";
import "react-calendar/dist/Calendar.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

const EmployeeDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [employeeDepartment, setEmployeeDepartment] = useState("");
  const [timeRecords, setTimeRecords] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard - Home";
    const authToken = sessionStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employeeDepartment") || "Unknown";
    const employeeId = localStorage.getItem("employeeId"); 

    console.log("First Name:", firstName, "Employee Id:", employeeId);
    if (!authToken) {
      Swal.fire({
        title: "Not Logged In",
        text: "You are not logged in. Redirecting to Login Page",
        icon: "warning",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/employeelogin");
      });
    } else {
      setEmployeeFirstName(firstName);
      setEmployeeLastName(lastName);
      setEmployeeDepartment(department);
      fetchTimeTrackingRecords();
    }
  }, [navigate]);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:5000";

  const fetchTimeTrackingRecords = async () => {
    const employeeUsername = localStorage.getItem("employeeUsername");

    if (!employeeUsername) {
      return;
    }

    try {
      const response = await fetch(
        `${APIBase_URL}/api/employee/time-tracking/${employeeUsername}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch time tracking records");
      }
      const data = await response.json();

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const totalSeconds = data
        .filter((record) => {
          const recordDate = new Date(record.date);
          return (
            recordDate.getMonth() === currentMonth &&
            recordDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, record) => sum + (record.total_hours || 0), 0);

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      setTotalHours(
        totalSeconds > 0 ? `${hours}h ${minutes}m` : "No data available"
      );

      setTimeRecords(data);

      const attendanceThisMonth = data.filter((record) => {
        const recordDate = new Date(record.time_in);
        return (
          recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear &&
          record.attendance
        );
      }).length;

      setAttendanceCount(attendanceThisMonth);

      processChartData(data);
    } catch (error) {
      console.error("Error fetching time tracking records:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch time tracking records.",
      });
    }
  };

  const processChartData = (records) => {
    const grouped = {};

    records.forEach((record) => {
      const date = new Date(record.time_in);
      const dateKey = date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      if (!grouped[dateKey]) {
        grouped[dateKey] = { totalHours: 0, totalMinutes: 0 };
      }

      if (record.total_hours) {
        const hours = Math.floor(record.total_hours / 3600);
        const minutes = Math.floor((record.total_hours % 3600) / 60);
        grouped[dateKey].totalHours += hours;
        grouped[dateKey].totalMinutes += minutes;
      }
    });

    const chartDataArray = Object.keys(grouped).map((date) => {
      const totalHours =
        grouped[date].totalHours + Math.floor(grouped[date].totalMinutes / 60);
      const totalMinutes = grouped[date].totalMinutes % 60;

      return {
        date,
        hours: `${totalHours}h ${totalMinutes}m`,
        totalHours: `${totalHours}h ${totalMinutes}m`,
      };
    });

    chartDataArray.sort((a, b) => new Date(a.date) - new Date(b.date));

    setChartData(chartDataArray);
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


  return (
    <div className="flex">
      <EmployeeSidebar
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
        } relative`}
      >
        <EmployeeNav
          onSidebarToggle={handleSidebarToggle}
          isSidebarOpen={isSidebarOpen}
        />
        {isSidebarOpen && isMobileView && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-10"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <div
          className={`transition-all duration-300 ease-in-out flex-grow relative ${
            isSidebarOpen ? "md:opacity-0 sm:opacity-50" : "sm:opacity-100"
          }`}
        ></div>

        {/*MAIN CONTENT*/}
        <div className="transition-all duration-300 ease-in-out flex-grow p-5">
          <div className="rounded-lg border shadow-sm py-5 px-5">
            <h1 className="font-bold text-lg capitalize dark:text-white">
              <span className="font-normal">Welcome back,</span>{" "}
              {employeeFirstName
                ? employeeFirstName
                : "First name not available"}
              !
            </h1>
            <Link
              to="/timetracking"
              className="text-blue text-sm underline-500 hover:underline hover:text-blue-600"
            >
              Start your time tracking now.
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 pt-5">
            {/* Total Hours Card */}
            <div className="card w-full bg-blue-500 text-white shadow-lg rounded-lg">
              <div className="p-6 flex items-center">
                <FontAwesomeIcon icon={faClock} className="text-3xl mr-4" />
                <div>
                  <h2 className="text-md font-bold">
                    Total Hours Worked This Month
                  </h2>
                  <p className="text-xl font-semibold">{totalHours}</p>
                </div>
              </div>
            </div>

            {/* Attendance Count Card */}
            <div className="card w-full bg-green-500 text-white shadow-lg rounded-lg">
              <div className="p-6 flex items-center">
                <FontAwesomeIcon icon={faUserCheck} className="text-3xl mr-4" />
                <div>
                  <h2 className="text-md font-bold">
                    Your attendance this month
                  </h2>
                  <p className="text-2xl font-semibold">
                    {attendanceCount > 0
                      ? attendanceCount
                      : "No data available"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 pt-5">
            {/* Chart */}
            <div className="card w-full bg-white border rounded-lg p-6 h-80">
              {" "}
              {/* Fixed height */}
              <h1 className="text-xl font-medium pb-2 text-center">
                Work Hours This Month
              </h1>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {" "}
                  {/* Use full height */}
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      label={{
                        value: "Total Hours",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalHours" fill="#4F46E5" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p>No data available for chart.</p>
              )}
            </div>

            {/* Calendar */}
            <div className="card w-full items-center bg-white border rounded-lg p-6 h-80 text-xs">
              {" "}
              {/* Fixed height */}
              <h1 className="text-xl font-medium pb-2 text-center">Calendar</h1>
              <Calendar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
