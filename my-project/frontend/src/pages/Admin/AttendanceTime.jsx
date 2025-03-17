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
  const [monthFilter, setMonthFilter] = useState("1"); // Default to last 3 months
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const userRole = localStorage.getItem("role") || ""; // Fallback to empty string if not found
  console.log(userRole);

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
          `${APIBASED_URL}/api/hr/employee-data`
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
          `${APIBASED_URL}/api/timetrack/admin/all-sessions`
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
        `${APIBASED_URL}/api/timetrack/admin/update-status/${sessionId}`,
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
          `${APIBASED_URL}/api/timetrack/admin/update-status/${sessionId}`,
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
    const threeMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 3,
      now.getDate()
    );
    const selectedMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - parseInt(monthFilter),
      now.getDate()
    );

    // Use the more recent date between threeMonthsAgo and selectedMonthsAgo
    const cutoffDate = new Date(Math.max(threeMonthsAgo, selectedMonthsAgo));

    return allTimeTrackingSessions.filter((session) => {
      const sessionDate = new Date(session.time_in);
      const dateFilter = sessionDate >= cutoffDate && sessionDate <= now;
      const deptFilter =
        departmentFilter === "all" || session.department === departmentFilter;
      const statFilter =
        statusFilter === "all" || session.status === statusFilter;

      return dateFilter && deptFilter && statFilter;
    });
  };

  const filteredTimeTrackingSessions = getFilteredSessions();
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = filteredTimeTrackingSessions.slice(
    startIndex,
    endIndex
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const LoadingSkeleton = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-3 bg-gray-200 rounded w-16 mt-2"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-8 bg-gray-200 rounded w-28"></div>
      </td>
    </tr>
  );

  return (
    <div className="flex">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
        } relative bg-base-200`}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        {/* BREADCRUMBS */}
        <div className="bg-base-100 pb-4 px-5">
          <BreadCrumbs />
          <span className="px-4 font-bold text-2xl">
            {" "}
            Time Tracking Records
          </span>
        </div>

        {/* MAIN CONTENT */}
        <div className="p-6 min-h-screen">
          <div className="mb-6 flex flex-col gap-4">
            {/* Filters Row */}
            <div className="flex flex-wrap gap-4 items-center bg-base-100 p-4 rounded-lg shadow">
              <div className="flex items-center gap-2">
                <FiCalendar className="text-primary" />
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="select select-bordered select-sm"
                >
                  <option value="1">Last Month</option>
                  <option value="2">Last 2 Months</option>
                  <option value="3">Last 3 Months</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <FiFilter className="text-primary" />
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="select select-bordered select-sm"
                >
                  <option value="all">All Departments</option>
                  <option value="IT">IT Department</option>
                  <option value="HR">HR Department</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="tabs tabs-boxed bg-base-100 p-2">
              <a
                className={`tab ${statusFilter === "all" ? "tab-active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                All
              </a>
              <a
                className={`tab ${
                  statusFilter === "pending" ? "tab-active" : ""
                }`}
                onClick={() => setStatusFilter("pending")}
              >
                Pending
              </a>
              <a
                className={`tab ${
                  statusFilter === "approved" ? "tab-active" : ""
                }`}
                onClick={() => setStatusFilter("approved")}
              >
                Approved
              </a>
              <a
                className={`tab ${
                  statusFilter === "rejected" ? "tab-active" : ""
                }`}
                onClick={() => setStatusFilter("rejected")}
              >
                Rejected
              </a>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>
                      <div className="flex items-center gap-2">Employee ID</div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">Date</div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">Time In/Out</div>
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
                <tbody>
                  {currentSessions.map((session) => (
                    <tr key={session._id} className="hover">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 text-center">
                          {session.employee_firstname}{" "}
                          {session.employee_lastname}
                        </div>
                        <div className="text-xs badge-info rounded-lg text-center text-white">
                          {session.entry_type}
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveSession(session._id)}
                              className="btn btn-success btn-sm"
                            >
                              <FiCheckCircle />
                              Approve
                            </button>

                            {/* Only Super Admin can reject */}
                            {userRole === "Superadmin" && (
                              <button
                                onClick={() => rejectSession(session._id)}
                                className="btn btn-error btn-sm"
                              >
                                <FiAlertCircle />
                                Reject
                              </button>
                            )}
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

              {/* Pagination */}
              <div className="px-6 py-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredTimeTrackingSessions.length)} of{" "}
                    {filteredTimeTrackingSessions.length} entries
                  </span>
                  <div className="join">
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
                          className={`join-item btn btn-sm ${
                            currentPage === i + 1 ? "btn-active" : ""
                          }`}
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
