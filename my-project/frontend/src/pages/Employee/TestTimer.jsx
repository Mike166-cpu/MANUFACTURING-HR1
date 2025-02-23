import React, { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaPlay,
  FaPause,
  FaClock,
  FaStop,
  FaFilter,
  FaEdit,
  FaSave,
  FaSignOutAlt,
  FaCalendarAlt,
  FaCoffee,
  FaHourglassHalf,
  FaStopwatch,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
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
  const authToken = localStorage.getItem("employeeToken");

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
  const [overtime, setOvertime] = useState(0); // New state for overtime

  const rowsPerPage = 10;

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const Local = "http://localhost:7685";

  const WORK_START_HOUR = 8; // 8 AM
  const WORK_END_HOUR = 17; // 5 PM

  useEffect(() => {
    let interval;
    if (isClockedIn && !isPaused) {
      interval = setInterval(() => {
        const now = new Date();
        const cutoffTime = new Date();
        cutoffTime.setHours(17, 0, 0, 0); // Set to 5:00 PM

        if (now > cutoffTime) {
          setOvertime((prev) => prev + 1);
        } else {
          setTimer((prev) => prev + 1);
        }
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
        const response = await axios.get(
          `${APIBASED_URL}/api/time-tracking/employee/${employeeId}`
        );
        console.log("Raw API response:", response.data);

        if (!response.data) {
          console.error("No data received from API");
          return;
        }

        // Transform logs and ensure all time-related fields are properly formatted
        const transformedLogs = response.data.map((log) => {
          const timeIn = new Date(log.time_in);
          const timeOut = log.time_out ? new Date(log.time_out) : null;
          const cutoffTime = new Date(timeIn);
          cutoffTime.setHours(17, 0, 0, 0); // Set to 5:00 PM

          // Calculate overtime if time_out exists and is after cutoff
          let overtimeDuration = 0;
          if (timeOut && timeOut > cutoffTime) {
            overtimeDuration = Math.floor((timeOut - cutoffTime) / 1000); // in seconds
          }

          return {
            ...log,
            isOnBreak: log.break_start && !log.break_end,
            overtime_duration: overtimeDuration || parseInt(log.overtime_duration) || 0,
            // Ensure work_duration is formatted correctly
            work_duration: log.work_duration || "00:00"
          };
        });

        console.log("Transformed logs:", transformedLogs);
        setLogs(transformedLogs);
      } catch (error) {
        console.error("Error fetching logs:", error);
        toast.error("Failed to fetch time tracking data");
      }
    };

    if (employeeId) {
      fetchLogs();
    }
  }, [employeeId]);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await axios.get(
          `${APIBASED_URL}/api/schedule/employee/${employeeId}`
        );
        const fetchedSchedules = response.data || [];
        setSchedules(fetchedSchedules);

        // Check if the employee is scheduled for today
        const now = new Date();
        const currentDay = now
          .toLocaleDateString("en-US", { weekday: "long" })
          .toLowerCase();
        const hasScheduleToday = fetchedSchedules.some((schedule) =>
          schedule.days.some((day) => day.toLowerCase() === currentDay)
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

    const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
    const [endHour, endMinute] = schedule.endTime.split(":").map(Number);

    const scheduleStart = startHour * 60 + startMinute;
    const scheduleEnd = endHour * 60 + endMinute;

    return currentTime >= scheduleStart && currentTime <= scheduleEnd;
  };

  const handleClockIn = async () => {
    const now = new Date();
    const currentDay = now
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    // Find schedule for today (case-insensitive comparison)
    const todaySchedule = schedules.find((schedule) =>
      schedule.days.some((day) => day.toLowerCase() === currentDay)
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
    setOvertime(0); // Reset overtime

    try {
      await axios.post(`${APIBASED_URL}/api/time-tracking/start`, {
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

  const calculateOvertime = (timeOut) => {
    const outTime = new Date(timeOut);
    const cutoffTime = new Date(outTime);
    cutoffTime.setHours(WORK_END_HOUR, 0, 0, 0); // Set to 5:00 PM

    if (outTime > cutoffTime) {
      const overtimeMs = outTime - cutoffTime;
      const overtimeMinutes = Math.floor(overtimeMs / 1000 / 60); // Convert ms to minutes

      return {
        adjustedTimeOut: outTime.toISOString(),
        overtimeMinutes: overtimeMinutes,
      };
    }

    return { adjustedTimeOut: outTime.toISOString(), overtimeMinutes: 0 };
  };

  const handleTimeOut = async (logId) => {
    const now = new Date();
    const timeOutData = {
      time_out: now.toISOString(),
      overtime_duration: calculateOvertimeDuration(now), // Add this function
      status: "pending",
    };

    try {
      const response = await axios.put(
        `${APIBASED_URL}/api/time-tracking/${logId}`,
        timeOutData
      );

      if (response.data) {
        toast.success("Time out successful. Waiting for admin approval.");
        setLogs((prevLogs) =>
          prevLogs.map((log) =>
            log._id === logId
              ? {
                  ...log,
                  time_out: now.toISOString(),
                  overtime_duration: response.data.overtime_duration,
                }
              : log
          )
        );
      }
    } catch (error) {
      console.error("Time out error:", error);
      toast.error("Failed to log time out.");
    }
  };

  // Add this helper function
  const calculateOvertimeDuration = (timeOut) => {
    const outTime = new Date(timeOut);
    const cutoffTime = new Date(outTime);
    cutoffTime.setHours(17, 0, 0, 0); // Set to 5:00 PM

    if (outTime > cutoffTime) {
      return Math.floor((outTime - cutoffTime) / 1000); // Convert ms to seconds
    }
    return 0;
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
        const response = await axios.get(`${APIBASED_URL}/api/time-tracking`);
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

  const formatOvertimeDuration = (seconds) => {
    if (!seconds) return "-";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans antialiased">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
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

        <div className="p-4 md:p-6">
          <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            {/* Header Section */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                    Time Tracker
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Track your daily activities efficiently.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {activeSession ? (
                    <>
                      {/* Pause/Resume Button */}
                      <button
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
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
                          <FaPause className="w-4 h-4" />
                        ) : (
                          <FaPlay className="w-4 h-4" />
                        )}
                        {activeSession.isOnBreak ? "Stop Break" : "Start Break"}
                      </button>

                      {/* Time Out Button */}
                      <button
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors duration-200"
                        onClick={() => handleTimeOut(activeSession._id)}
                      >
                        <FaStop className="w-4 h-4" />
                        Time Out
                      </button>
                    </>
                  ) : (
                    /* Time In Button */
                     <button
                     className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
                                   ${
                                     !isScheduledForToday || !isWithinTimeRange()
                                       ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                       : "bg-green-500 hover:bg-green-600 text-white"
                                   }`}
                       onClick={handleClockIn}
                       disabled={!isScheduledForToday || !isWithinTimeRange()} // Disable if not scheduled or not within time range
                       aria-disabled={
                        !isScheduledForToday || !isWithinTimeRange()
                      }
                     >
                       <FaClock className="w-4 h-4" />
                     Time In
                     </button>
                  )}
                   {!isScheduledForToday && !activeSession && (
                    <p className="text-red-500 text-sm">
                      You are not scheduled to work today.
                    </p>
                  )}
                  {isScheduledForToday &&
                    !isWithinTimeRange() &&
                    !activeSession && (
                      <p className="text-red-500 text-sm">
                        You can only time in between 8 AM and 5 PM.
                      </p>
                    )} 
                </div>
              </div>
            </div>

            {/* Logs Table with Filter */}
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Session History
                </h3>
                <div className="flex items-center space-x-2">
                  <FaFilter className="text-gray-500" />
                  <select
                    className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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

              <div className="overflow-x-auto rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-500 dark:text-gray-400"
                      >
                        <div className="flex items-center gap-2">
                          <FaEdit className="w-4 h-4" />
                          Task
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-500 dark:text-gray-400"
                      >
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="w-4 h-4" />
                          Date
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-500 dark:text-gray-400"
                      >
                        <div className="flex items-center gap-2">
                          <FaClock className="w-4 h-4" />
                          Time
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-500 dark:text-gray-400"
                      >
                        <div className="flex items-center gap-2">
                          <FaHourglassHalf className="w-4 h-4" />
                          Duration
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-500 dark:text-gray-400"
                      >
                        <div className="flex items-center gap-2">
                          <FaCoffee className="w-4 h-4" />
                          Break
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-500 dark:text-gray-400"
                      >
                        <div className="flex items-center gap-2">
                          <FaStopwatch className="w-4 h-4" />
                          Overtime
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-500 dark:text-gray-400"
                      >
                        Actions
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-500 dark:text-gray-400"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedLogs().map((log, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200"
                      >
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                          {editingLogIndex === index ? (
                            <input
                              type="text"
                              value={editedTaskName}
                              onChange={(e) =>
                                setEditedTaskName(e.target.value)
                              }
                              ref={(el) => (inputRefs.current[index] = el)}
                              className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                            />
                          ) : (
                            <div className="flex items-center">
                              <span className="truncate max-w-[150px]">
                                {log.label}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                          {formatDate(log.date)}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <span>
                              {new Date(log.time_in).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="hidden sm:inline">-</span>
                            <span>
                              {log.time_out
                                ? new Date(log.time_out).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )
                                : "Active"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                          {log.work_duration || "00:00"}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{formatTime(log.break_duration)}</span>
                            {log.time_in && !log.time_out && (
                              <button
                                className={`px-2 py-1 text-xs rounded transition-colors duration-200 ${
                                  log.isOnBreak
                                    ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-700 dark:text-red-100 dark:hover:bg-red-600"
                                    : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-700 dark:text-blue-100 dark:hover:bg-blue-600"
                                }`}
                                onClick={() =>
                                  log.isOnBreak
                                    ? handleResume(log._id)
                                    : handlePause(log._id)
                                }
                              >
                                {log.isOnBreak ? "Stop Break" : "Start Break"}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                          {formatOvertimeDuration(log.overtime_duration)}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            {editingLogIndex === index ? (
                              <button
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors duration-200 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600"
                                onClick={() => handleSaveLog(index)}
                              >
                                <FaSave className="w-3 h-3" />
                                Save
                              </button>
                            ) : (
                              <button
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors duration-200 dark:bg-blue-700 dark:text-blue-100 dark:hover:bg-blue-600"
                                onClick={() => handleEditRow(index, log.label)}
                              >
                                <FaEdit className="w-3 h-3" />
                                Edit
                              </button>
                            )}
                            {!log.time_out && (
                              <button
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors duration-200 dark:bg-red-700 dark:text-red-100 dark:hover:bg-red-600"
                                onClick={() => handleTimeOut(log._id)}
                              >
                                <FaSignOutAlt className="w-3 h-3" />
                                Out
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                          {log.status && (
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                log.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100"
                                  : log.status === "approved"
                                  ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
                                  : "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100"
                              }`}
                            >
                              {log.status.charAt(0).toUpperCase() +
                                log.status.slice(1)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modern minimal pagination */}
              <div className="px-4 py-3 sm:px-6 border-t border-gray-200 dark:border-gray-700">
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
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors duration-200
                                  ${
                                    currentPage === 1
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                                  }`}
                    >
                      <FaChevronLeft className="w-3 h-3" />
                      Previous
                    </button>
                    <div className="flex items-center space-x-1">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-8 h-8 text-sm rounded-md transition-colors duration-200
                                      ${
                                        currentPage === i + 1
                                          ? "bg-blue-100 text-blue-700 font-semibold dark:bg-blue-700 dark:text-blue-100"
                                          : "text-gray-600 hover:bg-gray-50 border border-gray-200 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                                      }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors duration-200
                                  ${
                                    currentPage === totalPages
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                                  }`}
                    >
                      Next
                      <FaChevronRight className="w-3 h-3" />
                    </button>
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
