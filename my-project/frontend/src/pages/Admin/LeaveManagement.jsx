import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import BreadCrumbs from "../../Components/BreadCrumb";
import axios from "axios";
import { FaUsers, FaClock, FaExclamationTriangle } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";
import { Bar, Line } from "react-chartjs-2";
import LeaveNavigationHeader from "../../Components/LeaveNavigationHeader";

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
  const [leaveStatusMap, setLeaveStatusMap] = useState({});

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const Local = "http://localhost:7685";

  // Add this new state for dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    onLeaveCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    totalEmployees: 0,
  });

  // Add this new function to fetch dashboard stats
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

  // // FETCH ALL EMPLOYEES
  // useEffect(() => {
  //   const fetchEmployees = async () => {
  //     try {
  //       const response = await axios.get(`${Local}/api/hr/employee-data`);
  //       setEmployees(response.data);
  //       setLoading(false);
  //     } catch (error) {
  //       console.error("Error fetching employees:", error);
  //       setLoading(false);
  //     }
  //   };
  //   fetchEmployees();
  // }, []);

  const [employeeData, setEmployeeData] = useState([]);
  useEffect(() => {
    const employeeList = async () => {
      try {
        const response = await axios.get(`${APIBASED_URL}/api/hr/employee-data`);
        // Transform data to match EmployeeLoginModel schema
        const transformedData = response.data.map((emp) => ({
          _id: emp._id,
          firstName: emp.employee_firstname || emp.firstName,
          lastName: emp.employee_lastname || emp.lastName,
          email: emp.employee_email || emp.email,
          role: emp.employee_role || emp.role,
          position: emp.employee_position || emp.position,
          Hr: emp.Hr || 0,
        }));
        setEmployeeData(transformedData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching employees:", error);
        setLoading(false);
      }
    };
    employeeList();
  }, []);

  const fetchLeaveStatus = async () => {
    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/leave/employee-leave-status`
      );
      setLeaveStatusMap(response.data.leaveStatusMap);
    } catch (error) {
      console.error("Error fetching leave status:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchDashboardStats();
        await fetchLeaveStatus();
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchData();
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

  const [selectedEmployeeLeaveData, setSelectedEmployeeLeaveData] =
    useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = async (employee) => {
    setSelectedEmployee(employee); // Store the selected employee
    await getEmployeeLeaveData(employee._id); // Changed from employee.employee_id to employee._id
    await fetchLeaveBalance(employee._id); // Changed from employee.employee_id to employee._id
    setIsViewingLeaveRecords(true);
  };

  // FETCH EMPLOYEES LEAVE
  const getEmployeeLeaveData = async (id) => {
    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/leave/get-user-leave/${id}` //
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
  // const handleLeaveTypeSubmit = async (e) => {
  //   e.preventDefault();
  //   try {
  //     await axios.post(`${Local}/api/leave/leave-types`, newLeaveType);
  //     setIsLeaveTypeModalOpen(false);
  //     // Refresh leave types
  //     const response = await axios.get(`${Local}/api/leave/leave-types`);
  //     setLeaveTypes(response.data);
  //   } catch (error) {
  //     console.error("Error creating leave type:", error);
  //   }
  // };

  // Update the handleStatusUpdate function
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
  // const updatedTableRow = (leave) => (
  //   <tr key={leave._id} className="hover:bg-gray-50">
  //     {/* ...existing columns... */}
  //     <td className="border px-4 py-2">
  //       {leave.status === "Pending" ? (
  //         <div className="flex gap-2">
  //           <button
  //             onClick={() => handleStatusUpdate(leave._id, "Approved")}
  //             className="px-2 py-1 bg-green-500 text-white rounded text-sm"
  //           >
  //             Approve
  //           </button>
  //           <button
  //             onClick={() => handleStatusUpdate(leave._id, "Rejected")}
  //             className="px-2 py-1 bg-red-500 text-white rounded text-sm"
  //           >
  //             Reject
  //           </button>
  //         </div>
  //       ) : (
  //         <span
  //           className={`px-2 py-1 rounded-full text-sm ${
  //             leave.status === "Approved"
  //               ? "bg-green-100 text-green-800"
  //               : leave.status === "Pending"
  //               ? "bg-yellow-100 text-yellow-800"
  //               : "bg-red-100 text-red-800"
  //           }`}
  //         >
  //           {leave.status}
  //         </span>
  //       )}
  //     </td>
  //   </tr>
  // );

  // Add the "Configure Leave Types" button above the table
  // const configureButton = (
  //   <button
  //     onClick={() => setIsLeaveTypeModalOpen(true)}
  //     className="mb-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
  //   >
  //     Configure Leave Types
  //   </button>
  // );

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
      await axios.post(`${APIBASED_URL}/api/leave-balance/set-leave-balance`, {
        employee_id: selectedEmployee._id, // Changed from employee.employee_id to employee._id
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
      await fetchLeaveBalance(selectedEmployee._id); // Changed from employee.employee_id to employee._id
    } catch (error) {
      console.error("Error details:", error.response?.data);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to set leave balance",
      });
    }
  };

  const handleUpdateLeaveBalance = async (employee_id, updatedLeaveBalance) => {
    try {
      if (!selectedEmployee?._id) {
        throw new Error("No employee selected");
      }
      const response = await axios.put(
        `${APIBASED_URL}/api/leave-balance/update-leave-balance/${employee_id}`,
        {
          vacation_leave: parseInt(updatedLeaveBalance.vacation_leave, 10),
          sick_leave: parseInt(updatedLeaveBalance.sick_leave, 10),
        }
      );

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Leave balance updated successfully",
        });
        await fetchLeaveBalance(selectedEmployee._id); // Changed from employee.employee_id to employee._id
      }
    } catch (error) {
      console.error("Error updating leave balance:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to update leave balance",
      });
    }
  };

  const handleDeleteLeaveBalance = async (employee_id) => {
    try {
      const response = await axios.delete(
        `${APIBASED_URL}/api/leave-balance/delete-leave-balance/${employee_id}`
      );

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Leave balance deleted successfully",
        });

        // Clear the form and local state
        setLeaveBalanceForm({
          vacation_leave: 0,
          sick_leave: 0,
        });
        setLeaveBalance(null);
        setIsLeaveBalanceModalOpen(false);
      }
    } catch (error) {
      console.error("Error deleting leave balance:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to delete leave balance",
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

    handleUpdateLeaveBalance(selectedEmployee._id, leaveBalanceForm);
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
        handleDeleteLeaveBalance(selectedEmployee._id);
      }
    });
  };

  // Add this function
  const fetchLeaveBalance = async (employee_id) => {
    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/leave-balance/get-leave-balance/${employee_id}`
      );
      if (response.data && response.data.leaveBalance) {
        const leaveBalanceData = Array.isArray(response.data.leaveBalance)
          ? response.data.leaveBalance[0]
          : response.data.leaveBalance;

        setLeaveBalance(leaveBalanceData);
        setLeaveBalanceForm({
          vacation_leave: leaveBalanceData.vacation_leave || 0,
          sick_leave: leaveBalanceData.sick_leave || 0,
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

  // Add these new state variables
  const [leaveStats, setLeaveStats] = useState({
    totalEmployees: 0,
    activeLeaves: 0,
    pendingRequests: 0,
    totalLeaveRequests: 0,
    sickLeaveCount: 0,
    vacationLeaveCount: 0,
  });

  // Add this new useEffect to calculate statistics
  useEffect(() => {
    if (employees.length > 0) {
      const stats = {
        totalEmployees: employees.length,
        onLeave: Object.values(leaveStatusMap).filter(
          (status) => status.onLeave
        ).length,
        pendingRequests: 0,
        approvedLeaves: 0,
      };

      // Calculate pending and approved leaves
      employees.forEach((employee) => {
        if (selectedEmployeeLeaveData) {
          stats.pendingRequests += selectedEmployeeLeaveData.filter(
            (leave) => leave.status === "Pending"
          ).length;
          stats.approvedLeaves += selectedEmployeeLeaveData.filter(
            (leave) => leave.status === "Approved"
          ).length;
        }
      });

      setLeaveStats(stats);
    }
  }, [employees, leaveStatusMap, selectedEmployeeLeaveData]);

  // Add new function to fetch leave statistics
  const fetchLeaveStatistics = async () => {
    try {
      const [employeesResponse, leavesResponse] = await Promise.all([
        axios.get(`${APIBASED_URL}/api/employee`),
        axios.get(`${APIBASED_URL}/api/leave/get-employees-leave`),
      ]);

      const today = new Date();
      const leaves = leavesResponse.data;

      const stats = {
        totalEmployees: employeesResponse.data.length,
        activeLeaves: leaves.filter(
          (leave) =>
            leave.status === "Approved" &&
            new Date(leave.end_date) >= today &&
            new Date(leave.start_date) <= today
        ).length,
        pendingRequests: leaves.filter((leave) => leave.status === "Pending")
          .length,
        totalLeaveRequests: leaves.length,
        sickLeaveCount: leaves.filter(
          (leave) =>
            leave.leave_type === "Sick Leave" && leave.status === "Approved"
        ).length,
        vacationLeaveCount: leaves.filter(
          (leave) =>
            leave.leave_type === "Vacation Leave" && leave.status === "Approved"
        ).length,
      };

      setLeaveStats(stats);
    } catch (error) {
      console.error("Error fetching leave statistics:", error);
    }
  };

  // Update useEffect to include statistics fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchLeaveStatistics();
        await fetchLeaveStatus();
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [employeeSearch, setEmployeeSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const uniqueDepartments = [
      ...new Set(employees.map((emp) => emp.employee_department)),
    ];
    setDepartments(uniqueDepartments);
  }, [employees]);

  const filteredEmployees = employeeData.filter((employee) => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(employeeSearch.toLowerCase());
    const matchesDepartment =
      departmentFilter === "all" || employee.position === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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

        {/* BREADCRUMBS */}
        <div className="bg-white pb-4 px-5">
          <BreadCrumbs />
          <span className="px-4 font-bold text-2xl">
            {" "}
            Manage Employee Leave
          </span>
        </div>

        {/* Add Dashboard Stats Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Employees Card */}
            <div className="bg-white rounded-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {dashboardStats.totalEmployees}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FaUsers className="text-blue-500 text-xl" />
                </div>
              </div>
            </div>

            {/* Currently on Leave Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Currently on Leave
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {dashboardStats.onLeaveCount}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Active leaves today
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <FaClock className="text-yellow-500 text-xl" />
                </div>
              </div>
            </div>

            {/* Pending Requests Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Pending Requests</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {dashboardStats.pendingCount}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Awaiting approval
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <FaExclamationTriangle className="text-orange-500 text-xl" />
                </div>
              </div>
            </div>

            {/* Approved Leaves Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Approved Leaves</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {dashboardStats.approvedCount}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Total approved</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FaArrowRight className="text-green-500 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Rest of your existing component code */}
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
                setIsLeaveBalanceModalOpen={setIsLeaveBalanceModalOpen} // Add this line
              />

              {/* Leave Balance Modal */}
              {isLeaveBalanceModalOpen && (
                <>
                  <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsLeaveBalanceModalOpen(false)}
                  ></div>
                  <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4">
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
                          className="border py-1 cursor-pointer hover:bg-gray-200"
                        >
                          Leave Type{" "}
                          {sortConfig.key === "leave_type" &&
                            (sortConfig.direction === "ascending" ? "↑" : "↓")}
                        </th>
                        <th
                          onClick={() => handleSort("start_date")}
                          className="border py-2 cursor-pointer hover:bg-gray-200"
                        >
                          Start Date{" "}
                          {sortConfig.key === "start_date" &&
                            (sortConfig.direction === "ascending" ? "↑" : "↓")}
                        </th>
                        <th
                          onClick={() => handleSort("end_date")}
                          className="border py-2 cursor-pointer hover:bg-gray-200"
                        >
                          End Date{" "}
                          {sortConfig.key === "end_date" &&
                            (sortConfig.direction === "ascending" ? "↑" : "↓")}
                        </th>
                        <th className="border px-4 py-2">Reason</th>
                        <th
                          onClick={() => handleSort("status")}
                          className="border py-2 cursor-pointer hover:bg-gray-200"
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
                          <td className="border px-4">{leave.leave_type}</td>
                          <td className="border px-4">
                            {new Date(leave.start_date).toLocaleDateString()}
                          </td>
                          <td className="border px-4">
                            {new Date(leave.end_date).toLocaleDateString()}
                          </td>
                          <td className="border px-4 ">{leave.reason}</td>
                          <td className="border px-4 ">
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
              {loading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Add this filter section above the table */}
                  <div className="w-full mb-4 flex items-center gap-4">
                    <div className="form-control flex-grow">
                      <input
                        type="text"
                        placeholder="Search employee..."
                        className="input input-bordered w-full"
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                      />
                    </div>

                    <div className="form-control w-1/4 min-w-[200px]">
                      <select
                        className="select select-bordered w-full"
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                      >
                        <option value="all">All Departments</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <table className="min-w-full table-auto bg-white rounded-lg">
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
                          className={`border-b hover:bg-gray-100 text-sm ${
                            leaveStatusMap[employee._id]?.onLeave
                              ? "bg-yellow-50"
                              : ""
                          }`}
                        >
                          <td className="px-2 py-3 capitalize">
                            <div className="flex flex-col">
                              <span>
                                {employee.firstName} {employee.lastName}
                              </span>
                              {leaveStatusMap[employee._id]?.onLeave && (
                                <span className="text-xs font-medium py-1 rounded-full bg-yellow-100 text-yellow-800 inline-flex items-center mt-1">
                                  On {leaveStatusMap[employee._id].leaveType}
                                  <span className="ml-1 text-xs text-yellow-600">
                                    (Until{" "}
                                    {new Date(
                                      leaveStatusMap[employee._id].endDate
                                    ).toLocaleDateString()}
                                    )
                                  </span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3">{employee.email}</td>
                          <td className="py-3">{employee.position}</td>
                          <td className="text-center py-3">
                            <div className="flex flex-row items-center gap-2">
                              <button
                                className="text-blue-500 hover:underline"
                                onClick={() => handleRowClick(employee)}
                              >
                                View
                              </button>
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  leaveStatusMap[employee._id]?.onLeave
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {leaveStatusMap[employee._id]?.onLeave
                                  ? "On Leave"
                                  : "Available"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex bg-white justify-between items-center px-6 py-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-center text-sm">
                      Showing {startIndex + 1} to{" "}
                      {Math.min(startIndex + itemsPerPage, employees.length)} of{" "}
                      {employees.length} entries
                    </div>
                    <div className="join">
                      {Array.from(
                        { length: Math.ceil(employees.length / itemsPerPage) },
                        (_, i) => (
                          <button
                            key={i}
                            onClick={() => handlePageChange(i + 1)}
                            className={`join-item text-sm btn ${
                              page === i + 1 ? "btn-active" : ""
                            }`}
                          >
                            {i + 1}
                          </button>
                        )
                      )}
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
