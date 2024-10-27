import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import EmployeeSidebar from "../Components/EmployeeSidebar";
import EmployeeNav from "../Components/EmployeeNav";
import Swal from "sweetalert2";
import { RotatingLines } from "react-loader-spinner";
import Calendar from "react-calendar";
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

const EmployeeDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [employeeDepartment, setEmployeeDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [timeRecords, setTimeRecords] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [tasks, setTasks] = useState([]); // New: Task/Project state
  const [announcements, setAnnouncements] = useState([]); // New: Announcements state

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard - Home";
    const authToken = sessionStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employeeDepartment") || "Unknown";

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
      fetchTasks();
      fetchAnnouncements();
    }
  }, [navigate]);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";

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
      setTimeRecords(data);
      processChartData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching time tracking records:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch time tracking records.",
      });
      setLoading(false);
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
        totalHours: (
          grouped[date].totalHours +
          grouped[date].totalMinutes / 60
        ).toFixed(2),
      };
    });

    chartDataArray.sort((a, b) => new Date(a.date) - new Date(b.date));

    setChartData(chartDataArray);
  };

  const fetchTasks = () => {
    setTasks([
      { name: "Project A", status: "In Progress", deadline: "2024-10-20" },
      { name: "Task B", status: "Completed", deadline: "2024-10-10" },
    ]);
  };

  const fetchAnnouncements = () => {
    setAnnouncements([
      { message: "Company holiday on 2024-11-01", date: "2024-10-15" },
      { message: "HR Policy update", date: "2024-10-10" },
    ]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <RotatingLines
          strokeColor="#4F46E5"
          strokeWidth="5"
          animationDuration="1"
          width="40"
          visible={true}
        />
      </div>
    );
  }

  return (
    <div className="flex">
      <EmployeeSidebar
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-72" : "ml-0"
        }`}
      >
        <EmployeeNav
          onSidebarToggle={handleSidebarToggle}
          isSidebarOpen={isSidebarOpen}
        />
        <div
          className={`transition-all duration-300 ease-in-out flex-grow ${
            isSidebarOpen ? "ml-0" : "ml-0"
          } p-4`}
        >
          <div className="rounded-lg border shadow-sm py-5 px-5">
            <h1 className="font-bold text-lg">
              <span className="font-normal">Welcome back,</span>{" "}
              {employeeFirstName
                ? employeeFirstName
                : "First name not available"}
              !
            </h1>
            <Link to="/timetracking" className="text-blue text-sm underline-500 hover:underline hover:text-blue-600">
              Start your time tracking now.
            </Link>
          </div>

          <div className="flex flex-col md:flex-row justify-start py-5 flex-wrap gap-4 md:gap-8">
            <div className="card w-full max-w-xs md:max-w-md bg-white border rounded-lg p-6 text-xs">
              <h1 className="text-xl font medium pb-2 text-center">
                Time tracking summary
              </h1>

              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      label={{
                        value: "Hours",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      formatter={(value) => [value, "Total Hours Worked"]}
                    />
                    <Legend />
                    <Bar
                      dataKey="totalHours"
                      fill="#8884d8"
                      name="Total Hours Worked"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div>No time records available.</div>
              )}
            </div>

            <div className="card w-full max-w-xs md:max-w-md border bg-white rounded-lg p-6 items-center">
              <h2 className="text-xl font-bold text-center text-gray-800 mb-4">
                Calendar
              </h2>
              <Calendar
                onChange={(date) => console.log(date)}
                value={new Date()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
