import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import BreadCrumbs from "../../Components/BreadCrumb";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Promotion = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const email = localStorage.getItem("email");
  console.log("Email from localStorage:", email);

  const role = localStorage.getItem("role");
  const employeeId = localStorage.getItem("employeeId");
  const firstName = localStorage.getItem("firstName");
  const lastName = localStorage.getItem("lastName");

  console.log("Role from localStorage:", role);
  console.log("Employee ID from localStorage:", employeeId);

  const [employees, setEmployees] = useState([]);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [timeTrackingData, setTimeTrackingData] = useState(null);
  const [promotionDetails, setPromotionDetails] = useState({
    newPosition: "",
    remarks: "",
    positionEffectiveAt: "",
  });
  const [promotionHistory, setPromotionHistory] = useState([]);
  const [loadingPromotionHistory, setLoadingPromotionHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${APIBASED_URL}/api/employeeData/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setError("Failed to load employees. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleViewDetails = async (employee) => {
    try {
      const timeTrackingRes = await axios.get(
        `${APIBASED_URL}/api/timetrack/attendance-stats/${employee.employeeId}`
      );
      setTimeTrackingData(timeTrackingRes.data);
      setViewingEmployee(employee);
  
      // Fetch promotion history
      setLoadingPromotionHistory(true);
      const promoRes = await axios.get(
        `${APIBASED_URL}/api/promotion/history/${employee.employeeId}`
      );
      setPromotionHistory(promoRes.data);
    } catch (error) {
      console.error("Error fetching employee details or promotion history:", error);
      setPromotionHistory([]);
    } finally {
      setLoadingPromotionHistory(false);
    }
  };

  const handlePromoteEmployee = async () => {
    try {
      // Validate inputs
      if (!promotionDetails.newPosition.trim()) {
        toast.error("Please enter a new position");
        return;
      }

      if (!promotionDetails.remarks.trim()) {
        toast.error("Please provide remarks for the promotion");
        return;
      }

      setLoading(true);
      setError(null);

      // Make API calls
      await axios.put(
        `${APIBASED_URL}/api/employeeData/${viewingEmployee.employeeId}`,
        {
          position: promotionDetails.newPosition,
        }
      );

      await axios.post(
        `${APIBASED_URL}/api/promotion/request/${viewingEmployee.employeeId}`,
        {
          newPosition: promotionDetails.newPosition,
          remarks: promotionDetails.remarks,
          requestedBy: firstName + " " + lastName,
          positionEffectiveAt: promotionDetails.positionEffectiveAt,
        }
      );

      toast.success("Employee promotion processed successfully");
      setViewingEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error("Error promoting employee:", error);
      toast.error(
        error.response?.data?.message || "Failed to promote employee"
      );
    } finally {
      setLoading(false);
    }
  };

  const performanceData = {
    totalHoursWorked: 160, // Total hours worked in a month
    tasksCompleted: 45, // Number of tasks completed
    meetingsAttended: 12, // Number of meetings attended
    performanceRating: 4.2, // Employee's performance rating out of 5
    trend: "up", // performance trend (can be 'up', 'down', or 'stable')
  };

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div>
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <div
          className={`flex-grow transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
          }`}
        >
          <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

          <div className="bg-white p-5 shadow-md">
            <BreadCrumbs />
            <h1 className="font-bold px-4 text-xl">Promotion Management</h1>
          </div>

          <div className="bg-gray-100 min-h-screen">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : viewingEmployee ? (
              <div className="m-5 p-4 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 p-4">
                  Employee Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={viewingEmployee.employeeId}
                      readOnly
                      className="w-full p-2 border border-gray-300 bg-transparent focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Fullname
                    </label>
                    <input
                      type="text"
                      value={viewingEmployee.fullname}
                      readOnly
                      className="w-full p-2 border border-gray-300 bg-transparent focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Current Position
                    </label>
                    <input
                      type="text"
                      value={viewingEmployee.position}
                      readOnly
                      className="w-full p-2 border border-gray-300 bg-transparent focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Department
                    </label>
                    <input
                      type="text"
                      value={viewingEmployee.department}
                      readOnly
                      className="w-full p-2 border border-gray-300 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 border rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    Promotion History
                  </h3>
                  {loadingPromotionHistory ? (
                    <div className="text-sm text-gray-500">
                      Loading promotion history...
                    </div>
                  ) : promotionHistory.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No promotion history found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full">
                        <thead>
                          <tr>
                            <th>Date Effected</th>
                            <th>Old Position</th>
                            <th>New Position</th>
                            <th>Remarks</th>
                            <th>Status</th>
                            <th>Promoted By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {promotionHistory.map((promo) => (
                            <tr key={promo._id}>
                              <td>
                                {promo.requestedAt
                                  ? new Date(
                                      promo.requestedAt
                                    ).toLocaleDateString()
                                  : "-"}
                              </td>
                              <td>{promo.oldPosition || "-"}</td>
                              <td>{promo.newPosition || "-"}</td>
                              <td>{promo.remarks || "-"}</td>
                              <td>{promo.status}</td>
                              <td>{promo.requestedBy || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {performanceData && (
                  <div className="mt-6 p-4 border rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-4">
                      Employee Performance Metrics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Total Hours Worked
                        </p>
                        <p className="font-medium text-xl">
                          {performanceData.totalHoursWorked} hrs
                        </p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">Tasks Completed</p>
                        <p className="font-medium text-xl">
                          {performanceData.tasksCompleted}
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Meetings Attended
                        </p>
                        <p className="font-medium text-xl">
                          {performanceData.meetingsAttended}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        Performance Rating:
                        <span className="ml-2 font-medium">
                          {performanceData.performanceRating} / 5
                        </span>
                      </p>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        Performance Trend:
                        <span
                          className={`ml-2 font-medium ${
                            performanceData.trend === "up"
                              ? "text-green-600"
                              : performanceData.trend === "down"
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {performanceData.trend === "up"
                            ? "↑ Improving"
                            : performanceData.trend === "down"
                            ? "↓ Declining"
                            : "→ Stable"}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 border rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    Promote Employee
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        New Position
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={promotionDetails.newPosition}
                        onChange={(e) =>
                          setPromotionDetails((prev) => ({
                            ...prev,
                            newPosition: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Remarks
                      </label>
                      <textarea
                        className="w-full p-2 border rounded"
                        value={promotionDetails.remarks}
                        onChange={(e) =>
                          setPromotionDetails((prev) => ({
                            ...prev,
                            remarks: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex space-x-4">
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={handlePromoteEmployee}
                      >
                        Confirm Promotion
                      </button>
                      <button
                        className="bg-gray-500 text-white px-4 py-2 rounded"
                        onClick={() => setViewingEmployee(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="overflow-x-auto bg-white rounded shadow">
                  <table className="min-w-full table-auto">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="px-4 py-2">Employee ID</th>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Department</th>
                        <th className="px-4 py-2">Current Position</th>
                        <th className="px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((employee) => (
                        <tr
                          key={employee.employeeId}
                          className="text-center border-t"
                        >
                          <td className="px-4 py-2">{employee.employeeId}</td>
                          <td className="px-4 py-2">{employee.fullname}</td>
                          <td className="px-4 py-2">{employee.department}</td>
                          <td className="px-4 py-2">{employee.position}</td>
                          <td className="px-4 py-2">
                            <button
                              className="bg-blue-500 text-white px-4 py-1 rounded"
                              onClick={() => handleViewDetails(employee)}
                            >
                              Promote
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Promotion;
