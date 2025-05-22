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
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${APIBASED_URL}/api/employeeData/employees`
      );
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
    document.title = "Promotion Management | HRMS";
  }, []);

  const handleViewDetails = async (employee) => {
    try {
      // Get performance data from new endpoint
      const timeTrackingRes = await axios.get(
        `${APIBASED_URL}/api/promotion/performance/${employee.employeeId}`
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
      console.error(
        "Error fetching employee details or promotion history:",
        error
      );
      setPromotionHistory([]);
    } finally {
      setLoadingPromotionHistory(false);
    }
  };

  const handlePromoteEmployee = async () => {
    try {
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

      // First create the promotion request
      await axios.post(
        `${APIBASED_URL}/api/promotion/request/${viewingEmployee.employeeId}`,
        {
          oldPosition: viewingEmployee.position,
          newPosition: promotionDetails.newPosition,
          remarks: promotionDetails.remarks,
          requestedBy: firstName + " " + lastName,
          positionEffectiveAt: new Date().toISOString(),
        }
      );

      // Then update the employee position
      await axios.put(
        `${APIBASED_URL}/api/employeeData/${viewingEmployee.employeeId}`,
        {
          position: promotionDetails.newPosition,
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
  }

  const [searchQuery, setSearchQuery] = useState("");

  const filteredEmployees = employees.filter((emp) => {
    const matchesDepartment = filter === "All" || emp.department === filter;
    const matchesSearch =
      emp.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDepartment && matchesSearch;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = currentPage * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const handleSelectEmployee = (employeeId) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedEmployees(paginatedEmployees.map((emp) => emp.employeeId));
    } else {
      setSelectedEmployees([]);
    }
  };

  return (
    <div className="bg-gray-100">
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

          <div className="min-h-screen">
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
              <div className="m-5 p-5 bg-white rounded-lg shadow-md">
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
                              <td>{promo.requestedBy || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 border rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    Performance Summary
                  </h3>

                  {timeTrackingData ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow">
                          <div className="text-gray-600 text-sm">Attendance Rate</div>
                          <div className="text-xl font-semibold mt-2">
                            {timeTrackingData.attendanceRate?.toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                          <div className="text-gray-600 text-sm">Punctuality Rate</div>
                          <div className="text-xl font-semibold mt-2">
                            {timeTrackingData.punctualityRate?.toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                          <div className="text-gray-600 text-sm">Total Hours</div>
                          <div className="text-xl font-semibold mt-2">
                            {timeTrackingData.totalHours?.toFixed(1)}h
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                          <div className="text-gray-600 text-sm">Overtime Hours</div>
                          <div className="text-xl font-semibold mt-2">
                            {timeTrackingData.overtimeHours?.toFixed(1)}h
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg shadow">
                        <h4 className="font-medium text-gray-700 mb-3">Attendance Summary</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-gray-600">On Time</div>
                            <div className="text-lg font-semibold text-green-600">
                              {timeTrackingData.onTimeCount || 0} days
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Late</div>
                            <div className="text-lg font-semibold text-yellow-600">
                              {timeTrackingData.lateCount || 0} days
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Absent</div>
                            <div className="text-lg font-semibold text-red-600">
                              {timeTrackingData.absentCount || 0} days
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-500">
                      Loading performance data...
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 border rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    Promote Employee
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Current Position
                        </label>
                        <input
                          type="text"
                          className="w-full p-2 border rounded bg-gray-100"
                          value={viewingEmployee.position}
                          readOnly
                        />
                      </div>
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
                          placeholder="Enter new position"
                        />
                      </div>
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
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        onClick={handlePromoteEmployee}
                      >
                        Confirm Promotion
                      </button>
                      <button
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        onClick={() => setViewingEmployee(null)}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="p-4 bg-white rounded-lg shadow-md mb-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Input */}
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search by name, ID, or position..."
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Department Filter */}
                    <div className="w-full md:w-48">
                      <select
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="All">All Departments</option>
                        <option value="HR">HR</option>
                        <option value="IT">IT</option>
                        <option value="Finance">Finance</option>
                        {/* Add more departments as needed */}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <table className="min-w-full table-auto">
                    <thead className="bg-white border-b text-xs text-gray-600 uppercase tracking-wider">
                      <tr>
                        <th> </th>
                        <th className="p-3 text-left">Employee ID</th>
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Department</th>
                        <th className="p-3 text-left">Current Position</th>
                        <th className="p-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                      {paginatedEmployees.map((employee) => (
                        <tr
                          key={employee.employeeId}
                          className={`hover:bg-gray-50 ${
                            selectedEmployees.includes(employee.employeeId)
                              ? "bg-blue-50"
                              : "bg-white"
                          }`}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-gray-300"
                              checked={selectedEmployees.includes(
                                employee.employeeId
                              )}
                              onChange={() =>
                                handleSelectEmployee(employee.employeeId)
                              }
                            />
                          </td>
                          <td className="p-3">{employee.employeeId}</td>
                          <td className="p-3">{employee.fullname}</td>
                          <td className="p-3">{employee.department}</td>
                          <td className="p-3">{employee.position}</td>
                          <td className="p-3">
                            <button
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-xs"
                              onClick={() => handleViewDetails(employee)}
                            >
                              Promote
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  <div className="flex justify-between items-center mt-4 p-4 border-t">
                    <span className="text-sm text-gray-600">
                      Showing entries {indexOfFirstItem + 1} to{" "}
                      {Math.min(indexOfLastItem, filteredEmployees.length)} of{" "}
                      {filteredEmployees.length}
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
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                        >
                          »
                        </button>
                      </div>
                    )}
                  </div>
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
