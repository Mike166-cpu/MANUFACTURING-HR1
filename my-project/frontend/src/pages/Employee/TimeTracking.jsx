import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Swal from "sweetalert2";
import Breadcrumb from "../../Components/BreadCrumb";
import Calendar from "react-calendar";
import axios from "axios";
import { formatDuration, calculateDuration } from "../../utils/timeUtils";
import Breadcrumbs from "../../Components/BreadCrumb";
import { FaPlus } from "react-icons/fa6";

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

const TimeTracking = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [employeeDepartment, setEmployeeDepartment] = useState("");
  const [timeTracking, setTimeTracking] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [timeTrackingHistory, setTimeTrackingHistory] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [filterDateRange, setFilterDateRange] = useState("3 Months");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard - Home";
    const authToken = localStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employeeDepartment") || "Unknown";
    const employeeId = localStorage.getItem("employeeId");

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
    }
  }, [navigate]);

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

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const fetchActiveSession = async () => {
    try {
      const employeeId = localStorage.getItem("employeeId");
      const response = await axios.get(
        `${APIBASED_URL}/api/timetrack/active-session/${employeeId}`
      );
      setActiveSession(response.data);
    } catch (error) {
      console.error("Error fetching active session:", error);
    }
  };

  useEffect(() => {
    const employeeId = localStorage.getItem("employeeId");
    if (employeeId) {
      fetchActiveSession();
    }
  }, []);

  useEffect(() => {
    const fetchTimeTrackingHistory = async () => {
      try {
        const employeeId = localStorage.getItem("employeeId");
        const response = await axios.get(
          `${APIBASED_URL}/api/timetrack/history/${employeeId}`
        );
        setTimeTrackingHistory(response.data);
      } catch (error) {
        console.error("Error fetching time tracking history:", error);
      }
    };

    fetchTimeTrackingHistory();
  }, [activeSession]);

  const calculateDateRange = (range) => {
    const date = new Date();
    switch (range) {
      case "1 Month":
        date.setMonth(date.getMonth() - 1);
        break;
      case "3 Months":
        date.setMonth(date.getMonth() - 3);
        break;
      case "6 Months":
        date.setMonth(date.getMonth() - 6);
        break;
      default:
        date.setMonth(date.getMonth() - 3);
    }
    return date;
  };

  const filteredRecords = timeTrackingHistory.filter((record) => {
    const recordDate = new Date(record.time_in);
    const dateRange = calculateDateRange(filterDateRange);
    if (filterStatus === "All") return recordDate >= dateRange;
    return (
      record.status.toLowerCase() === filterStatus.toLowerCase() &&
      recordDate >= dateRange
    );
  });

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Time In Function
  const timeIn = async () => {
    
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      if (
        currentHour < 8 ||
        (currentHour === 17 && currentMinute > 0) ||
        currentHour > 17
      ) {
        Swal.fire({
          title: "Invalid Time",
          text: "Time-in is only allowed between 8:00 AM and 5:00 PM",
          icon: "info",
        });
        return;
      }

      const employeeId = localStorage.getItem("employeeId");
      const firstName = localStorage.getItem("employeeFirstName");
      const lastName = localStorage.getItem("employeeLastName");
      const position = localStorage.getItem("employeePosition");

      const response = await axios.post(
        `${LOCAL}/api/timetrack/time-in`,
        {
          employee_id: employeeId,
          employee_firstname: employeeFirstName,
          employee_lastname: employeeLastName,
          position: position,
        }
      );

      setActiveSession(response.data.session);
      Swal.fire("Success!", response.data.message, "success");
    } catch (error) {
      console.error("Error recording Time In:", error);
    
      if (error.response && error.response.status === 400) {
        // Use "warning" for validation issues (e.g., duplicate entry, time restrictions)
        Swal.fire({
          title: "Warning",
          text: error.response.data.message || "Time In validation failed.",
          icon: "warning", // ⬅ Changed from "error" to "warning"
        });
      } else {
        // Keep "error" for actual system failures (e.g., server errors)
        Swal.fire({
          title: "Error!",
          text: "Failed to record Time In. Please try again.",
          icon: "error",
        });
      }
    }
  };

  // Time Out Function
  const timeOut = async () => {
    try {
      const employeeId = localStorage.getItem("employeeId");
      const response = await axios.put(
        `${APIBASED_URL}/api/timetrack/time-out`,
        {
          employee_id: employeeId,
        }
      );

      setActiveSession(null);
      Swal.fire("Success!", "Time Out recorded successfully!", "success");
    } catch (error) {
      console.error("Error recording Time Out:", error);
      Swal.fire(
        "Error!",
        error.response?.data?.message || "Failed to record Time Out.",
        "error"
      );
    }
  };

  const formatMinuteDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const [selectedRows, setSelectedRows] = useState([]);
  const toggleRowSelection = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
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

        <div className="p-5 font-bold text-2xl">
          <Breadcrumbs />

          <h1 className="px-3">Start Your Time Tracking</h1>
        </div>

        {/* MAIN CONTENT */}
        <div className="transition-all bg-gray-100 duration-300 ease-in-out flex-grow p-5">
          {/* Time Tracking Controls */}
          <div className="card bg-base-100 shadow-sm mb-6 border-2">
            <div className="card-body flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-left">
                <h2 className="text-lg font-semibold">Today:</h2>
                <span className="text-xl font-bold">
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={activeSession ? timeOut : timeIn}
                  className={`btn py-2 px-4 text-lg font-semibold ${
                    activeSession ? "btn-error" : "btn-success"
                  } flex items-center space-x-2`}
                >
                  <FaPlus />
                  <span>{activeSession ? "Time Out" : "Time In"}</span>
                </button>

                <button
                  className="bg-blue-300 py-2 px-4 rounded-md font-semibold hover:bg-blue-400 transition-all duration-300 ease-in-out text-lg"
                  onClick={() => navigate("/request-form")}
                >
                  Manual Time Entries
                </button>
              </div>
            </div>
          </div>

          {/* Active Session Card */}
          {activeSession && (
            <div className="card bg-base-100 shadow-sm mb-6">
              <div className="card-body">
                <h2 className="card-title text-success">
                  <i className="fas fa-clock mr-2"></i> Active Session
                </h2>
                <div className="stats shadow">
                  <div className="stat">
                    <div className="stat-title">Time In</div>
                    <div className="stat-value text-success">
                      {new Date(activeSession.time_in).toLocaleTimeString()}
                    </div>
                    <div className="stat-desc">
                      {new Date(activeSession.time_in).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Time Tracking History Table */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-4">
              <select
                className="select select-bordered"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <select
                className="select select-bordered"
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
              >
                <option value="1 Month">Last 1 Month</option>
                <option value="3 Months">Last 3 Months</option>
                <option value="6 Months">Last 6 Months</option>
              </select>
            </div>
            <div></div>
          </div>

          {/* TABLE */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="text-sm border-b-2 border-gray-100">
                      <th>{""}</th>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Duration</th>
                      <th>Overtime Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.map((record) => (
                      <tr
                        key={record._id}
                        className={
                          selectedRows.includes(record._id) ? "bg-gray-200" : ""
                        }
                      >
                        <td>
                          <input
                            type="checkbox"
                            onChange={() => toggleRowSelection(record._id)}
                            checked={selectedRows.includes(record._id)}
                          />
                        </td>
                        <td>
                          {new Date(record.time_in).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td>
                          {new Date(record.time_in).toLocaleTimeString()}
                          {record.entry_status === "late" && (
                            <span className="badge badge-warning ml-2">
                              Late ({formatMinuteDuration(record.minutes_late)})
                            </span>
                          )}
                        </td>

                        <td>
                          {record.time_out
                            ? new Date(record.time_out).toLocaleTimeString()
                            : "-"}
                        </td>
                        <td>
                          {record.time_out
                            ? formatDuration(record.total_hours)
                            : "Active"}
                        </td>
                        <td>
                          {record.overtime_hours > 0
                            ? formatDuration(record.overtime_hours)
                            : "No Overtime"}
                        </td>
                        <td>
                          <span
                            className={`badge capitalize ${
                              record.status === "active"
                                ? "badge-success"
                                : record.status === "pending"
                                ? "badge-warning"
                                : record.status === "approved"
                                ? "badge-info"
                                : "badge-error"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div>
                  Showing entries {indexOfFirstRecord + 1} -{" "}
                  {Math.min(indexOfLastRecord, filteredRecords.length)} of{" "}
                  {filteredRecords.length}
                </div>
                <div className="join">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={index + 1}
                      className={`join-item btn ${
                        currentPage === index + 1 ? "btn-active" : ""
                      }`}
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTracking;
