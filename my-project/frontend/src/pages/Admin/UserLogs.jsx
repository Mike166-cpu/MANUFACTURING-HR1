import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import axios from "axios";
import BreadCrumbs from "../../Components/BreadCrumb";
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

const UserLogs = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const Local = "http://localhost:7685";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const adminToken = localStorage.getItem("adminToken");
  const gatewayToken = localStorage.getItem("gatewayToken");
  const role = localStorage.getItem("role");

  const handleResize = () => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const [userLogs, setUserLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  //FETCH USER LOGS
  const fetchUserLogs = async () => {
    try {
      const response = await axios.get(`${APIBASED_URL}/api/hr/logs`);
      setUserLogs(response.data);
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    if (role !== "Superadmin") {
      Swal.fire({
        icon: "warning",
        title: "Unauthorized",
        text: "You do not have permission to access this page.",
        confirmButtonText: "OK",
      }).then(() => navigate("/dashboard"));
      return;
    }
    fetchUserLogs();
  }, []);

  // FILTERING FUNCTION
  const filteredLogs = userLogs.filter((log) =>
    log.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
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

        {/* BREADCRUMBS */}
        <div className="bg-white pb-4 px-5">
          <BreadCrumbs />
          <span className="px-4 font-bold text-2xl"> User Logs</span>
        </div>

        {/* MAIN CONTENT */}
        <div className="p-6 bg-gray-100 min-h-screen">
          <div className="p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered w-full max-w-xs"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 border border-gray-200 rounded-lg">
                <thead className="text-xs text-black capitalize bg-white border-b">
                  <tr>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">IP Address</th>
                    <th className="px-6 py-3">User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log, index) => (
                    <tr
                      key={index}
                      className="bg-white border-b hover:bg-gray-50 text-xs"
                    >
                      <td className="px-6 py-4">{log.email}</td>
                      <td className="px-6 py-4">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">{log.ipAddress}</td>
                      <td className="px-6 py-4">{log.userAgent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* PAGINATION */}
            <div className="flex justify-between items-center bg-white p-4">
              {/* Showing Entries Info */}
              <span className="text-gray-600 text-sm">
                Showing{" "}
                {Math.min(
                  (currentPage - 1) * itemsPerPage + 1,
                  filteredLogs.length
                )}{" "}
                to {Math.min(currentPage * itemsPerPage, filteredLogs.length)}{" "}
                of {filteredLogs.length} entries
              </span>

              {/* Pagination Buttons */}
              {totalPages > 1 && (
                <div className="join">
                  {/* Previous Button */}
                  <button
                    className="join-item btn btn-sm"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                  >
                    «
                  </button>

                  {/* Page Number Buttons */}
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`join-item btn btn-sm ${
                        currentPage === index + 1 ? "btn-active" : ""
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}

                  {/* Next Button */}
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
            {/* END OF PAGINATION */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLogs;
