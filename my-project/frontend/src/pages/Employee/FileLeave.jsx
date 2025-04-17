import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Swal from "sweetalert2";
import Breadcrumbs from "../../Components/BreadCrumb";

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

const FileLeave = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [leaveType, setLeaveType] = useState("Sick Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [employeeDepartment, setEmployeeDepartment] = useState("");
  const fullName = localStorage.getItem("fullName");
  const [employeeId, setEmployeeId] = useState("");
  const navigate = useNavigate();
  const [employeeGender, setEmployeeGender] = useState("");

  console.log("FullName:", fullName);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [formData, setFormData] = useState({
    employeeName: "",
    employee_department: "",
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [hasActiveLeave, setHasActiveLeave] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    document.title = "File Leave";
    const authToken = localStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employeeDepartment") || "Unknown";
    const employeeId = localStorage.getItem("employeeId") || "";

    setEmployeeId(employeeId);
    setEmployeeFirstName(firstName);
    setEmployeeLastName(lastName);
    setEmployeeDepartment(department);
    
  }, [navigate]);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  //FETCH LEAVE RECORDS
  const fetchLeaves = async () => {
    const employeeId = localStorage.getItem("employeeId");

    try {
      const response = await axios.get(
        `${LOCAL}/api/leave/get-employee-leaves/${employeeId}`
      );
      setLeaves(response.data);
    } catch (error) {
      console.error("Error fetching leave records", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Add date validation
    if (name === "startDate" || name === "endDate") {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day

      if (selectedDate < today) {
        Swal.fire({
          icon: "error",
          title: "Invalid Date",
          text: "Cannot select past dates",
        });
        return;
      }

      // Additional validation for end date
      if (name === "endDate" && value < formData.startDate) {
        Swal.fire({
          icon: "error",
          title: "Invalid Date Range",
          text: "End date cannot be before start date",
        });
        return;
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${LOCAL}/api/leave/file-leave`, {
        employeeId: employeeId,
        employee_name: fullName,
        employee_department: employeeDepartment,
        leave_type: formData.leaveType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        reason: formData.reason,
      });

      console.log("Leave request response:", response.data);

      Swal.fire("Success", "Leave request submitted!", "success");
      setIsModalOpen(false);
      fetchLeaves();
      checkActiveLeaves();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to submit leave request",
      });

      if (error.response?.data?.message?.includes("active approved leave")) {
        setIsModalOpen(false);
      }
    }
  };

  const [leaveBalance, setLeaveBalance] = useState({});

  // Fetch leave balance
  const fetchLeaveBalance = async () => {
    try {
      const employee_id = localStorage.getItem("employeeId");
      const response = await axios.get(
        `${LOCAL}/api/leave-balance/get-leave-balance/${employee_id}`
      );
      console.log("Full API Response:", response.data);

      const balanceData = Array.isArray(response.data.leaveBalance)
        ? response.data.leaveBalance[0]
        : response.data.leaveBalance;

      console.log("Processed Leave Balance Data:", balanceData);
      setLeaveBalance(balanceData || {});
    } catch (error) {
      console.error("Error fetching leave balance:", error);
      setLeaveBalance({
        sick_leave: 0,
        vacation_leave: 0,
        total_remaining_leaves: 0,
      });
    }
  };

  const checkActiveLeaves = async () => {
    try {
      if (!employeeId) return;

      const response = await axios.get(
        `${LOCAL}/api/leave/check-active-leaves/${employeeId}`
      );
      setHasActiveLeave(response.data.hasActiveLeave);
    } catch (error) {
      console.error("Error checking active leaves:", error);
      setHasActiveLeave(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchLeaves();
      checkActiveLeaves();
    }
  }, [employeeId]);

  useEffect(() => {
    if (employeeId) {
      fetchLeaveBalance(employeeId);
    }
  }, [employeeId]);

  // Add this function to get tomorrow's date in YYYY-MM-DD format
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // Add this function near your other helper functions
  const getRemainingDays = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = Math.abs(end - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  //
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [highlightedRows, setHighlightedRows] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [filterRange, setFilterRange] = useState("1");
  const itemsPerPage = 10;
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    filterLeaves();
  }, [leaves, filterRange, filterStatus]);

  // Filter function for last 3 months
  const filterLeaves = () => {
    const today = new Date();
    const filtered = leaves.filter((leave) => {
      const startDate = new Date(leave.start_date);
      const withinDateRange =
        filterRange === "1"
          ? startDate >= new Date(today.setMonth(today.getMonth() - 1))
          : filterRange === "2"
          ? startDate >= new Date(today.setMonth(today.getMonth() - 2))
          : filterRange === "3"
          ? startDate >= new Date(today.setMonth(today.getMonth() - 3))
          : true;

      const matchesStatus =
        filterStatus === "all" ? true : leave.status === filterStatus;

      return withinDateRange && matchesStatus;
    });

    setFilteredLeaves(filtered);
    setCurrentPage(1);
  };
  // Handle row highlight checkbox
  const toggleHighlight = (index) => {
    setHighlightedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeaves = filteredLeaves.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);

  //fetch your data
  const [data, setData] = useState([]);
  const fetchData = async () => {
    const employeeId = localStorage.getItem("employeeId");
    try {
      const response = await axios.get(
        `${LOCAL}/api/onboarding/employee/${employeeId}`
      );
      setData(response.data);
      setEmployeeGender(response.data.gender); // Store gender
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  // Add a function to get available leave types based on gender
  const getAvailableLeaveTypes = () => {
    const commonLeaves = [
      { value: "Sick Leave", label: "Sick Leave" },
      { value: "Vacation Leave", label: "Vacation Leave" },
      { value: "Service Incentive Leave", label: "Service Incentive Leave" },
      { value: "Bereavement Leave", label: "Bereavement Leave" },
      { value: "Solo Parent Leave", label: "Solo Parent Leave" },
    ];

    if (employeeGender === "Female") {
      return [
        ...commonLeaves,
        { value: "Maternity Leave", label: "Maternity Leave" },
        { value: "Special Leave for Women", label: "Special Leave for Women" },
      ];
    } else if (employeeGender === "Male") {
      return [
        ...commonLeaves,
        { value: "Paternity Leave", label: "Paternity Leave" },
      ];
    }

    return commonLeaves;
  };

  const [showBalanceModal, setShowBalanceModal] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
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

        <div className="p-5 bg-white shadow font-bold text-2xl">
          <Breadcrumbs />

          <h1 className="px-3">Start Your Time Tracking</h1>
        </div>

        <div className="p-6 transition-all duration-300 ease-in-out bg-slate-100 min-h-screen">
          {/* Replace leave balance cards with a button */}
          <div className="mb-6">
            <button
              onClick={() => setShowBalanceModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors duration-200"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              View Available Leaves
            </button>
          </div>

          {/* Leave Balance Modal */}
          {showBalanceModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Available Leaves
                  </h2>
                  <button
                    onClick={() => setShowBalanceModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Leave Type
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Available Days
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Vacation Leave
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {leaveBalance?.vacation_leave ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Sick Leave
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {leaveBalance?.sick_leave ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Service Incentive
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {leaveBalance?.service_incentive_leave ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Bereavement
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {leaveBalance?.bereavement_leave ?? 0}
                        </td>
                      </tr>
                      {employeeGender === "Female" && (
                        <>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              Maternity Leave
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {leaveBalance?.maternity_leave ?? 0}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              Special Leave (Women)
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {leaveBalance?.special_leave_for_women ?? 0}
                            </td>
                          </tr>
                        </>
                      )}
                      {employeeGender === "Male" && (
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Paternity Leave
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {leaveBalance?.paternity_leave ?? 0}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          Total Available
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                          {leaveBalance?.total_remaining_leaves ?? 0}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Rest of the existing content */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 px-1">
            {/* FILTERING SECTION */}
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative">
                <select
                  className="select select-bordered"
                  value={filterRange}
                  onChange={(e) => setFilterRange(e.target.value)}
                >
                  <option value="1">Last 1 Month</option>
                  <option value="2">Last 2 Months</option>
                  <option value="3">Last 3 Months</option>
                </select>
              </div>

              <div className="relative">
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
              </div>
            </div>

            {/* BUTTON SECTION */}
            <div className="w-full md:w-auto mt-4 md:mt-0">
              <button
                className={`w-full md:w-auto px-6 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm ${
                  hasActiveLeave
                    ? "bg-gray-100 text-gray-400 border border-gray-200"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                onClick={() => setIsModalOpen(true)}
                disabled={hasActiveLeave}
                title={
                  hasActiveLeave
                    ? "You have an active approved leave. Please wait until it ends."
                    : "File a new leave request"
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                File New Leave
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">
                      {""}
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                      Leave Type
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                      Start Date
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                      End Date
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                      Reason
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentLeaves.length > 0 ? (
                    currentLeaves.map((leave, index) => (
                      <tr
                        key={index}
                        className={`hover:bg-gray-100 transition-colors duration-200 ${
                          highlightedRows[index] ? "bg-gray-100" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={highlightedRows[index] || false}
                            onChange={() => toggleHighlight(index)}
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {leave.leave_type}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {new Date(leave.start_date).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {new Date(leave.end_date).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {leave.reason}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        No leave records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="flex justify-between items-center mt-4 p-4 border-t">
                {/* Left Side - Showing Entries */}
                <span className="text-sm text-gray-600">
                  Showing entries {indexOfFirstItem + 1} to{" "}
                  {Math.min(indexOfLastItem, filteredLeaves.length)} of{" "}
                  {filteredLeaves.length}
                </span>

                {/* Right Side - Pagination Controls */}
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

          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-xl transform transition-all">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  File a Leave
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Leave Type
                    </label>
                    <select
                      name="leaveType"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Leave Type</option>
                      {getAvailableLeaveTypes().map((leave) => (
                        <option key={leave.value} value={leave.value}>
                          {leave.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onChange={handleChange}
                      min={getTomorrowDate()}
                      onKeyDown={(e) => e.preventDefault()} // Prevent manual typing
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onChange={handleChange}
                      min={formData.startDate || getTomorrowDate()}
                      onKeyDown={(e) => e.preventDefault()} // Prevent manual typing
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason
                    </label>
                    <textarea
                      name="reason"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="4"
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileLeave;
