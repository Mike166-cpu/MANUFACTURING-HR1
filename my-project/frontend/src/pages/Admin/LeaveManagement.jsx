import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import BreadCrumbs from "../../Components/BreadCrumb";
import axios from "axios";
import { FaUsers, FaClock, FaExclamationTriangle } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";
import LeaveNavigationHeader from "../../Components/LeaveNavigationHeader";

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

const LeaveManagement = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [selectedLeave, setSelectedLeave] = useState(null);

  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    onLeaveCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    totalEmployees: 0,
  });

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  // Fetch all leave requests
  const fetchLeaveRequests = async () => {
    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/leave/get-employees-leave`
      );
      setLeaveRequests(response.data);
      console.log("Leave", response.data);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    }
  };

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      const [employeesRes, leavesRes] = await Promise.all([
        axios.get(`${APIBASED_URL}/api/hr/employee-data`),
        axios.get(`${APIBASED_URL}/api/leave/get-employees-leave`),
      ]);

      const today = new Date();
      const leaves = leavesRes.data;

      const stats = {
        onLeaveCount: leaves.filter(
          (leave) =>
            leave.status === "Approved" &&
            new Date(leave.start_date) <= today &&
            new Date(leave.end_date) >= today
        ).length,
        pendingCount: leaves.filter((leave) => leave.status === "Pending")
          .length,
        approvedCount: leaves.filter((leave) => leave.status === "Approved")
          .length,
        totalEmployees: employeesRes.data.length,
      };

      setDashboardStats(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchLeaveRequests(), fetchDashboardStats()]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatusUpdate = async (leaveId, newStatus) => {
    try {
      const response = await axios.put(
        `${APIBASED_URL}/api/leave/update-leave-status/${leaveId}`,
        { status: newStatus }
      );

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: `Leave request ${newStatus.toLowerCase()} successfully`,
        });

        // Refresh data
        await Promise.all([fetchLeaveRequests(), fetchDashboardStats()]);
      }
    } catch (error) {
      console.error("Error updating leave status:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update leave status",
      });
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleResize = () => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    handleResize();
    document.title = "Leave Management - HRMS";

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  //Leave Filter
  const filteredLeaves =
    filter === "All"
      ? leaveRequests
      : leaveRequests.filter((leave) => leave.status === filter);

  // Pagination Function
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = currentPage * itemsPerPage;
  const paginatedLeaves = filteredLeaves.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  //Checkbox
  const [selectedRows, setSelectedRows] = useState([]);

  // Toggle row selection
  const toggleRowSelection = (leaveId) => {
    setSelectedRows((prevSelected) =>
      prevSelected.includes(leaveId)
        ? prevSelected.filter((id) => id !== leaveId)
        : [...prevSelected, leaveId]
    );
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
        }`}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="bg-white pb-4 px-5">
          <BreadCrumbs />
          <span className="px-4 font-bold text-2xl">Leave Requests</span>
        </div>

        <div className="p-6">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {loading ? (
              // Replace the entire loading skeleton section
              <>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg p-8 border-l-4 border-gray-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between animate-pulse">
                      <div className="space-y-4 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 ml-4"></div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>

                {/* Currently on Leave Card */}
                <div className="bg-white rounded-lg p-8 border-l-4 border-yellow-500 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-base text-gray-500">
                        Currently on Leave
                      </p>
                      <p className="text-3xl font-bold text-gray-800">
                        {dashboardStats.onLeaveCount}
                      </p>
                      <p className="text-sm text-yellow-600">
                        Active leaves today
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-100 rounded-full">
                      <FaClock className="text-yellow-500 text-2xl" />
                    </div>
                  </div>
                </div>

                {/* Pending Requests Card */}
                <div className="bg-white rounded-lg p-8 border-l-4 border-orange-500 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-base text-gray-500">
                        Pending Requests
                      </p>
                      <p className="text-3xl font-bold text-gray-800">
                        {dashboardStats.pendingCount}
                      </p>
                      <p className="text-sm text-orange-600">
                        Awaiting approval
                      </p>
                    </div>
                    <div className="p-4 bg-orange-100 rounded-full">
                      <FaExclamationTriangle className="text-orange-500 text-2xl" />
                    </div>
                  </div>
                </div>

                {/* Approved Leaves Card */}
                <div className="bg-white rounded-lg p-8 border-l-4 border-green-500 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-base text-gray-500">Approved Leaves</p>
                      <p className="text-3xl font-bold text-gray-800">
                        {dashboardStats.approvedCount}
                      </p>
                      <p className="text-sm text-green-600">Total approved</p>
                    </div>
                    <div className="p-4 bg-green-100 rounded-full">
                      <FaArrowRight className="text-green-500 text-2xl" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Leave Requests Table */}
          <div className="relative pb-4">
            <select
              className="select select-bordered"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full table-auto">
              <thead className="bg-white border-b text-xs text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="p-3"></th>
                  <th className="p-3 text-left">Leave Id</th>
                  <th className="p-3 text-left">Employee Name</th>
                  <th className="p-3 text-left">Leave</th>
                  <th className="p-3 text-left">Duration</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Payment</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {paginatedLeaves.length > 0 ? (
                  paginatedLeaves.map((leave) => {
                    const today = new Date();
                    const startDate = new Date(leave.start_date);
                    const endDate = new Date(leave.end_date);
                    const isActiveLeave =
                      leave.status === "Approved" &&
                      today >= startDate &&
                      today <= endDate;

                    return (
                      <tr
                        key={leave.leave_id}
                        className={`${
                          selectedRows.includes(leave.leave_id)
                            ? "bg-blue-50"
                            : "bg-white"
                        } hover:bg-gray-50`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(leave.leave_id)}
                            onChange={() => toggleRowSelection(leave.leave_id)}
                          />
                        </td>
                        <td className="p-3 capitalize">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {leave.leave_id}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 capitalize">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {leave.employee_name}
                            </span>
                            {isActiveLeave && (
                              <span className="bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                On Leave
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-gray-800">
                            {leave.leave_type}
                          </div>
                          <div
                            className="text-xs text-gray-500 line-clamp-1"
                            title={leave.reason}
                          ></div>
                        </td>
                        <td className="p-3 text-gray-700">
                          <span className="block text-sm">
                            {formatDate(leave.start_date)} –{" "}
                            {formatDate(leave.end_date)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full 
                  ${
                    leave.status === "Approved"
                      ? "bg-green-100 text-green-800"
                      : leave.status === "Pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                          >
                            {leave.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="badge badge-outline badge-primary text-xs">
                            {leave.payment_status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedLeave(leave)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                            >
                              View Details
                            </button>
                            {leave.status === "Pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(
                                      leave.leave_id,
                                      "Approved"
                                    )
                                  }
                                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(
                                      leave.leave_id,
                                      "Rejected"
                                    )
                                  }
                                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-gray-500">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {selectedLeave && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                  <h2 className="text-lg font-semibold mb-4">Leave Details</h2>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <strong>Employee:</strong> {selectedLeave.employee_name}
                    </p>
                    <p>
                      <strong>Leave Type:</strong> {selectedLeave.leave_type}
                    </p>
                    <p>
                      <strong>Duration:</strong>{" "}
                      {formatDate(selectedLeave.start_date)}{" "}
                      - {formatDate(selectedLeave.end_date)}
                    </p>
                    <p>
                      <strong>Reason:</strong> {selectedLeave.reason}
                    </p>
                    <p>
                      <strong>Status:</strong> {selectedLeave.status}
                    </p>
                    <p>
                      <strong>Payment Status:</strong>{" "}
                      {selectedLeave.payment_status}
                    </p>
                    <p>
                      <strong>Paid Days:</strong> {selectedLeave.paid_days}
                    </p>
                    <p>
                      <strong>Unpaid Days:</strong> {selectedLeave.unpaid_days}
                    </p>
                  </div>
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => setSelectedLeave(null)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4 p-4 border-t">
              <span className="text-sm text-gray-600">
                Showing entries {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, filteredLeaves.length)} of{" "}
                {filteredLeaves.length}
              </span>

              {totalPages > 1 && (
                <div className="join">
                  <button
                    className="join-item btn btn-sm"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                  >
                    «
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      className={`join-item btn btn-sm ${
                        currentPage === i + 1 ? "btn-primary" : ""
                      }`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    className="join-item btn btn-sm"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                  >
                    »
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;
