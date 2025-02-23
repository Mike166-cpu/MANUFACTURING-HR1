import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Swal from "sweetalert2";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [leaveType, setLeaveType] = useState("Sick Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [employeeDepartment, setEmployeeDepartment] = useState("");
  const [employeeUsername, setEmployeeUsername] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [formData, setFormData] = useState({
    employee_username: "",
    employee_firstname: "",
    employee_lastname: "",
    employee_department: "",
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    document.title = "File Leave";
    const authToken = localStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employeeDepartment") || "Unknown";
    const username = localStorage.getItem("employeeUsername") || "";
    const employeeId = localStorage.getItem("employeeId") || "";

    console.log("First Name:", firstName, "Username:", employeeId);
    if (!authToken) {
      Swal.fire({
        title: "Not Logged In",
        text: "You are not logged in. Redirecting to Login Page",
        icon: "warning",
        confirmButtonText: "OK",
      }).then(() => navigate("/employeelogin"));
    } else {
      setEmployeeId(employeeId);
      setEmployeeFirstName(firstName);
      setEmployeeLastName(lastName);
      setEmployeeDepartment(department);
      setEmployeeUsername(username);
    }
  }, [navigate]);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  //FETCH LEAVE RECORDS
  const fetchLeaves = async () => {
    const employeeId = localStorage.getItem("employeeId"); // Ensure this is stored correctly

    try {
      const response = await axios.get(
        `http://localhost:7685/api/leave/get-employee-leaves/${employeeId}`
      );
      setLeaves(response.data);
    } catch (error) {
      console.error("Error fetching leave records", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:7685/api/leave/file-leave", {
        employee_id: employeeId,
        employee_username: employeeUsername,
        employee_firstname: employeeFirstName,
        employee_lastname: employeeLastName,
        employee_department: employeeDepartment,
        leave_type: formData.leaveType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        reason: formData.reason,
      });
      Swal.fire("Success", "Leave request submitted!", "success");
      setIsModalOpen(false);
      fetchLeaves();
    } catch (error) {
      Swal.fire("Error", "Failed to submit leave request", "error");
    }
  };

  const [leaveBalance, setLeaveBalance] = useState({});

  // Fetch leave balance
  const fetchLeaveBalance = async (id) => {
    try {
      const response = await axios.get(
        `http://localhost:7685/api/leave-balance/get-leave-balance/${id}`
      );
      console.log("Leave Balance:", response.data.leaveBalance);
      console.log("Vacation Leave:", response.data.leaveBalance.vacation_leave);
      console.log("Sick Leave:", response.data.leaveBalance.sick_leave);
      setLeaveBalance(response.data.leaveBalance);
    } catch (error) {
      console.error("Error fetching leave balance:", error);
    }
  };

  
  useEffect(() => {
    if (employeeId) {
      fetchLeaveBalance(employeeId);
    }
  }, [employeeId]);


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
        <div className="p-6 transition-all duration-300 ease-in-out">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Leave Requests</h1>
            <button
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
              onClick={() => setIsModalOpen(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              File a New Leave
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Leave Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Start Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      End Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Reason
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaves.length > 0 ? (
                    leaves.map((leave, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {leave.leave_type}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {new Date(leave.start_date).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {new Date(leave.end_date).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {leave.reason}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No leave records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Vacation Leave">Vacation Leave</option>
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
