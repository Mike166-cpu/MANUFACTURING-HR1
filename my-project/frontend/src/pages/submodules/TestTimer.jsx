import React, { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPlay, FaPause, FaClock, FaStop, FaFilter } from "react-icons/fa";
import axios from "axios";

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

const TestTimer = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const authToken = sessionStorage.getItem("employeeToken");

  const employeeUsername = localStorage.getItem("employeeUsername");
  const employeeId = localStorage.getItem("employeeId");

  useEffect(() => {
    document.title = "Test Time";
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!authToken) {
    return <Navigate to="/employeelogin" replace />;
  }

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

  const [timeIn, setTimeIn] = useState(null);
  const [timeOut, setTimeOut] = useState(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [workDuration, setWorkDuration] = useState(0);
  const [breakDuration, setBreakDuration] = useState(0);
  const [pauseStart, setPauseStart] = useState(null);
  const [timer, setTimer] = useState(0);
  const [logs, setLogs] = useState([]);
  const [filterMonth, setFilterMonth] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [schedules, setSchedules] = useState([]);
  const [isScheduledForToday, setIsScheduledForToday] = useState(false); // New state

  const rowsPerPage = 10;

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const Local = "http://localhost:5000";

  useEffect(() => {
    let interval;
    if (isClockedIn && !isPaused) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockedIn, isPaused]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${APIBASED_URL}/api/time-tracking`);
        // Transform the logs to include proper break status
        const transformedLogs = response.data.map((log) => ({
          ...log,
          isOnBreak: log.break_start && !log.break_end, // Set isOnBreak based on break_start and break_end
        }));
        setLogs(transformedLogs);
      } catch (error) {
        console.error("Failed to fetch logs", error);
      }
    };

    fetchLogs();
  }, []);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await axios.get(`${Local}/api/schedule/employee/${employeeId}`);
        const fetchedSchedules = response.data || [];
        setSchedules(fetchedSchedules);
        console.log("Schedules:", fetchedSchedules);

        // Check if the employee is scheduled for today
        const now = new Date();
        const currentDay = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        const hasScheduleToday = fetchedSchedules.some(schedule =>
          schedule.days.some(day => day.toLowerCase() === currentDay)
        );
        setIsScheduledForToday(hasScheduleToday);
      } catch (error) {
        console.error("Error fetching schedules:", error);
        setIsScheduledForToday(false); // Ensure it's false on error
      }
    };

    if (employeeId) {
      fetchSchedules();
    }
  }, [employeeId]);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isWithinWorkingHours = (schedule) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert current time to minutes
    
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    
    const scheduleStart = startHour * 60 + startMinute;
    const scheduleEnd = endHour * 60 + endMinute;
    
    return currentTime >= scheduleStart && currentTime <= scheduleEnd;
  };

  const handleClockIn = async () => {
    const now = new Date();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

    // Find schedule for today (case-insensitive comparison)
    const todaySchedule = schedules.find(schedule =>
      schedule.days.some(day => day.toLowerCase() === currentDay)
    );

    if (!todaySchedule) {
      toast.error("You do not have a schedule for today.");
      return;
    }

    // Check if current time is within working hours
    if (!isWithinWorkingHours(todaySchedule)) {
      toast.error("You can only time in during your scheduled working hours.");
      return;
    }

    setTimeIn(now);
    setIsClockedIn(true);
    setIsPaused(false);
    setTimer(0);

    try {
      await axios.post(`${Local}/api/time-tracking/start`, {
        employee_username: employeeUsername,
        employee_id: employeeId,
        start_time: now,
      });
      toast.success("Timer started successfully");
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      toast.error("Failed to start the timer");
    }
  };

  const isWithinTimeRange = () => {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= 8 && currentHour < 17; // 8 AM to 5 PM (17:00)
  };

  const handleTimeOut = async (logId) => {
    const now = new Date();

    try {
      // Make the API call with time_out only
      const response = await axios.put(
        `${APIBASED_URL}/api/time-tracking/${logId}`,
        {
          time_out: now.toISOString(), // Send only time_out to the backend
        }
      );

      console.log("Response from server:", response.data); // Debugging response

      toast.success("Time out successful");

      // Update the logs with the full updated response from the backend
      setLogs((prevLogs) =>
        prevLogs.map((log) =>
          log._id === logId
            ? { ...log, ...response.data } // Use updated data from the server
            : log
        )
      );
    } catch (error) {
      console.error("Error handling time out:", error);
      toast.error("Failed to save time out");
    }
  };

  // Update handlePause function
  const handlePause = async (logId = null) => {
    const now = new Date();

    if (logId) {
      try {
        await axios.put(`${APIBASED_URL}/api/time-tracking/${logId}`, {
          break_start: now.toISOString(),
        });

        setLogs((prevLogs) =>
          prevLogs.map((log) =>
            log._id === logId && !log.time_out
              ? {
                  ...log,
                  isOnBreak: true,
                  break_start: now.toISOString(),
                }
              : log
          )
        );
        toast.success("Break started successfully");
      } catch (error) {
        toast.error("Failed to start break");
      }
    } else {
      // Handle pause for main timer
      setPauseStart(now);
      setIsPaused(true);
      setWorkDuration((prev) => prev + timer);
      setTimer(0);
    }
  };

  // Update handleResume function
  const handleResume = async (logId = null) => {
    const now = new Date();

    if (logId) {
      try {
        const log = logs.find((log) => log._id === logId);
        if (!log.break_start) {
          toast.error("No break start time found");
          return;
        }

        await axios.put(`${APIBASED_URL}/api/time-tracking/${logId}`, {
          break_end: now.toISOString(),
        });

        setLogs((prevLogs) =>
          prevLogs.map((log) =>
            log._id === logId && !log.time_out
              ? {
                  ...log,
                  isOnBreak: false,
                  break_end: now.toISOString(),
                }
              : log
          )
        );
        toast.success("Break stopped successfully");

        // Refresh the logs to get the updated break duration
        const response = await axios.get(
          `${APIBASED_URL}/api/time-tracking`
        );
        const transformedLogs = response.data.map((log) => ({
          ...log,
          isOnBreak: log.break_start && !log.break_end,
        }));
        setLogs(transformedLogs);
      } catch (error) {
        toast.error("Failed to stop break");
      }
    } else {
      // Handle resume for main timer
      setIsPaused(false);
      setBreakDuration((prev) => prev + (now - pauseStart) / 1000);
    }
  };

  const getFilteredLogs = () => {
    const today = new Date();
    let filteredLogs;

    switch (filterMonth) {
      case "3":
        filteredLogs = logs.filter(
          (log) =>
            new Date(log.date) >= new Date(today.setMonth(today.getMonth() - 3))
        );
        break;
      case "2":
        filteredLogs = logs.filter(
          (log) =>
            new Date(log.date) >= new Date(today.setMonth(today.getMonth() - 2))
        );
        break;
      case "1":
        filteredLogs = logs.filter(
          (log) =>
            new Date(log.date) >= new Date(today.setMonth(today.getMonth() - 1))
        );
        break;
      case "week":
        filteredLogs = logs.filter(
          (log) =>
            new Date(log.date) >= new Date(today.setDate(today.getDate() - 7))
        );
        break;
      default:
        filteredLogs = [...logs];
    }

    // Sort by date and time in descending order (most recent first)
    return filteredLogs.sort(
      (a, b) => new Date(b.time_in) - new Date(a.time_in)
    );
  };

  const inputRefs = useRef([]);
  const [editingLogIndex, setEditingLogIndex] = useState(null);
  const [editedTaskName, setEditedTaskName] = useState("");

  const handleEditRow = (logIndex, taskName) => {
    setEditingLogIndex(logIndex); // Set the clicked row index
    setEditedTaskName(taskName); // Set the task name for editing
  };

  const handleSaveLog = async (logIndex) => {
    const updatedLog = logs[logIndex];
    updatedLog.label = editedTaskName; // Update the task name

    try {
      await axios.put(
        `${APIBASED_URL}/api/time-tracking/${updatedLog._id}`,
        updatedLog
      );
      toast.success("Task name updated successfully");
      setEditingLogIndex(null); // Exit edit mode
      setLogs((prevLogs) => {
        const newLogs = [...prevLogs];
        newLogs[logIndex] = updatedLog; // Update the log in the state
        return newLogs;
      });
    } catch (error) {
      toast.error("Failed to update task name");
    }
  };

  const activeSession = logs.find((log) => !log.time_out);

  const paginatedLogs = () => {
    const filteredLogs = getFilteredLogs();
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredLogs.slice(startIndex, startIndex + rowsPerPage);
  };

  const totalPages = Math.ceil(getFilteredLogs().length / rowsPerPage);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <ToastContainer />
      <EmployeeSidebar
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />

      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
        }`}
      >
        <EmployeeNav
          onSidebarToggle={handleSidebarToggle}
          isSidebarOpen={isSidebarOpen}
        />

        <div className="p-6">
          <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            {/* Header Section */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    Time Tracker
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Track your daily activities
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {activeSession ? (
                    <>
                      {/* Pause/Resume Button */}
                      <button
                        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 shadow-md font-medium
          ${
            activeSession.isOnBreak
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
                        onClick={() =>
                          activeSession.isOnBreak
                            ? handleResume(activeSession._id)
                            : handlePause(activeSession._id)
                        }
                      >
                        {activeSession.isOnBreak ? (
                          <FaPause className="w-5 h-5" />
                        ) : (
                          <FaPlay className="w-5 h-5" />
                        )}
                        {activeSession.isOnBreak ? "Stop Break" : "Start Break"}
                      </button>

                      {/* Time Out Button */}
                      <button
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-all flex items-center gap-2 font-medium"
                        onClick={() => handleTimeOut(activeSession._id)}
                      >
                        <FaStop className="w-5 h-5" />
                        Time Out
                      </button>
                    </>
                  ) : (
                    /* Time In Button */
                    <button
                      className={`px-4 py-2 rounded-lg shadow-md transition-all flex items-center gap-2 font-medium
                      ${
                        !isScheduledForToday || !isWithinTimeRange()
                          ? "bg-gray-400 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                      onClick={handleClockIn}
                      disabled={!isScheduledForToday || !isWithinTimeRange()} // Disable if not scheduled or not within time range
                    >
                      <FaClock className="w-5 h-5" />
                      Time In
                    </button>
                  )}
                  {!isScheduledForToday && !activeSession && (
                    <p className="text-red-500">
                      You are not scheduled to work today.
                    </p>
                  )}
                  {isScheduledForToday && !isWithinTimeRange() && !activeSession && (
                    <p className="text-red-500">
                      You can only time in between 8 AM and 5 PM.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Timer Controls - Modified for side-by-side layout */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>{/* Other content can go here */}</div>
              </div>
            </div>

            {/* Logs Table with Filter */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Session History
                </h3>
                <div className="flex items-center gap-2">
                  <FaFilter className="text-gray-500" />
                  <select
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-60 dark:bg-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="3">Last 3 Months</option>
                    <option value="2">Last 2 Months</option>
                    <option value="1">Last Month</option>
                    <option value="week">Last Week</option>
                  </select>
                </div>
              </div>

              <div className="overflow-hidden shadow-sm rounded-lg bg-white dark:bg-gray-800">
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                            >
                              Task
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                            >
                              Date
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                            >
                              Time
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                            >
                              Duration
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                            >
                              Break
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-800">
                          {paginatedLogs().map((log, index) => (
                            <tr
                              key={index}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                            >
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                                {editingLogIndex === index ? (
                                  <input
                                    type="text"
                                    value={editedTaskName}
                                    onChange={(e) =>
                                      setEditedTaskName(e.target.value)
                                    }
                                    ref={(el) =>
                                      (inputRefs.current[index] = el)
                                    }
                                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                                  />
                                ) : (
                                  <div className="flex items-center">
                                    <span className="truncate max-w-[150px]">
                                      {log.label}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                                {formatDate(log.date)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                  <span>
                                    {new Date(log.time_in).toLocaleTimeString(
                                      [],
                                      { hour: "2-digit", minute: "2-digit" }
                                    )}
                                  </span>
                                  <span className="hidden sm:inline">-</span>
                                  <span>
                                    {log.time_out
                                      ? new Date(
                                          log.time_out
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "Active"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                                {log.work_duration}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span>{formatTime(log.break_duration)}</span>
                                  {log.time_in && !log.time_out && (
                                    <button
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        log.isOnBreak
                                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                      }`}
                                      onClick={() =>
                                        log.isOnBreak
                                          ? handleResume(log._id)
                                          : handlePause(log._id)
                                      }
                                    >
                                      {log.isOnBreak
                                        ? "Stop Break"
                                        : "Start Break"}
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {editingLogIndex === index ? (
                                    <button
                                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                      onClick={() => handleSaveLog(index)}
                                    >
                                      Save
                                    </button>
                                  ) : (
                                    <button
                                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                      onClick={() =>
                                        handleEditRow(index, log.label)
                                      }
                                    >
                                      Edit
                                    </button>
                                  )}
                                  {!log.time_out && (
                                    <button
                                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                      onClick={() => handleTimeOut(log._id)}
                                    >
                                      Out
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Modern minimal pagination */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Showing{" "}
                      {Math.min(
                        (currentPage - 1) * rowsPerPage + 1,
                        getFilteredLogs().length
                      )}{" "}
                      to{" "}
                      {Math.min(
                        currentPage * rowsPerPage,
                        getFilteredLogs().length
                      )}{" "}
                      of {getFilteredLogs().length} entries
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className={`p-2 text-sm rounded-md transition-colors ${
                          currentPage === 1
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        Previous
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-8 h-8 text-sm rounded-md transition-colors ${
                            currentPage === i + 1
                              ? "bg-blue-100 text-blue-700"
                              : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className={`p-2 text-sm rounded-md transition-colors ${
                          currentPage === totalPages
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTimer;
