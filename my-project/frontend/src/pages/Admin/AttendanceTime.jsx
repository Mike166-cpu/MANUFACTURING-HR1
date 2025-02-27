import React, { useEffect, useState } from "react";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import BreadCrumbs from "../../Components/BreadCrumb";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiSearch,
  FiFilter,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiArrowLeft,
  FiUser,
  FiCoffee,
  FiAlertCircle,
} from "react-icons/fi";
import { formatDuration, calculateDuration } from "../../utils/timeUtils";
import Swal from "sweetalert2";

const AttendanceTime = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [allTimeTrackingSessions, setAllTimeTrackingSessions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [monthFilter, setMonthFilter] = useState("3"); // Default to last 3 months

  const navigate = useNavigate();
  const LOCAL = "http://localhost:7685";
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";

  useEffect(() => {
    document.title = "Attendance and Time Tracking";
    const token = localStorage.getItem("adminToken");
    if (!token) navigate("/login");

    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          `${APIBASED_URL}/api/employee/employee-data`
        );
        setEmployees(response.data);
        console.log("Fetched employees:", response.data); // Add console log
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    const fetchAllTimeTrackingSessions = async () => {
      try {
        const response = await axios.get(
          `${LOCAL}/api/timetrack/admin/all-sessions`
        );
        setAllTimeTrackingSessions(response.data);
        console.log("Fetched all time tracking sessions:", response.data);
      } catch (error) {
        console.error("Error fetching all time tracking sessions:", error);
      }
    };

    fetchEmployees();
    fetchAllTimeTrackingSessions();
  }, [navigate]);

  const approveSession = async (sessionId) => {
    try {
      await axios.put(
        `${LOCAL}/api/timetrack/admin/update-status/${sessionId}`,
        {
          status: "approved",
          remarks: "Approved by admin",
        }
      );

      // Update local state
      setAllTimeTrackingSessions((prevSessions) =>
        prevSessions.map((session) =>
          session._id === sessionId
            ? { ...session, status: "approved" }
            : session
        )
      );

      Swal.fire({
        title: "Success",
        text: "Session approved successfully",
        icon: "success",
      });
    } catch (error) {
      console.error("Error approving session:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to approve session",
        icon: "error",
      });
    }
  };

  const rejectSession = async (sessionId) => {
    try {
      const { value: rejectionReason } = await Swal.fire({
        title: "Enter rejection reason",
        input: "text",
        inputLabel: "Rejection Reason",
        inputPlaceholder: "Enter your reason for rejection",
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return "You need to provide a reason for rejection!";
          }
        },
      });

      if (rejectionReason) {
        await axios.put(
          `${LOCAL}/api/timetrack/admin/update-status/${sessionId}`,
          {
            status: "rejected",
            remarks: rejectionReason,
          }
        );

        // Update local state
        setAllTimeTrackingSessions((prevSessions) =>
          prevSessions.map((session) =>
            session._id === sessionId
              ? { ...session, status: "rejected" }
              : session
          )
        );

        Swal.fire({
          title: "Success",
          text: "Session rejected successfully",
          icon: "success",
        });
      }
    } catch (error) {
      console.error("Error rejecting session:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to reject session",
        icon: "error",
      });
    }
  };

  const getFilteredSessions = () => {
    const now = new Date();
    const monthsAgo = new Date();
    monthsAgo.setMonth(now.getMonth() - parseInt(monthFilter));

    return allTimeTrackingSessions.filter(
      (session) => new Date(session.time_in) >= monthsAgo
    );
  };

  const filteredTimeTrackingSessions = getFilteredSessions();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSessions = filteredTimeTrackingSessions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="flex">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
        } relative bg-gray-50`}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        {/* BREADCRUMBS */}
        <div className="bg-white pb-4 px-5">
          <BreadCrumbs />
          <span className="px-4 font-bold text-2xl"> Time Tracking Records</span>
        </div>

        {/* MAIN CONTENT */}
        <div className="p-6 bg-gray-100">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <FiCalendar className="text-gray-400" />
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="pl-4 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="1">Last Month</option>
                  <option value="3">Last 3 Months</option>
                  <option value="6">Last 6 Months</option>
                  <option value="12">Last Year</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="w-full">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FiUser className="text-gray-400" />
                          Employee ID
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FiCalendar className="text-gray-400" />
                          Date
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FiClock className="text-gray-400" />
                          Time In/Out
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Work Duration
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Overtime
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentSessions.map((session) => (
                      <tr
                        key={session._id}
                        className="hover:bg-blue-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {session.employee_id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(session.time_in).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <span className="text-green-500">▲</span>
                              {new Date(session.time_in).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <span className="text-red-500">▼</span>
                              {session.time_out
                                ? new Date(session.time_out).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )
                                : "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 inline-flex items-center gap-1 text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            <FiClock className="text-green-600" />
                            {session.total_hours
                              ? formatDuration(session.total_hours)
                              : "-"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-3 py-1 inline-flex items-center gap-1 text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            {session.overtime_duration != null &&
                            session.overtime_duration !== undefined
                              ? `${Math.floor(
                                  session.overtime_duration / 3600
                                )}h ${Math.floor(
                                  (session.overtime_duration % 3600) / 60
                                )}m`
                              : `${Math.floor(
                                  (session.overtime_hours * 3600) / 3600
                                )}h ${Math.floor(
                                  ((session.overtime_hours * 3600) % 3600) / 60
                                )}m`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 inline-flex items-center gap-1 text-sm leading-5 font-semibold rounded-full ${
                              !session.time_out
                                ? "bg-blue-100 text-blue-800"
                                : session.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : session.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {!session.time_out ? (
                              <>
                                <FiClock className="text-blue-600" />
                                Active
                              </>
                            ) : session.status === "approved" ? (
                              <>
                                <FiCheckCircle />
                                Approved
                              </>
                            ) : session.status === "rejected" ? (
                              <>
                                <FiAlertCircle />
                                Rejected
                              </>
                            ) : (
                              <>
                                <FiAlertCircle />
                                Pending
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {session.status === "pending" && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => approveSession(session._id)}
                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
                              >
                                <FiCheckCircle className="inline mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => rejectSession(session._id)}
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                              >
                                <FiAlertCircle className="inline mr-1" />
                                Reject
                              </button>
                            </div>
                          )}
                          {session.status === "approved" && (
                            <span className="text-green-500">
                              <FiCheckCircle className="inline mr-1" />
                              Approved
                            </span>
                          )}
                          {session.status === "rejected" && (
                            <span className="text-red-500">
                              <FiAlertCircle className="inline mr-1" />
                              Rejected
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(
                      indexOfLastItem,
                      filteredTimeTrackingSessions.length
                    )}{" "}
                    of {filteredTimeTrackingSessions.length} entries
                  </span>
                  <div className="flex space-x-2">
                    {Array.from(
                      {
                        length: Math.ceil(
                          filteredTimeTrackingSessions.length / itemsPerPage
                        ),
                      },
                      (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => paginate(i + 1)}
                          className={`px-3 py-1 rounded-md ${
                            currentPage === i + 1
                              ? "bg-blue-500 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                          } transition-colors duration-200`}
                        >
                          {i + 1}
                        </button>
                      )
                    )}
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

export default AttendanceTime;
