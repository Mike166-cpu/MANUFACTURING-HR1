import React, { useState, useEffect } from "react";
import EmployeeNavbar from "../../Components/EmployeeNavbar";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { FaPlay, FaPause } from "react-icons/fa";
import { MdOutlineTimer } from "react-icons/md";

const TimeTracking = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const [timeRecords, setTimeRecords] = useState([]);
  const [timeIn, setTimeIn] = useState(null);
  const [timeOut, setTimeOut] = useState(null);
  const [totalHours, setTotalHours] = useState(null);
  const [timer, setTimer] = useState(0); // Timer state
  const [isClockedIn, setIsClockedIn] = useState(false); // Toggle state
  const [intervalId, setIntervalId] = useState(null); // For storing the interval

  useEffect(() => {
    const authToken = localStorage.getItem("employeeToken");
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

    const storedTimeIn = localStorage.getItem("timeIn");
    if (storedTimeIn) {
      setTimeIn(new Date(storedTimeIn));
      setIsClockedIn(true);
      startTimer(new Date(storedTimeIn));
    }

    fetchTimeTrackingRecords();
  }, [navigate]);

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
    } catch (error) {
      console.error("Error fetching time tracking records:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch time tracking records.",
      });
    }
  };

  const startTimer = (startTime) => {
    const id = setInterval(() => {
      const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimer(timeElapsed);
    }, 1000);
    setIntervalId(id);
  };

  const clearTimer = () => {
    clearInterval(intervalId);
    setTimer(0);
  };

  const handleTimeIn = async () => {
    const employeeUsername = localStorage.getItem("employeeUsername");

    if (!employeeUsername) {
      alert("Employee username not found in local storage.");
      return;
    }

    const timeInNow = new Date();
    localStorage.setItem("timeIn", timeInNow.toISOString());

    try {
      const response = await fetch(
        "http://localhost:5000/api/employee/time-in",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_username: employeeUsername,
            time_in: timeInNow,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Time in successful:", data.message);
        setTimeIn(timeInNow);
        setIsClockedIn(true);
        startTimer(timeInNow);
      } else {
        const errorMessage = await response.text();
        throw new Error(errorMessage || "Time in failed");
      }
    } catch (error) {
      console.error("Error during time in:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Error: ${error.message}`,
      });
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
    const totalMilliseconds = currentTime - timeInDate;
    const totalSeconds = Math.floor(totalMilliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const totalHoursFormatted = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    setTotalHours(totalHoursFormatted);

    const employeeUsername = localStorage.getItem("employeeUsername");

    try {
      const response = await fetch(
        "http://localhost:5000/api/employee/time-out",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_username: employeeUsername,
            time_out: currentTime,
            total_hours: totalSeconds,
          }),
        }
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || "Time out failed");
      }

      localStorage.removeItem("timeIn");
      clearTimer();
      setIsClockedIn(false);

      Swal.fire({
        icon: "success",
        title: "Time Out Successful",
        text: `You have clocked out at ${currentTime.toLocaleTimeString()} and worked ${totalHoursFormatted} hours. Refresh this page.`,
      });

      fetchTimeTrackingRecords();
    } catch (error) {
      console.error("Error during time out:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    }
  };

  const formatDate = (someDate) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return someDate.toLocaleDateString(undefined, options);
  };

  const groupRecordsByDay = (records) => {
    const grouped = {};

    records.forEach((record) => {
      const date = new Date(record.time_in);
      const dateKey = formatDate(date);

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push(record);
    });

    for (const dateKey in grouped) {
      grouped[dateKey].sort(
        (a, b) => new Date(b.time_in) - new Date(a.time_in)
      );
    }

    return grouped;
  };

  const groupedRecords = groupRecordsByDay(timeRecords);

  const sortedDateKeys = Object.keys(groupedRecords).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB - dateA;
  });

  const currentDateKey = formatDate(new Date());

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
        <div className="w-full flex items-start justify-between mt-1 shadow-lg p-5 rounded-lg">
          <h2 className="flex text-2xl font-bold pt-4">Track Time</h2>

          <div className="flex items-center space-x-2">
            {isClockedIn && (
              <p className="text-lg flex space-x-4">
                <MdOutlineTimer className="w-5 h-5 mr-2 mt-1" />
                {String(Math.floor(timer / 3600)).padStart(2, "0")}:
                {String(Math.floor((timer % 3600) / 60)).padStart(2, "0")}:
                {String(timer % 60).padStart(2, "0")}
              </p>
            )}

            {!isClockedIn ? (
              <button
                className="bg-green-600 text-white py-2 px-4 rounded-lg flex items-center"
                onClick={handleTimeIn}
              >
                <FaPlay className="mr-2" /> Start
              </button>
            ) : (
              <button
                className="bg-red-600 text-white py-2 px-4 rounded-lg flex items-center"
                onClick={handleTimeOut}
              >
                <FaPause className="mr-2" /> Stop
              </button>
            )}
          </div>
        </div>

        {sortedDateKeys.map((dateKey) => (
          <div key={dateKey} className="mt-4">
            <div className="bg-gray-200 p-4 rounded-lg shadow-md">
              <h3 className="text-sm font-semibold">
                {dateKey === currentDateKey ? "Today" : dateKey}
              </h3>
            </div>

            <table className="min-w-full mt-2 bg-white border border-gray-300 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-sm">
                <tr className="text-sm">
                  <th className="py-3 px-4 text-left text-gray-600">Time In</th>
                  <th className="py-3 px-4 text-left text-gray-600">
                    Time Out
                  </th>
                  <th className="py-3 px-4 text-left text-gray-600">
                    Total Hours
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupedRecords[dateKey].map((record) => (
                  <tr
                    key={record._id}
                    className="border-b hover:bg-gray-50 transition-colors duration-200 text-sm"
                  >
                    <td className="py-2 px-4 text-gray-800 text-sm">
                      {new Date(record.time_in).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-4 text-gray-800 text-sm">
                      {record.time_out
                        ? new Date(record.time_out).toLocaleTimeString()
                        : "--"}
                    </td>
                    <td className="py-2 px-4 text-gray-800">
                      {record.total_hours
                        ? `${Math.floor(
                            record.total_hours / 3600
                          )}h ${Math.floor((record.total_hours % 3600) / 60)}m`
                        : "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeTracking;
