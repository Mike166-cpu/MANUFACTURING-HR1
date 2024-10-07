import React, { useState, useEffect } from "react";
import EmployeeNavbar from "../../Components/EmployeeNavbar";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const TimeTracking = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const [timeRecords, setTimeRecords] = useState([]);
  const [timeIn, setTimeIn] = useState(null);
  const [timeOut, setTimeOut] = useState(null);
  const [totalHours, setTotalHours] = useState(null);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      Swal.fire({
        title: "Not Logged In",
        text: "You are not logged in. Redirecting to Login Page",
        icon: "warning",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/employeelogin");
      });
    }

    const fetchTimeTrackingRecords = async () => {
      const employeeUsername = localStorage.getItem("employeeUsername");

      if (!employeeUsername) {
        return; // Don't fetch if the username is not available
      }

      try {
        const response = await fetch(`http://localhost:5000/api/employee/time-tracking/${employeeUsername}`);
        if (!response.ok) {
          throw new Error("Failed to fetch time tracking records");
        }
        const data = await response.json();
        setTimeRecords(data);
      } catch (error) {
        console.error("Error fetching time tracking records:", error);
      }
    };

    // Check for stored time in
    const storedTimeIn = localStorage.getItem("timeIn");
    if (storedTimeIn) {
      setTimeIn(new Date(storedTimeIn));
    }

    fetchTimeTrackingRecords();
  }, [navigate]);

  const handleTimeIn = async () => {
    const employeeUsername = localStorage.getItem("employeeUsername");

    if (!employeeUsername) {
      alert("Employee username not found in local storage.");
      return;
    }

    const timeInNow = new Date();
    localStorage.setItem("timeIn", timeInNow.toISOString());

    try {
      const response = await fetch("http://localhost:5000/api/employee/time-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_username: employeeUsername,
          time_in: timeInNow,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Time in successful:", data.message);
        setTimeIn(timeInNow);
      } else {
        const errorMessage = await response.text();
        throw new Error(errorMessage || "Time in failed");
      }
    } catch (error) {
      console.error("Error during time in:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleTimeOut = async () => {
    const currentTime = new Date();
    setTimeOut(currentTime);

    const timeInStored = localStorage.getItem("timeIn");
    if (!timeInStored) {
      Swal.fire({
        icon: "warning",
        title: "Time In Missing",
        text: "You must clock in before you can clock out.",
      });
      return;
    }

    const timeInDate = new Date(timeInStored);
    const total = (currentTime - timeInDate) / (1000 * 60 * 60);
    setTotalHours(total.toFixed(2));

    const employeeUsername = localStorage.getItem("employeeUsername");

    try {
      const response = await fetch("http://localhost:5000/api/employee/time-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_username: employeeUsername,
          time_out: currentTime,
          total_hours: total.toFixed(2),
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || "Time out failed");
      }

      // Clear stored time in
      localStorage.removeItem("timeIn");

      Swal.fire({
        icon: "success",
        title: "Time Out Successful",
        text: `You have clocked out at ${currentTime.toLocaleTimeString()} and worked ${total.toFixed(2)} hours.`,
      });
    } catch (error) {
      console.error("Error during time out:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    }
  };

  return (
    <div>
      <EmployeeNavbar
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      <div
        className={`transition-all duration-300 ease-in-out flex-grow p-4 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div className="flex flex-col items-center space-y-4 mt-10">
          <h2 className="text-2xl font-bold">Time Tracking</h2>
          <button onClick={handleTimeIn} className="btn btn-success">
            Time In
          </button>
          <button onClick={handleTimeOut} className="btn btn-error">
            Time Out
          </button>
          {timeIn && <p>Time In: {new Date(timeIn).toLocaleTimeString()}</p>}
          {timeOut && <p>Time Out: {new Date(timeOut).toLocaleTimeString()}</p>}
          {totalHours && <p>Total Hours Worked: {totalHours}</p>}
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-bold">Your Time Tracking Records</h3>
          <table className="min-w-full bg-white border border-gray-300 mt-4">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">Date</th>
                <th className="border border-gray-300 px-4 py-2">Time In</th>
                <th className="border border-gray-300 px-4 py-2">Time Out</th>
                <th className="border border-gray-300 px-4 py-2">Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {timeRecords.length > 0 ? (
                timeRecords.map((record, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{new Date(record.time_in).toLocaleDateString()}</td>
                    <td className="border border-gray-300 px-4 py-2">{new Date(record.time_in).toLocaleTimeString()}</td>
                    <td className="border border-gray-300 px-4 py-2">{record.time_out ? new Date(record.time_out).toLocaleTimeString() : "N/A"}</td>
                    <td className="border border-gray-300 px-4 py-2">{record.total_hours ? record.total_hours : "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="border border-gray-300 px-4 py-2 text-center">No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TimeTracking;
