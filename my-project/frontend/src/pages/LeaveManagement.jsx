import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import axios from "axios";
import { FaUsers, FaClock, FaExclamationTriangle } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";
import { Bar, Line } from "react-chartjs-2";
import LeaveNavigationHeader from "../Components/LeaveNavigationHeader";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [isLeaveTypeModalOpen, setIsLeaveTypeModalOpen] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState({
    type_name: "",
    max_days: 0,
    description: "",
  });
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const Local = "http://localhost:7685";

  // FETCH ALL EMPLOYEES
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(`${APIBASED_URL}/api/employee`);
        setEmployees(response.data);
        setLoading(false); // Set loading to false when data is fetched
      } catch (error) {
        console.error("Error fetching employees:", error);
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

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

  // Pagination logic
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedEmployees = employees.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const [selectedEmployeeLeaveData, setSelectedEmployeeLeaveData] =
    useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = async (employee) => {
    setSelectedEmployee(employee); // Store the selected employee
    await getEmployeeLeaveData(employee.employee_id);
    await fetchLeaveBalance(employee.employee_id); // Optional: fetch leave balance
    setIsViewingLeaveRecords(true);
  };

  const getEmployeeLeaveData = async (id) => {
    try {
      const response = await axios.get(
        `${Local}/api/leave/get-user-leave/${id}` //
      );
      setSelectedEmployeeLeaveData(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching employee leave data:", error);
    }
  };

  const handlePageChange = (newPage) => setPage(newPage);

  // Add new states for sorting and filtering
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Sorting function
  const sortData = (data, key) => {
    if (!key) return data;

    return [...data].sort((a, b) => {
      if (key === "start_date" || key === "end_date") {
        return sortConfig.direction === "ascending"
          ? new Date(a[key]) - new Date(b[key])
          : new Date(b[key]) - new Date(a[key]);
      }

      if (a[key] < b[key]) return sortConfig.direction === "ascending" ? -1 : 1;
      if (a[key] > b[key]) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
  };

  // Filtering function
  const filterData = (data) => {
    let filteredData = data;

    // Filter by status
    if (filterStatus !== "all") {
      filteredData = filteredData.filter(
        (leave) => leave.status.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery) {
      filteredData = filteredData.filter(
        (leave) =>
          leave.leave_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          leave.reason.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filteredData;
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  // Add new state to track the current view
  const [isViewingLeaveRecords, setIsViewingLeaveRecords] = useState(false);

  const handleBackToEmployeeList = () => {
    setIsViewingLeaveRecords(false); // Switch back to employee list view
    setSelectedEmployeeLeaveData(null); // Clear selected leave data
    setSelectedEmployee(null); // Clear selected employee
  };

  // Add function to handle leave type creation
  const handleLeaveTypeSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${Local}/api/leave/leave-types`, newLeaveType);
      setIsLeaveTypeModalOpen(false);
      // Refresh leave types
      const response = await axios.get(`${Local}/api/leave/leave-types`);
      setLeaveTypes(response.data);
    } catch (error) {
      console.error("Error creating leave type:", error);
    }
  };

  // Update the handleStatusUpdate function
  const handleStatusUpdate = async (leaveId, newStatus) => {
    try {
      const response = await axios.put(
        `http://localhost:7685/api/leave/update-leave-status/${leaveId}`,
        { status: newStatus }
      );

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: `Leave request ${newStatus.toLowerCase()} successfully`,
        });

        // Update UI
        if (selectedEmployeeLeaveData) {
          const updatedData = selectedEmployeeLeaveData.map((leave) =>
            leave.leave_id === leaveId ? { ...leave, status: newStatus } : leave
          );
          setSelectedEmployeeLeaveData(updatedData);
        }
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
  // Add this JSX before the main table in the leave records view

  // Update the table row in the leave records view to include action buttons
  const updatedTableRow = (leave) => (
    <tr key={leave._id} className="hover:bg-gray-50">
      {/* ...existing columns... */}
      <td className="border px-4 py-2">
        {leave.status === "Pending" ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusUpdate(leave._id, "Approved")}
              className="px-2 py-1 bg-green-500 text-white rounded text-sm"
            >
              Approve
            </button>
            <button
              onClick={() => handleStatusUpdate(leave._id, "Rejected")}
              className="px-2 py-1 bg-red-500 text-white rounded text-sm"
            >
              Reject
            </button>
          </div>
        ) : (
          <span
            className={`px-2 py-1 rounded-full text-sm ${
              leave.status === "Approved"
                ? "bg-green-100 text-green-800"
                : leave.status === "Pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {leave.status}
          </span>
        )}
      </td>
    </tr>
  );

  // Add the "Configure Leave Types" button above the table
  const configureButton = (
    <button
      onClick={() => setIsLeaveTypeModalOpen(true)}
      className="mb-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
    >
      Configure Leave Types
    </button>
  );

  const [isLeaveBalanceModalOpen, setIsLeaveBalanceModalOpen] = useState(false);
  const [leaveBalanceForm, setLeaveBalanceForm] = useState({
    vacation_leave: 0,
    sick_leave: 0,
  });

  const handleLeaveBalanceSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEmployee) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No employee selected",
      });
      return;
    }

    try {
      await axios.post(`${Local}/api/leave-balance/set-leave-balance`, {
        employee_id: selectedEmployee.employee_id,
        vacation_leave: parseInt(leaveBalanceForm.vacation_leave, 10),
        sick_leave: parseInt(leaveBalanceForm.sick_leave, 10),
      });

      setIsLeaveBalanceModalOpen(false);
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Leave balance set successfully",
      });

      // Refresh leave balance data
      await fetchLeaveBalance(selectedEmployee.employee_id);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Leave balance already exists for this employee",
        });
      } else {
        console.error("Error setting leave balance:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "Failed to set leave balance",
        });
      }
    }
  };

  const handleUpdateLeaveBalance = async (employeeId, updatedLeaveBalance) => {
    try {
      const response = await axios.put(
        `${Local}/api/leave-balance/update-leave-balance/${employeeId}`,
        updatedLeaveBalance
      );

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Leave balance updated successfully",
        });

        // Update UI if necessary
        // For example, you might want to refresh the leave balance data
      }
    } catch (error) {
      console.error("Error updating leave balance:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update leave balance",
      });
    }
  };

  const handleDeleteLeaveBalance = async (employeeId) => {
    try {
      const response = await axios.delete(
        `${Local}/api/leave-balance/delete-leave-balance/${employeeId}`
      );

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Leave balance deleted successfully",
        });

        // Update UI if necessary
        // For example, you might want to remove the deleted leave balance from the state
      }
    } catch (error) {
      console.error("Error deleting leave balance:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete leave balance",
      });
    }
  };

  const handleUpdateClick = () => {
    if (!selectedEmployee) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No employee selected",
      });
      return;
    }

    handleUpdateLeaveBalance(selectedEmployee.employee_id, leaveBalanceForm);
  };

  const handleDeleteClick = () => {
    if (!selectedEmployee) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No employee selected",
      });
      return;
    }

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        handleDeleteLeaveBalance(selectedEmployee.employee_id);
      }
    });
  };

  // Add this function
  const fetchLeaveBalance = async (id) => {
    try {
      const response = await axios.get(
        `${Local}/api/leave-balance/get-leave-balance/${id}`
      );
      if (response.data && response.data.leaveBalance) {
        setLeaveBalance(response.data.leaveBalance);

        // Update form with current values
        setLeaveBalanceForm({
          vacation_leave: response.data.leaveBalance.vacation_leave || 0,
          sick_leave: response.data.leaveBalance.sick_leave || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching leave balance:", error);
      // If no leave balance exists, reset the form
      setLeaveBalanceForm({
        vacation_leave: 0,
        sick_leave: 0,
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
        } relative`}
      >
        <Navbar toggleSidebar={toggleSidebar} />
        {isSidebarOpen && isMobileView && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-10"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
        {/* Main Content */}
        <div className="p-6">
          {isViewingLeaveRecords ? (
            <div>
              <button
                onClick={handleBackToEmployeeList}
                className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Back to Employee List
              </button>
              <h1 className="text-3xl font-bold mb-6">
                Employee Leave Records
              </h1>

              <LeaveNavigationHeader
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />

              {/* Leave Balance Modal */}
              {isLeaveBalanceModalOpen && (
                <>
                  <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsLeaveBalanceModalOpen(false)}
                  ></div>
                  <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">
                          Manage Leave Balance
                        </h2>
                        <button
                          onClick={() => setIsLeaveBalanceModalOpen(false)}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      <form
                        onSubmit={handleLeaveBalanceSubmit}
                        className="space-y-4"
                      >
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Vacation Leave
                            </label>
                            <input
                              type="number"
                              value={leaveBalanceForm.vacation_leave}
                              onChange={(e) =>
                                setLeaveBalanceForm({
                                  ...leaveBalanceForm,
                                  vacation_leave: e.target.value,
                                })
                              }
                              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Sick Leave
                            </label>
                            <input
                              type="number"
                              value={leaveBalanceForm.sick_leave}
                              onChange={(e) =>
                                setLeaveBalanceForm({
                                  ...leaveBalanceForm,
                                  sick_leave: e.target.value,
                                })
                              }
                              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              required
                            />
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="submit"
                              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              Save New
                            </button>
                            <button
                              type="button"
                              onClick={handleUpdateClick}
                              className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                            >
                              Update
                            </button>
                            <button
                              type="button"
                              onClick={handleDeleteClick}
                              className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsLeaveBalanceModalOpen(false)}
                              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </>
              )}

              {selectedEmployeeLeaveData &&
              selectedEmployeeLeaveData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto bg-white border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th
                          onClick={() => handleSort("leave_type")}
                          className="border px-4 py-2 cursor-pointer hover:bg-gray-200"
                        >
                          Leave Type{" "}
                          {sortConfig.key === "leave_type" &&
                            (sortConfig.direction === "ascending" ? "↑" : "↓")}
                        </th>
                        <th
                          onClick={() => handleSort("start_date")}
                          className="border px-4 py-2 cursor-pointer hover:bg-gray-200"
                        >
                          Start Date{" "}
                          {sortConfig.key === "start_date" &&
                            (sortConfig.direction === "ascending" ? "↑" : "↓")}
                        </th>
                        <th
                          onClick={() => handleSort("end_date")}
                          className="border px-4 py-2 cursor-pointer hover:bg-gray-200"
                        >
                          End Date{" "}
                          {sortConfig.key === "end_date" &&
                            (sortConfig.direction === "ascending" ? "↑" : "↓")}
                        </th>
                        <th className="border px-4 py-2">Reason</th>
                        <th
                          onClick={() => handleSort("status")}
                          className="border px-4 py-2 cursor-pointer hover:bg-gray-200"
                        >
                          Status{" "}
                          {sortConfig.key === "status" &&
                            (sortConfig.direction === "ascending" ? "↑" : "↓")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortData(
                        filterData(selectedEmployeeLeaveData),
                        sortConfig.key
                      ).map((leave) => (
                        <tr key={leave.leave_id} className="hover:bg-gray-50">
                          <td className="border px-4 py-2">
                            {leave.leave_type}
                          </td>
                          <td className="border px-4 py-2">
                            {new Date(leave.start_date).toLocaleDateString()}
                          </td>
                          <td className="border px-4 py-2">
                            {new Date(leave.end_date).toLocaleDateString()}
                          </td>
                          <td className="border px-4 py-2">{leave.reason}</td>
                          <td className="border px-4 py-2">
                            <span
                              className={`px-2 py-1 rounded-full text-sm ${
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
                          <td className="border px-4 py-2">
                            {leave.status === "Pending" ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(
                                      leave.leave_id,
                                      "Approved"
                                    )
                                  }
                                  className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
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
                                  className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span
                                className={`px-2 py-1 rounded-full text-sm ${
                                  leave.status === "Approved"
                                    ? "bg-green-100 text-green-800"
                                    : leave.status === "Pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {leave.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No leave records found.</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold mb-6">Employee List</h1>
              {loading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto bg-white shadow-md rounded-lg">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="p-4 text-left">Name</th>
                        <th className="p-4 text-left">Email</th>
                        <th className="p-4 text-left">Department</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEmployees.map((employee) => (
                        <tr
                          key={employee._id}
                          className="border-b hover:bg-gray-100 text-sm"
                        >
                          <td className="p-4 capitalize">
                            {employee.employee_firstname}{" "}
                            {employee.employee_lastname}
                          </td>
                          <td className="p-4">{employee.employee_email}</td>
                          <td className="p-4">
                            {employee.employee_department}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              className="text-blue-500 hover:underline"
                              onClick={() => handleRowClick(employee)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to{" "}
                      {Math.min(startIndex + itemsPerPage, employees.length)} of{" "}
                      {employees.length} entries
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={
                          page === Math.ceil(employees.length / itemsPerPage)
                        }
                        className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* End of the Main Content */}
      </div>
    </div>
  );
};

export default LeaveManagement;
