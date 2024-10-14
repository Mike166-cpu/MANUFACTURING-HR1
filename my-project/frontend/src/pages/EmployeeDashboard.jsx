import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import EmployeeNavbar from "../Components/EmployeeNavbar";
import Swal from "sweetalert2";
import { RotatingLines } from 'react-loader-spinner';
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

  const navigate = useNavigate();

  useEffect(() => {
    const authToken = localStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employee_department") || "Unknown";

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
    } else {
      // Set employee details from localStorage
      setEmployeeFirstName(firstName);
      setEmployeeLastName(lastName);
      setEmployeeDepartment(department);
      fetchTimeTrackingRecords(); // Fetch time records
    }
  }, [navigate]);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchTimeTrackingRecords = async () => {
    const employeeUsername = localStorage.getItem("employeeUsername");

    if (!employeeUsername) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/employee/time-tracking/${employeeUsername}`
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
        const hours = Math.floor(record.total_hours / 3600); // Convert total_hours to hours
        const minutes = Math.floor((record.total_hours % 3600) / 60); // Get remaining minutes
        grouped[dateKey].totalHours += hours;
        grouped[dateKey].totalMinutes += minutes;
      }
    });

    const chartDataArray = Object.keys(grouped).map((date) => {
      const totalHours =
        grouped[date].totalHours + Math.floor(grouped[date].totalMinutes / 60);
      const totalMinutes = grouped[date].totalMinutes % 60; // Remaining minutes after converting to hours

      return {
        date,
        hours: `${totalHours}h ${totalMinutes}m`, // Format as "Xh Ym"
        totalHours: (
          grouped[date].totalHours +
          grouped[date].totalMinutes / 60
        ).toFixed(2), // Total hours for the chart
      };
    });

    // Sort the data by date ascending
    chartDataArray.sort((a, b) => new Date(a.date) - new Date(b.date));

    setChartData(chartDataArray);
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
    <div>
      <EmployeeNavbar
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <div
        className={`transition-all duration-300 ease-in-out flex-grow ${
          isSidebarOpen ? "ml-64" : "ml-0"
        } p-4`}
      >
        <div className="w-full flex items-start justify-between mt-1 shadow-md p-5 rounded-lg">
          <h2 className="flex text-2xl font-bold pt-4">Dashboard</h2>
        </div>
        <div className="flex justify-start py-5 flex-wrap gap-8">
          {/* TIME TRACKING SUMMARY*/}
          <div className="card w-full max-w-md bg-white border rounded-lg p-6 text-xs">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Your time tracking summary
            </h2>
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

          {/* Calendar Card */}
          <div className=" card w-full max-w-md border  bg-white rounded-lg p-6 items-center">
            <h2 className="text-xl font-bold text-center text-gray-800 mb-4">
              Calendar
            </h2>
            <Calendar
              onChange={(date) => console.log(date)}
              value={new Date()}
            />
          </div>

          {/* TIME TRACKING SUMMARY*/}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
