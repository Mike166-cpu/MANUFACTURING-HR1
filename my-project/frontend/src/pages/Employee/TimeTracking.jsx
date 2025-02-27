import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Swal from "sweetalert2";
import Breadcrumb from "../../Components/BreadCrumb";
import Calendar from "react-calendar";
import axios from "axios";
import { formatDuration, calculateDuration } from '../../utils/timeUtils';

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
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard - Home";
    const authToken = localStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employeeDepartment") || "Unknown";
    const employeeUsername = localStorage.getItem("employeeUsername");

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

  // Fetch Active Session
  const fetchActiveSession = async () => {
    try {
      const employeeId = localStorage.getItem("employeeId");
      const response = await axios.get(`http://localhost:7685/api/timetrack/active-session/${employeeId}`);
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

  // Fetch Time Tracking History
  useEffect(() => {
    const fetchTimeTrackingHistory = async () => {
      try {
        const employeeId = localStorage.getItem("employeeId");
        const response = await axios.get(`http://localhost:7685/api/timetrack/history/${employeeId}`);
        setTimeTrackingHistory(response.data);
      } catch (error) {
        console.error("Error fetching time tracking history:", error);
      }
    };

    fetchTimeTrackingHistory();
  }, [activeSession]); // Refresh when active session changes

  // Time In Function
  const timeIn = async () => {
    try {
      const employeeId = localStorage.getItem("employeeId");
      const response = await axios.post("http://localhost:7685/api/timetrack/time-in", {
        employee_id: employeeId,
        entry_type: "System Entry"  // Add this line
      });

      setActiveSession(response.data.session);
      Swal.fire("Success!", "Time In recorded successfully!", "success");
    } catch (error) {
      console.error("Error recording Time In:", error);
      Swal.fire("Error!", error.response?.data?.message || "Failed to record Time In.", "error");
    }
  };

  // Time Out Function
  const timeOut = async () => {
    try {
      const employeeId = localStorage.getItem("employeeId");
      const response = await axios.put("http://localhost:7685/api/timetrack/time-out", {
        employee_id: employeeId,
      });

      setActiveSession(null);
      Swal.fire("Success!", "Time Out recorded successfully!", "success");
    } catch (error) {
      console.error("Error recording Time Out:", error);
      Swal.fire("Error!", error.response?.data?.message || "Failed to record Time Out.", "error");
    }
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

        {/* MAIN CONTENT */}
        <div className="transition-all duration-300 ease-in-out flex-grow p-5">
          {/* Welcome Card */}
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title text-2xl">
                Welcome, {employeeFirstName} {employeeLastName}
              </h2>
              <p className="text-gray-600">
                Department: <span className="badge badge-primary">{employeeDepartment}</span>
              </p>
            </div>
          </div>

          {/* Time Tracking Controls */}
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title mb-4">Time Tracking Controls</h2>
              <div className="flex gap-4">
                <button
                  onClick={timeIn}
                  disabled={activeSession !== null}
                  className={`btn ${
                    activeSession ? 'btn-disabled' : 'btn-success'
                  }`}
                >
                  <i className="fas fa-sign-in-alt mr-2"></i> Time In
                </button>
                <button
                  onClick={timeOut}
                  disabled={activeSession === null}
                  className={`btn ${
                    !activeSession ? 'btn-disabled' : 'btn-error'
                  }`}
                >
                  <i className="fas fa-sign-out-alt mr-2"></i> Time Out
                </button>
              </div>
            </div>
          </div>

          {/* Active Session Card */}
          {activeSession && (
            <div className="card bg-base-100 shadow-xl mb-6">
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
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4">Time Tracking History</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Duration</th>
                      <th>Overtime</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeTrackingHistory.map((record) => (
                      <tr key={record._id}>
                        <td>{new Date(record.time_in).toLocaleDateString()}</td>
                        <td>{new Date(record.time_in).toLocaleTimeString()}</td>
                        <td>
                          {record.time_out
                            ? new Date(record.time_out).toLocaleTimeString()
                            : "-"}
                        </td>
                        <td>
                          {record.total_hours
                            ? formatDuration(record.total_hours)
                            : "-"}
                        </td>
                        <td>
                          {record.overtime_hours > 0 ? (
                            <span className="text-orange-500 font-semibold">
                              {formatDuration(record.overtime_hours)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              record.status === "active"
                                ? "badge-success"
                                : record.overtime_hours > 0
                                ? "badge-warning"
                                : "badge-neutral"
                            }`}
                          >
                            {record.status}
                            {record.overtime_hours > 0 && " (OT)"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTracking;
