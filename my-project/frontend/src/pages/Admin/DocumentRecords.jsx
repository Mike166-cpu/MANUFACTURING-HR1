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

const DocumentRecords = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const adminToken = localStorage.getItem("adminToken");

  const [viewMode, setViewMode] = useState("employees");
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleResize = () => {
    setIsSidebarOpen(window.innerWidth >= 768);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const [employeeData, setEmployeeData] = useState([]);
  const fetchUser = async () => {
    try {
      const response = await axios.get(`${APIBASED_URL}/api/hr/employee-data`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setEmployeeData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  const [documents, setDocuments] = useState([]);
  const fetchDocuments = async (employeeId) => {
    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/uploaded-documents/approved-document`
      );
      const filteredDocs = response.data.filter(
        (doc) => doc.employee_id === employeeId
      );
      setDocuments(filteredDocs);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setViewMode("documents");
    fetchDocuments(employee._id);
  };

  const handleBack = () => {
    setViewMode("employees");
    setSelectedEmployee(null);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const [selectedRows, setSelectedRows] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const toggleRowSelection = (id) => {
    setSelectedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredData = employeeData
    .filter(
      (employee) =>
        employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((employee) =>
      filterStatus ? employee.status === filterStatus : true
    );

  const totalPages = Math.ceil(employeeData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, employeeData.length);
  const paginatedData = employeeData.slice(startIndex, endIndex);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`flex-grow transition-all duration-300 ${
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

        <div className="bg-white pb-4 px-5">
          <BreadCrumbs />
          <span className="px-4 font-bold text-2xl">Document Records</span>
        </div>

        <div className="p-6 bg-gray-100 min-h-screen">
          <div className="flex items-center mt-4 px-4 gap-4">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-md input-bordered"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select select-md select-bordered"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          {viewMode === "employees" ? (
            <div className="overflow-x-auto rounded-lg p-3">
              <table className="w-full border-collapse bg-white dark:bg-gray-900">
                <thead>
                  <tr className=" dark:bg-gray-700 text-gray-500 text-sm dark:text-gray-300 border-b">
                    <th className="p-3 text-left">{""}</th>
                    <th className="p-3 text-left">Profile</th>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Position</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((employee) => (
                    <tr
                      key={employee._id}
                      className={`border-b border-gray-300 hover:bg-gray-100 transition cursor-pointer ${
                        selectedRows[employee._id] ? "bg-blue-100" : ""
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          onChange={() => toggleRowSelection(employee._id)}
                          checked={!!selectedRows[employee._id]}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="p-3">
                        {employee.profilePicture ? (
                          <img
                            src={employee.profilePicture}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm">
                            {getInitials(employee.firstName, employee.lastName)}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {employee.firstName} {employee.lastName}
                      </td>
                      <td className="p-3">{employee.email || "N/A"}</td>
                      <td className="p-3">{employee.position}</td>
                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            employee.status === "Active"
                              ? "bg-green-200 text-green-700"
                              : "bg-green-200 text-700"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div
                          onClick={() => handleEmployeeClick(employee)}
                          className="cursor-pointer hover:underline hover:text-blue-400"
                        >
                          View Document
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between items-center bg-white p-4">
                <span className="text-sm text-gray-600">
                  Showing entries {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredData.length)} of{" "}
                  {filteredData.length}
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
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                    >
                      »
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="m-4">
              <button
                className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
                onClick={handleBack}
              >
                Back
              </button>
              <table className="w-full border-collapse bg-white dark:bg-gray-900">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-3 text-left">Request ID</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Uploaded At</th>
                    <th className="p-3 text-left">Document URL</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.length > 0 ? (
                    documents.map((doc, index) => (
                      <tr key={index} className="border-b border-gray-300">
                        <td className="p-3">{doc.request_id}</td>
                        <td className="p-3">{doc.status}</td>
                        <td className="p-3">
                          {new Date(doc.uploaded_at).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <a
                            href={doc.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            View Document
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-3 text-center text-gray-500">
                        No records were submitted.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentRecords;
