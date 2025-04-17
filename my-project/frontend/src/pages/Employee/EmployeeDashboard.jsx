import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Swal from "sweetalert2";
import Breadcrumb from "../../Components/BreadCrumb";
import axios from "axios";
import { FaArrowRightLong } from "react-icons/fa6";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
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
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const position = localStorage.getItem("employeePosition");
  const LOCAL = "http://localhost:7685";
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    document.title = "Dashboard - Home";
  
    // Get employee data from localStorage
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employeeDepartment") || "Unknown";
    
    // Update the state with the data
    setEmployeeFirstName(firstName);
    setEmployeeLastName(lastName);
    setEmployeeDepartment(department);
  
    // Stop loading screen
    setTimeout(() => setLoading(false), 2000);
  }, []);


  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
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

  // MAIN FUNCTIONS HERE
  const [stats, setAttendanceStats] = useState({
    on_time: 0,
    late: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  //FETCH ATTENDANCE FOR CARDS
  const percentage =
    stats.total > 0 ? Math.round((stats.on_time / stats.total) * 100) : 0;
  const trend = stats.trend || "up"; // Assume trend data is passed in props

  const fetchAttendanceStats = async () => {
    const employeeId = localStorage.getItem("employeeId");
    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/timetrack/attendance-stats/${employeeId}`
      );

      setAttendanceStats(response.data);
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
    }
  };

  useEffect(() => {
    fetchAttendanceStats();
  }, []);

  const goToProfile = () => {
    navigate("/userProfile");
  };
  const [profileImage, setProfileImage] = useState({});

  const fetchUser = async () => {
    const employeeId = localStorage.getItem("employeeId");
    console.log(employeeId);

    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/hr/user/${employeeId}`
      );
      setProfileImage(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Error", error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // FETCH LEAVE STATUS
  const [leaveStatus, setLeaveStatus] = useState({});

  const fetchLeaveStatus = async () => {
    const employeeId = localStorage.getItem("employeeId");
    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/leave/latest-leave/${employeeId}`
      );
      setLeaveStatus(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching leave status:", error);
    }
  };

  useEffect(() => {
    fetchLeaveStatus();
  }, []);

  //FETCHING HOLIDAYS
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);

  useEffect(() => {
    const fetchUpcomingHolidays = async () => {
      try {
        const response = await axios.get(
          "https://date.nager.at/api/v3/PublicHolidays/2025/PH" // Correct API URL
        );

        const today = new Date().toISOString().split("T")[0];

        // Filter upcoming holidays
        const futureHolidays = response.data.filter(
          (holiday) => holiday.date >= today
        );

        // Sort by date
        futureHolidays.sort((a, b) => new Date(a.date) - new Date(b.date));

        setUpcomingHolidays(futureHolidays.slice(0, 6));
      } catch (error) {
        console.error("Error fetching holidays:", error.message);
      }
    };

    fetchUpcomingHolidays();
  }, []);

  //Fetch attendance
  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
  };

  const renderEventContent = (eventInfo) => {
    const eventType = eventInfo.event.title;

    if (eventType === "First Day of Work") {
      return (
        <div className="p-1 rounded-md text-white flex items-center bg-purple-600">
          <span className="text-xs truncate">First Day of Work</span>
        </div>
      );
    }

    // Return empty content for background events (working/non-working days)
    if (eventInfo.event.display === "background") {
      return (
        <div className="text-xs font-semibold px-1 py-0.5 text-gray-600">
          {eventType}
        </div>
      );
    }

    // For regular events (attendance records)
    let bgColor = "";
    let icon = "";

    switch (eventType) {
      case "Absent":
        bgColor = "bg-red-500";
        icon = "❌";
        break;
      case "Present":
        bgColor = "bg-green-500";
        icon = "✅";
        break;
      case "Scheduled Work":
        bgColor = "bg-blue-500";
        icon = "📅";
        break;
      default:
        bgColor = "bg-gray-500";
        icon = "📆";
    }

    return (
      <div
        className={`p-1 rounded-md text-white flex items-center ${bgColor}`}
        title={`${eventType} on ${eventInfo.event.start.toLocaleDateString()}`}
      >
        <span className="mr-1">{icon}</span>
        <span className="text-xs truncate">{eventType}</span>
      </div>
    );
  };

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

        <div className="pb-2 px-5">
          <Breadcrumb />
          <h1 className="font-bold text-2xl px-5">Overview</h1>
        </div>

        {/* MAIN CONTENT */}
        {/* CARDS SECTION */}
        <div className="transition-all duration-300 bg-gray-100 ease-in-out flex-grow p-2 sm:p-5">
          {/* 1st col */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            <div className="bg-white col-span-1 rounded-lg mb-6 p-4">
              {/* PROFILE */}
              <div className="bg-white rounded-lg mb-6 p-4 shadow-md">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="flex-shrink-0 mb-4 md:mb-0">
                    {profileImage.profilePicture ? (
                      <img
                        src={profileImage.profilePicture}
                        alt="Profile"
                        className="h-24 w-24 rounded-full object-cover border-4 border-blue-100"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-2xl font-bold border-4 border-blue-100">
                        {employeeFirstName.charAt(0)}
                        {employeeLastName.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="md:ml-6 text-center md:text-left">
                    <h2 className="text-xl font-bold text-gray-800">
                      {employeeFirstName} {employeeLastName}
                    </h2>
                    <p className="text-gray-600 mb-1">{position}</p>

                    <button
                      onClick={goToProfile}
                      className="py-2 text-xs text-black underline rounded-md flex items-center mx-auto md:mx-0 space-x-2"
                    >
                      <span>View Profile</span>
                      <FaArrowRightLong />
                    </button>
                  </div>
                </div>
              </div>

              {/* STATS */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {/* on timecard */}
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 mr-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        On Time
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        {stats.on_time}
                      </p>
                    </div>
                  </div>

                  {/* Mini progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {stats.total > 0
                          ? `${percentage}% of total attendance`
                          : "No attendance data"}
                      </span>
                      <span
                        className={`flex items-center text-sm font-bold ${
                          trend === "up" ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {trend === "up" ? (
                          <FaArrowUp className="ml-1" />
                        ) : (
                          <FaArrowDown className="ml-1" />
                        )}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* late card */}
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-300">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-red-100 mr-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-orange-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Late</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {stats.late}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {stats.total > 0
                        ? `${Math.round(
                            (stats.late / stats.total) * 100
                          )}% of total attendance`
                        : "No attendance data"}
                    </span>

                    {/* Parabolic Curve Indicator */}
                    <div className="flex items-center">
                      {stats.trend === "parabolic_up" ? (
                        // Parabolic Up 📈
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6 text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16c4-8 12-8 16 0"
                          />
                        </svg>
                      ) : stats.trend === "parabolic_down" ? (
                        // Parabolic Down 📉
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 8c4 8 12 8 16 0"
                          />
                        </svg>
                      ) : (
                        // Stable ➖
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 12h16"
                          />
                        </svg>
                      )}
                      <span className="ml-1 text-xs font-semibold">
                        {stats.trend === "parabolic_up"
                          ? "Accelerating Lateness"
                          : stats.trend === "parabolic_down"
                          ? "Improving Attendance"
                          : "Stable"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 mr-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Total Attendance
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        {stats.total}
                      </p>
                    </div>
                  </div>

                  {/* Zigzag arrow indicator */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      All recorded attendance entries
                    </span>
                    <div className="flex items-center text-green-500">
                      {/* Zigzag Arrow */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 18l6-6 4 4 8-8"
                        />
                      </svg>
                      <span className="ml-1 text-xs font-semibold">
                        {stats.total > 50 ? "+ High Activity" : "Stable"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 mr-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-pink-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Total Work Hours
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        {stats.total_hours}
                      </p>
                    </div>
                  </div>

                  {/* Momentum Arrow Indicator */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      All recorded attendance entries
                    </span>
                    <div className="flex items-center">
                      {stats.trend === "up" ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6 text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      )}
                      <span className="ml-1 text-xs font-semibold">
                        {stats.trend === "up" ? "Increasing" : "Decreasing"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* end of 1st column */}

            {/* 2nd col */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              {/* Holidays */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="card-body p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h2 className="card-title text-black font-bold text-md">
                      Upcoming Holidays
                    </h2>
                    <div className="badge badge-accent">Calendar</div>
                  </div>

                  <ul className="mt-4 space-y-3">
                    {upcomingHolidays.length > 0 ? (
                      upcomingHolidays.map((holiday, index) => (
                        <li
                          key={index}
                          className="card bg-base-200 hover:bg-base-300 transition-colors"
                        >
                          <div className="card-body p-2 px-5">
                            <h3 className="font-medium text-sm">
                              {holiday.localName}
                            </h3>
                            <time className="text-xs text-base-content/70">
                              {new Date(holiday.date)
                                .toLocaleDateString("en-US", {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })
                                .toUpperCase()}
                            </time>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="card bg-base-200 border-2 border-dashed border-base-300">
                        <div className="card-body p-6 items-center">
                          <span className="text-base-content/50">
                            No upcoming holidays
                          </span>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {selectedEvent && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                  <h3 className="text-xl font-bold mb-4">
                    {selectedEvent.title}
                  </h3>
                  <p>Date: {selectedEvent.start.toLocaleDateString()}</p>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
