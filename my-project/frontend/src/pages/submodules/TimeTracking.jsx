import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { FaPlay, FaPause } from "react-icons/fa";
import { MdOutlineTimer } from "react-icons/md";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";

const TimeTracking = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const [timeRecords, setTimeRecords] = useState([]);
  const [timeIn, setTimeIn] = useState(null);
  const [timeOut, setTimeOut] = useState(null);
  const [totalHours, setTotalHours] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [filterDate, setFilterDate] = useState("");

  const filterRecordsByDate = () => {
    if (!filterDate) return timeRecords; // If no date is selected, return all records

    const selectedDate = new Date(filterDate);
    return timeRecords.filter((record) => {
      const recordDate = new Date(record.time_in);
      return (
        recordDate.getFullYear() === selectedDate.getFullYear() &&
        recordDate.getMonth() === selectedDate.getMonth() &&
        recordDate.getDate() === selectedDate.getDate()
      );
    });
  };

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
        fetchTimeTrackingRecords(); // Fetch updated records
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

      fetchTimeTrackingRecords(); // Fetch updated records
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

  const groupedRecords = groupRecordsByDay(filterRecordsByDate()); // Apply filter here

  const sortedDateKeys = Object.keys(groupedRecords).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB - dateA;
  });

  const handleSidebarToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const formatTimer = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div>
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

        {/* MAIN CONTENT */}
        <div className="p-5 ">
          <div className="w-full flex flex-col sm:flex-row justify-between items-center mt-1 p-5 border-b border-gray-300 bg-gray-200 rounded-lg">
            {/* Left Side: Timer and Button */}
            <div className="flex items-center">
              <MdOutlineTimer className="mr-2 text-2xl" />
              <span className="text-lg font-bold">{formatTimer(timer)}</span>
              <div className="ml-4">
                {/* Added margin for spacing between timer and button */}
                {!isClockedIn ? (
                  <button
                    onClick={handleTimeIn}
                    className="bg-blue-300 text-gray-800 font-bold py-2 px-4 rounded shadow hover:bg-blue-600 transition duration-200"
                  >
                    <FaPlay className="inline-block mr-2" /> Start
                  </button>
                ) : (
                  <button
                    onClick={handleTimeOut}
                    className="bg-red-500 text-white font-bold py-2 px-4 rounded shadow hover:bg-red-600 transition duration-200"
                  >
                    <FaPause className="inline-block mr-2" /> Stop
                  </button>
                )}
              </div>
            </div>

            {/* Right Side: Date Filter */}
            <div className="flex items-center">
              <label
                htmlFor="dateFilter"
                className="mr-2 text-lg font-semibold"
              >
                Filter by Date:
              </label>
              <input
                type="date"
                id="dateFilter"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border border-gray-300 rounded p-2"
              />
            </div>
          </div>

          <h1 className="text-2xl font-bold mt-5">All time record</h1>
          <div className="mt-5">
            {sortedDateKeys.length === 0 ? (
              <p>No time tracking records found.</p>
            ) : (
              sortedDateKeys.map((dateKey) => (
                <div key={dateKey} className="mt-4">
                  <h2 className="text-sm pl-2 font-semibold ">{dateKey}</h2>
                  <div className="border rounded-md mt-2">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                            Time In
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                            Time Out
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                            Total Hours
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {groupedRecords[dateKey].map((record) => (
                          <tr
                            key={record._id}
                            className="hover:bg-gray-100 transition duration-200"
                          >
                            <td className="px-4 py-2 text-gray-600">
                              {new Date(record.time_in).toLocaleTimeString()}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {new Date(record.time_out).toLocaleTimeString()}
                            </td>
                            <td className="px-4 py-2 text-gray-500">
                              {`${String(
                                Math.floor(record.total_hours / 3600)
                              ).padStart(2, "0")}:${String(
                                Math.floor((record.total_hours % 3600) / 60)
                              ).padStart(2, "0")}:${String(
                                record.total_hours % 60
                              ).padStart(2, "0")}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Time In and Time Out Buttons */}
        </div>
      </div>
    </div>
  );
};

export default TimeTracking;
