import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import axios from "axios";
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

const TimeTrackingRecords = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const adminToken = localStorage.getItem("adminToken");
  const gatewayToken = localStorage.getItem("gatewayToken");

  const handleResize = () => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    handleResize();
    fetchEmployees();
    fetchTimeData();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  //FETCH EMPLOYESS
  const [employees, setEmployees] = useState([]);
  const [selectedRows, setSelectedRows] = useState({});
  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${APIBASED_URL}/api/hr/employee-data`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setEmployees(response.data);
      // console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedRows((prev) => ({
      ...prev,
      [id]: !prev[id], // Toggle row selection
    }));
  };

  //Fetc time tracking data
  const [timeData, setTimeData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const fetchTimeData = async () => {
    try {
      const response = await axios.get(`${APIBASED_URL}/api/timetrack/approveTime`);
      setTimeData(response.data);
      console.log("All time tracking data:", response.data);
    } catch (error) {
      console.error("Error fetching time data:", error);
    }
  };

  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);

  const handleRowClick = async (employee) => {
    console.log("Selected employee:", employee);
    try {
      const response = await axios.get(`${APIBASED_URL}/api/timetrack/approveTime`);
      const allTimeData = response.data;

      // Debugging: Check the structure of fetched data
      console.log("Fetched Time Data:", allTimeData);

      const employeeTimeData = allTimeData.filter((time) => {
        console.log("Comparing:", {
          "time.employee_id": time.employee_id,
          "employee._id": employee._id,
          match: String(time.employee_id) === String(employee._id),
        });
        return String(time.employee_id) === String(employee._id);
      });

      console.log("Filtered time data for employee:", employeeTimeData);
      setSelectedEmployeeData({ employee, timeData: employeeTimeData });
    } catch (error) {
      console.error("Error fetching fresh time data:", error);
    }
  };

  const handleBack = () => {
    setSelectedEmployeeData(null);
  };

  //filters
  const [searchName, setSearchName] = useState("");
  const [searchPosition, setSearchPosition] = useState("");
  const positions = [
    "All",
    "Reseller Sales Head",
    "Reseller",
    "Employee",
    "Production Head",
  ];

  // Search filter logic
  const filteredEmployees = employees.filter((employee) => {
    return (
      (searchName
        ? `${employee.firstName} ${employee.lastName}`
            .toLowerCase()
            .includes(searchName.toLowerCase())
        : true) &&
      (searchPosition && searchPosition !== "All"
        ? employee.position.toLowerCase() === searchPosition.toLowerCase()
        : true)
    );
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(employees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, employees.length);

  return (
    <div>
      <div className="flex min-h-screen">
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
          <div className="bg-white p-5">
            <Breadcrumbs />
            <div className="flex justify-between items-center px-5">
              <h1 className="text-lg font-bold">Time Tracking Records</h1>
            </div>
          </div>

          <div className="p-6 bg-gray-100 min-h-screen">
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Search by Name"
                className="text-sm p-3 border border-gray-300 rounded-lg w-full sm:w-64 md:w-80 placeholder-black"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              <select
                className="select pl-3 pr-8 p-3 border border-gray-300 rounded-lg w-full sm:w-40 text-sm"
                value={searchPosition}
                onChange={(e) => setSearchPosition(e.target.value)}
              >
                {positions.map((position, index) => (
                  <option key={index} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>

            {!selectedEmployeeData ? (
              <div className="overflow-x-auto bg-white rounded-lg">
                <table className="table bg-white">
                  {/* Original table header */}
                  <thead className="bg-white">
                    <tr className="bg-white">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {""}
                      </th>
                      <th className="border-b p-3">Employee Name</th>
                      <th className="border-b p-3">Role</th>
                      <th className="border-b p-3">Position</th>
                      <th className="border-b p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee) => (
                        <tr
                          key={employee._id}
                          className={`border-b ${
                            selectedRows[employee._id] ? "bg-green-200" : ""
                          } cursor-pointer hover:bg-gray-100`}
                          onClick={() => handleRowClick(employee)}
                        >
                          <td
                            className="border-b p-2 px-6 py-4 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={!!selectedRows[employee._id]}
                              onChange={() =>
                                handleCheckboxChange(employee._id)
                              }
                            />
                          </td>
                          <td className="border-b p-2">
                            {employee.firstName} {employee.lastName}
                          </td>
                          <td className="border-b p-2">{employee.role}</td>
                          <td className="border-b p-2">{employee.position}</td>
                          <td className="border-b p-2">
                            <span className="hover:underline hover:text-blue-600">
                              View Time Records
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center p-4 text-gray-500"
                        >
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="flex justify-between items-center p-4">
                  <span className="text-sm text-gray-600">
                    Showing entries {startIndex + 1} to {endIndex} of{" "}
                    {employees.length}
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
            ) : (
              <div className="rounded-lg p-4">
                {selectedEmployeeData && (
                  <button
                    onClick={handleBack}
                    className="btn-sm bg-blue-500 text-white rounded hover:bg-blue-600 my-2"
                  >
                    Back
                  </button>
                )}
                <div className="overflow-x-auto">
                  <table className="table bg-white w-full">
                    <thead>
                      <tr>
                        <th className="border-b p-3">Date</th>
                        <th className="border-b p-3">Time In</th>
                        <th className="border-b p-3">Time Out</th>
                        <th className="border-b p-3">Total Hours</th>
                        <th className="border-b p-3">Status</th>
                        <th className="border-b p-3">Entry Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEmployeeData.timeData.length > 0 ? (
                        selectedEmployeeData.timeData.map((record) => (
                          <tr key={record._id} className="border-b">
                            <td className="p-3">
                              {new Date(record.time_in).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              {new Date(record.time_in).toLocaleTimeString()}
                            </td>
                            <td className="p-3">
                              {record.time_out
                                ? new Date(record.time_out).toLocaleTimeString()
                                : "-"}
                            </td>
                            <td className="p-3">{record.total_hours || "-"}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  record.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : record.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : record.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {record.status}
                              </span>
                            </td>
                            <td className="p-3">{record.entry_type}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="text-center p-4 text-gray-500"
                          >
                            No time records available
                          </td>
                        </tr>
                      )}
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

export default TimeTrackingRecords;
