import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify"; // Add this import
import "react-toastify/dist/ReactToastify.css"; // Add this import
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import BreadCrumbs from "../../Components/BreadCrumb";

const Logs = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";
  
  const role = localStorage.getItem("role");
  console.log("Role from localStorage:", role);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "superadmin") {
      toast.error("Access denied. Only superadmin can view logs.");
      navigate("/dashboard");
      return;
    }
    fetchLogs();
  }, [navigate]);

  const fetchLogs = async () => {
    try {
      const email = localStorage.getItem('email');
      const response = await axios.get(`${APIBASED_URL}/api/logs/user-logs?email=${email}`);
      setLogs(response.data);
    } catch (error) {
      console.error("Error fetching logs:", error);
      if (error.response?.status === 403) {
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    const date = new Date(log.timestamp);
    const now = new Date();
    
    switch (dateFilter) {
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return matchesSearch && date >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return matchesSearch && date >= monthAgo;
      case 'twoMonths':
        const twoMonthsAgo = new Date(now.setMonth(now.getMonth() - 2));
        return matchesSearch && date >= twoMonthsAgo;
      case 'threeMonths':
        const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
        return matchesSearch && date >= threeMonthsAgo;
      default:
        return matchesSearch;
    }
  });

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const toggleRow = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const id = localStorage.getItem("employeeId");
  console.log("Employee ID:", id);

  return (
    <div className="flex min-h-screen bg-base-200">
      <ToastContainer /> {/* Add this component */}
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className={`flex-grow transition-all duration-300 ease-in-out ${
        isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
      }`}>
        <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="bg-white p-5">
          <BreadCrumbs />
          <h1 className="text-lg font-bold">Access Logs</h1>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="form-control w-full md:w-64">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search logs..."
                  className="input input-bordered w-full pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg
                  className="absolute left-3 top-3 h-5 w-5 text-gray-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <select
              className="select select-bordered w-full md:w-64"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="twoMonths">Last 2 Months</option>
              <option value="threeMonths">Last 3 Months</option>
            </select>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Admin</th>
                    <th>Employee</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index} className="animate-pulse">
                        <td><div className="h-4 bg-gray-300 rounded w-32"></div></td>
                        <td><div className="h-4 bg-gray-300 rounded w-40"></div></td>
                        <td><div className="h-4 bg-gray-300 rounded w-40"></div></td>
                        <td><div className="h-4 bg-gray-300 rounded w-24"></div></td>
                        <td><div className="h-4 bg-gray-300 rounded w-full"></div></td>
                      </tr>
                    ))
                  ) : (
                    paginatedLogs.map((log) => (
                      <tr key={log._id}>
                        <td>{formatDate(log.timestamp)}</td>
                        <td>{log.adminEmail}</td>
                        <td>{log.employeeName}</td>
                        <td>
                          <div className={`badge ${
                            log.action.toLowerCase().includes('create') ? 'badge-success' :
                            log.action.toLowerCase().includes('delete') ? 'badge-error' :
                            log.action.toLowerCase().includes('update') ? 'badge-warning' :
                            'badge-info'
                          }`}>
                            {log.action}
                          </div>
                        </td>
                        <td className="text-sm">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center p-4">
              <span>
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredLogs.length)} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of{" "}
                {filteredLogs.length} entries
              </span>
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  «
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    className={`join-item btn btn-sm ${currentPage === i + 1 ? "btn-active" : ""}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  »
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;
