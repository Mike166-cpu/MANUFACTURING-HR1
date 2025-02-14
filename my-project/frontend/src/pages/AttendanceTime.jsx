import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiSearch, FiFilter, FiCalendar } from 'react-icons/fi';

const AttendanceTime = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [timeTrackingSessions, setTimeTrackingSessions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [monthFilter, setMonthFilter] = useState('3'); // Default to last 3 months
  const [employeeSchedule, setEmployeeSchedule] = useState([]);

  const navigate = useNavigate();
  const LOCAL = "http://localhost:5000";
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";

  useEffect(() => {
    document.title = "Attendance and Time Tracking";
    const token = sessionStorage.getItem("adminToken");
    if (!token) navigate("/login");

    const fetchEmployees = async () => {
      try {
        const response = await axios.get(`${APIBASED_URL}/api/employee/employee-data`);
        setEmployees(response.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, [navigate]);

  const fetchTimeTrackingSessions = async (username) => {
    try {
      const response = await axios.get(`${APIBASED_URL}/api/time-tracking/${username}`);
      setTimeTrackingSessions(response.data);
    } catch (error) {
      console.error("Error fetching time tracking sessions:", error);
    }
  };

  const handleRowClick = (employee) => {
    setSelectedEmployee(employee);
    fetchTimeTrackingSessions(employee.employee_username);
  };

  const handleBackClick = () => {
    setSelectedEmployee(null);
    setTimeTrackingSessions([]);
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.employee_firstname.toLowerCase().includes(search.toLowerCase()) ||
      employee.employee_lastname.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      employee.employee_department.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const uniqueDepartments = [
    ...new Set(employees.map((employee) => employee.employee_department)),
  ];

  const getFilteredSessions = () => {
    const now = new Date();
    const monthsAgo = new Date();
    monthsAgo.setMonth(now.getMonth() - parseInt(monthFilter));
    
    return timeTrackingSessions.filter(session => 
      new Date(session.time_in) >= monthsAgo
    );
  };

  const filteredTimeTrackingSessions = getFilteredSessions();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSessions = filteredTimeTrackingSessions.slice(indexOfFirstItem, indexOfLastItem);

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
        <div className="p-6">
          {selectedEmployee ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={handleBackClick}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  Back
                </button>
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
              
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Time Tracking Sessions for{' '}
                    <span className="text-blue-600 capitalize bg-gray-100 px-2 rounded-md">
                      {selectedEmployee.employee_firstname} {selectedEmployee.employee_lastname}
                    </span>
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Time In
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Time Out
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Work Duration
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Break Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentSessions.map((session) => (
                        <tr 
                          key={session._id} 
                          className="hover:bg-blue-50 transition-colors duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(session.time_in).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {new Date(session.time_in).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {session.time_out 
                                ? new Date(session.time_out).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {session.work_duration}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              {session.break_duration 
                                ? `${Math.floor(session.break_duration / 3600)}h ${Math.floor((session.break_duration % 3600) / 60)}m`
                                : "N/A"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTimeTrackingSessions.length)} of {filteredTimeTrackingSessions.length} entries
                    </span>
                    <div className="flex space-x-2">
                      {Array.from({ length: Math.ceil(filteredTimeTrackingSessions.length / itemsPerPage) }, (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => paginate(i + 1)}
                          className={`px-3 py-1 rounded-md ${
                            currentPage === i + 1 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          } transition-colors duration-200`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Employee Records</h2>
                <p className="text-gray-600">Manage and view employee information</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
                  <div className="flex-1 relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="relative">
                    <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="all">All Departments</option>
                      {uniqueDepartments.map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          First Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEmployees.map((employee) => (
                        <tr 
                          key={employee._id}
                          className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {employee.employee_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {employee.employee_firstname}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {employee.employee_lastname}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {employee.employee_email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {employee.employee_department}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleRowClick(employee)}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                            >
                              View Session
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceTime;
