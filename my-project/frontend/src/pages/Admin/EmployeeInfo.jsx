import React, { useEffect, useState, useRef } from "react";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import BreadCrumbs from "../../Components/BreadCrumb";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "jspdf-autotable";

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

const EmployeeInfo = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const adminRole = localStorage.getItem("role");

  useEffect(() => {
    document.title = "Dashboard";

    const token = localStorage.getItem("adminToken");
    if (!token) {
      Swal.fire({
        title: "Not Logged In",
        text: "You are not logged in. Redirecting to login page...",
        icon: "warning",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/login");
      });
    }
  }, [navigate]);

  useEffect(() => {
    document.title = "Employee Records Management";
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

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

  //fetch employee
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const modalRef = useRef(null);

  const [revealedFields, setRevealedFields] = useState({});
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [tempEmployee, setTempEmployee] = useState(null);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ status: "", remarks: "" });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const toggleFieldReveal = (fieldName) => {
    setRevealedFields((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const maskData = (data, type = "text") => {
    if (!data) return "";
    if (type === "email") {
      const [username, domain] = data.split("@");
      return `${username.charAt(0)}${"*".repeat(
        username.length - 2
      )}${username.charAt(username.length - 1)}@${domain}`;
    }
    return `${"*".repeat(data.length - 4)}${data.slice(-4)}`;
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/employeeData/employees`
      );
      setEmployees(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employee data");
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  //fetch login data
  const fetchLoginData = async () => {
    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/login-admin/employee-data`
      );
      console.log("LOGIN ", response.data);
    } catch (error) {
      console.error("Error fetching login data:", error);
    }
  };

  useEffect(() => {
    fetchLoginData();
  }, []);

  const openDocumentModal = (doc) => {
    setSelectedDocument(doc);
    setIsModalOpen(true);
  };

  const email = localStorage.getItem("email");
  console.log("Email:", email);

  const adminId = localStorage.getItem("adminId");
  console.log("Admin ID:", adminId);

  const verifyPassword = async () => {
    setVerifying(true);
    try {
      const response = await axios.post(
        `${APIBASED_URL}/api/login-admin/verify-password`,
        {
          email: localStorage.getItem("email"),
          password: password,
        }
      );

      if (response.data.success) {
        // Log the access
        await axios.post(`${APIBASED_URL}/api/logs/user-logs`, {
          adminId: adminId,
          adminEmail: email,
          employeeId: tempEmployee.employeeId,
          employeeName: tempEmployee.fullname,
          action: "Viewed employee details",
          details: `Accessed sensitive information for employee ${tempEmployee.employeeId}`,
        });

        setShowPrivacyModal(false);
        setSelectedEmployee(tempEmployee);
        setPassword("");
      } else {
        toast.error("Invalid password");
      }
    } catch (error) {
      toast.error("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleViewEmployee = (employee) => {
    setTempEmployee(employee);
    setShowPrivacyModal(true);
  };

  const updateEmployeeStatus = async () => {
    try {
      const response = await axios.put(
        `${APIBASED_URL}/api/login-admin/status/${selectedEmployee._id}`,
        statusUpdate
      );

      if (response.data) {
        setSelectedEmployee(response.data);
        toast.success("Status updated successfully");
        setShowStatusModal(false);
        fetchEmployees(); // Refresh the list
      }
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    }
  };

  const statusOptions = [
    "Active",
    "Suspended",
    "Resigned",
    "Terminated",
    "Retired",
    "Deceased",
  ];
  const statusColors = {
    Active: "badge-success",
    Suspended: "badge-warning",
    Resigned: "badge-info",
    Terminated: "badge-error",
    Retired: "badge-neutral",
    Deceased: "badge-neutral",
  };

  const StatusUpdateButton = () => (
    <button
      className="btn btn-sm btn-outline"
      onClick={() => setShowStatusModal(true)}
    >
      Update Status
    </button>
  );

  const inputStyles =
    "input input-bordered w-full bg-base-100/50 cursor-not-allowed";

  // Add these new states for pagination and checkbox
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);
  const itemsPerPage = 10;

  // Add pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = currentPage * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Add checkbox function
  const toggleRowSelection = (employeeId) => {
    setSelectedRows((prevSelected) =>
      prevSelected.includes(employeeId)
        ? prevSelected.filter((id) => id !== employeeId)
        : [...prevSelected, employeeId]
    );
  };

  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true);
  // Add this function to handle when user accepts the privacy notice
  const handleAcceptPrivacy = () => {
    setShowPrivacyNotice(false);
    // Here you can add any additional logic needed when they accept
  };

  // Add this function to handle when user declines
  const handleDeclinePrivacy = () => {
    navigate(-1); // Go back to previous page
  };

  //fetch promotion
  // ...existing code...
  const [promotionHistory, setPromotionHistory] = useState([]);
  const [loadingPromotionHistory, setLoadingPromotionHistory] = useState(false);

  // Fetch promotion history when selectedEmployee changes
  useEffect(() => {
    const fetchPromotionHistory = async () => {
      if (!selectedEmployee) return;
      setLoadingPromotionHistory(true);
      try {
        const res = await axios.get(
          `${APIBASED_URL}/api/promotion/history/${selectedEmployee.employeeId}`
        );
        setPromotionHistory(res.data);
      } catch (err) {
        setPromotionHistory([]);
      } finally {
        setLoadingPromotionHistory(false);
      }
    };
    fetchPromotionHistory();
  }, [selectedEmployee]);

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      {showPrivacyNotice ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 rounded-lg max-w-sm w-full mx-4 p-6">
            <div className="flex flex-col gap-4">
              <div className="alert alert-info">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  You are accessing confidential employee information
                </span>
              </div>

              <p className="text-sm text-justify text-base-content/70">
                By proceeding, you agree to handle this sensitive information in
                accordance with company policies and data privacy regulations.
              </p>

              <div className="flex justify-end gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleDeclinePrivacy}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowPrivacyNotice(false)}
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex overflow-auto min-h-screen bg-base-200">
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
            <div className="bg-base-100 shadow-md py-4 px-6 mb-4">
              <BreadCrumbs />
              <div className="flex items-center mt-2">
                <span className="text-2xl px-4 font-bold">
                  Employee Information
                </span>
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="px-6 pb-6">
              <ToastContainer position="top-right" theme="colored" />

              {selectedEmployee ? (
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <div className="flex justify-between items-center mb-4">
                      <div className="card-actions justify-end mt-4">
                        <button
                          className="btn btn-outline"
                          onClick={() => setSelectedEmployee(null)}
                        >
                          Back to List
                        </button>
                      </div>
                    </div>

                    <div className="divider"></div>
                    <div>
                      <h3 className="font-bold text-lg">
                        Personal Information
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Personal Information Column */}
                      <div className="space-y-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Full Name
                            </span>
                          </label>
                          <input
                            type="text"
                            className={inputStyles}
                            value={
                              revealedFields.fullname
                                ? selectedEmployee.fullname
                                : maskData(selectedEmployee.fullname)
                            }
                            disabled
                            onClick={() => toggleFieldReveal("fullname")}
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Email
                            </span>
                          </label>
                          <input
                            type="email"
                            className={inputStyles}
                            value={
                              revealedFields.email
                                ? selectedEmployee.email
                                : maskData(selectedEmployee.email, "email")
                            }
                            disabled
                            onClick={() => toggleFieldReveal("email")}
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Gender
                            </span>
                          </label>
                          <input
                            type="text"
                            className={inputStyles}
                            value={selectedEmployee.gender}
                            disabled
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Nationality
                            </span>
                          </label>
                          <input
                            type="text"
                            className={inputStyles}
                            value={selectedEmployee.nationality}
                            disabled
                          />
                        </div>

                        <div className="form-control w-full">
                          <label className="label mb-1">
                            <span className="label-text text-sm font-medium text-gray-700">
                              Status
                            </span>
                          </label>
                          <div className="flex items-center justify-between gap-4 p-2 rounded-md border border-gray-200 bg-gray-50">
                            <span
                              className={`badge text-sm px-3 py-1 ${
                                statusColors[selectedEmployee.status] ||
                                "badge-ghost"
                              }`}
                            >
                              {selectedEmployee.status}
                            </span>
                            <StatusUpdateButton />
                          </div>
                        </div>
                      </div>

                      {/* Employment Details Column */}
                      <div className="space-y-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Employee ID
                            </span>
                          </label>
                          <input
                            type="text"
                            className={inputStyles}
                            value={selectedEmployee.employeeId}
                            disabled
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Department
                            </span>
                          </label>
                          <input
                            type="text"
                            className={inputStyles}
                            value={selectedEmployee.department}
                            disabled
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Position
                            </span>
                          </label>
                          <input
                            type="text"
                            className={inputStyles}
                            value={selectedEmployee.position}
                            disabled
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Address
                            </span>
                          </label>
                          <input
                            type="text"
                            className={inputStyles}
                            value={selectedEmployee.address}
                            disabled
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Skills
                            </span>
                          </label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedEmployee.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="badge badge-secondary"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Confidential Information Column */}
                      <div className="space-y-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Salary
                            </span>
                          </label>
                          <input
                            type="text"
                            className={`${inputStyles} ${
                              !revealedFields.salary && "blur-sm"
                            }`}
                            value={
                              revealedFields.salary
                                ? selectedEmployee.salary
                                : "*****"
                            }
                            disabled
                            onClick={() => toggleFieldReveal("salary")}
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Civil Status
                            </span>
                          </label>
                          <input
                            type="text"
                            className={`${inputStyles} ${
                              !revealedFields.civilStatus && "blur-sm"
                            }`}
                            value={
                              revealedFields.civilStatus
                                ? selectedEmployee.civilStatus
                                : "****"
                            }
                            disabled
                            onClick={() => toggleFieldReveal("civilStatus")}
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Hired Date
                            </span>
                          </label>
                          <input
                            type="text"
                            className={inputStyles}
                            value={new Date(
                              selectedEmployee.createdAt
                            ).toLocaleDateString()}
                            disabled
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Contact Number
                            </span>
                          </label>
                          <input
                            type="text"
                            className={inputStyles}
                            value={selectedEmployee.phoneNumber}
                            disabled
                          />
                        </div>
                      </div>
                    </div>

                    <div className="divider"></div>

                    {/* Education Background Section */}
                    <div>
                      <h3 className="font-bold text-lg mb-2">
                        Education Background
                      </h3>
                      {selectedEmployee.education &&
                      selectedEmployee.education.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="table table-zebra w-full">
                            <thead>
                              <tr>
                                <th>Level</th>
                                <th>School Name</th>
                                <th>Year Completed</th>
                                <th>Course</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedEmployee.education.map((edu, idx) => (
                                <tr key={idx}>
                                  <td>{edu.level}</td>
                                  <td>{edu.schoolName}</td>
                                  <td>{edu.yearCompleted}</td>
                                  <td>{edu.course || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          No education background provided.
                        </div>
                      )}
                    </div>

                    <div className="divider"></div>
                          <div>
                            <h3 className="font-bold text-lg mb-2">
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
                                      <th>Date</th>
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
                                          {new Date(
                                            promo.requestedAt
                                          ).toLocaleDateString()}
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

                    <div className="divider"></div>

                    {selectedEmployee.documents &&
                      selectedEmployee.documents.length > 0 && (
                        <>
                          <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-4">
                              Documents
                            </h3>
                            <div className="flex flex-wrap gap-4">
                              {selectedEmployee.documents.map((doc, index) => (
                                <button
                                  key={index}
                                  onClick={() => openDocumentModal(doc)}
                                  className="btn btn-outline btn-sm gap-2"
                                >
                                  {doc.url.endsWith(".pdf") ? (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                  )}
                                  {doc.name || `File ${index + 1}`}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Modal */}
                          {isModalOpen && selectedDocument && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center">
                              <div
                                className="fixed inset-0 bg-black opacity-50"
                                onClick={() => setIsModalOpen(false)}
                              ></div>
                              <div className="relative bg-white rounded-lg w-11/12 max-w-3xl">
                                <div className="p-4 border-b flex justify-between">
                                  <h3>Document Preview</h3>
                                  <button
                                    className="btn btn-sm btn-circle"
                                    onClick={() => setIsModalOpen(false)}
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div className="p-4">
                                  <div className="relative w-full min-h-[70vh]">
                                    {selectedDocument.url.endsWith(".pdf") ? (
                                      <div className="absolute inset-0 bg-white bg-opacity-60 blur-md hover:blur-none transition-all">
                                        <embed
                                          src={selectedDocument.url}
                                          type="application/pdf"
                                          className="w-full h-full"
                                        />
                                      </div>
                                    ) : (
                                      <img
                                        src={selectedDocument.url}
                                        alt="Document"
                                        className="max-h-[70vh] mx-auto"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                     
                        </>
                      )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="card-body">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <div className="flex items-center">
                        <div className="form-control">
                          <div className="input-group">
                            <input
                              type="text"
                              placeholder="Search employees..."
                              className="input input-bordered"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>
                        <button
                          className="btn btn-primary ml-2"
                          onClick={fetchEmployees}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {loading ? (
                      <div className="flex justify-center items-center py-8">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                      </div>
                    ) : filteredEmployees.length === 0 ? (
                      <div className="bg-white p-5 text-center  alert-info">
                        <span>No employees found matching your search.</span>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white table-auto">
                          <thead className="border-b text-xs text-gray-600 uppercase tracking-wider">
                            <tr>
                              <th className="p-3"></th>
                              <th className="p-3 text-left">Employee ID</th>
                              <th className="p-3 text-left">Full Name</th>
                              <th className="p-3 text-left">Email</th>
                              <th className="p-3 text-left">Department</th>
                              <th className="p-3 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 text-sm">
                            {paginatedEmployees.length > 0 ? (
                              paginatedEmployees.map((employee) => (
                                <tr
                                  key={employee._id}
                                  className={`${
                                    selectedRows.includes(employee._id)
                                      ? "bg-blue-50"
                                      : ""
                                  } hover:bg-gray-50`}
                                >
                                  <td className="p-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedRows.includes(
                                        employee._id
                                      )}
                                      onChange={() =>
                                        toggleRowSelection(employee._id)
                                      }
                                    />
                                  </td>
                                  <td className="p-3 font-medium">
                                    {employee.employeeId}
                                  </td>
                                  <td className="p-3 font-medium capitalize">
                                    {employee.fullname}
                                  </td>
                                  <td className="p-3">{employee.email}</td>
                                  <td className="p-3">
                                    <div className="badge badge-ghost">
                                      {employee.department}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <button
                                      className="btn btn-primary btn-sm"
                                      onClick={() =>
                                        handleViewEmployee(employee)
                                      }
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 mr-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                      </svg>
                                      View
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan="6"
                                  className="text-center py-4 text-gray-500"
                                >
                                  No employees found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>

                        {/* Pagination Controls */}
                        <div className="flex justify-between items-center border-t p-4 bg-white">
                          <span className="text-sm text-gray-600">
                            Showing entries {indexOfFirstItem + 1} to{" "}
                            {Math.min(
                              indexOfLastItem,
                              filteredEmployees.length
                            )}{" "}
                            of {filteredEmployees.length}
                          </span>

                          {totalPages > 1 && (
                            <div className="join">
                              <button
                                className="join-item btn btn-sm"
                                disabled={currentPage === 1}
                                onClick={() =>
                                  setCurrentPage((prev) =>
                                    Math.max(prev - 1, 1)
                                  )
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
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add Privacy Confirmation Modal */}
          {showPrivacyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="fixed inset-0 bg-black opacity-50"
                onClick={() => setShowPrivacyModal(false)}
              ></div>
              <div className="relative bg-base-100 rounded-lg w-96 shadow-xl">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4">
                    Data Privacy Notice
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-base-content/70">
                      You are about to view sensitive employee information. This
                      data is protected under data privacy regulations. By
                      proceeding, you agree to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-base-content/70">
                      <li>Use this information for work purposes only</li>
                      <li>
                        Not share this information with unauthorized parties
                      </li>
                      <li>Handle all data in accordance with company policy</li>
                    </ul>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Enter your password to continue
                        </span>
                      </label>
                      <input
                        type="password"
                        className="input input-bordered"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                      />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                      <button
                        className="btn btn-ghost"
                        onClick={() => {
                          setShowPrivacyModal(false);
                          setPassword("");
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className={`btn btn-primary ${
                          verifying ? "loading" : ""
                        }`}
                        onClick={verifyPassword}
                        disabled={!password || verifying}
                      >
                        {verifying ? "Verifying..." : "Proceed"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Status Update Modal */}
          {showStatusModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="fixed inset-0 bg-black opacity-50"
                onClick={() => setShowStatusModal(false)}
              ></div>
              <div className="relative bg-base-100 rounded-lg w-96 shadow-xl">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4">
                    Update Employee Status
                  </h3>
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Status</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={statusUpdate.status}
                        onChange={(e) =>
                          setStatusUpdate((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select Status</option>
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Remarks</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-24"
                        placeholder="Enter remarks"
                        value={statusUpdate.remarks}
                        onChange={(e) =>
                          setStatusUpdate((prev) => ({
                            ...prev,
                            remarks: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                      <button
                        className="btn btn-ghost"
                        onClick={() => setShowStatusModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={updateEmployeeStatus}
                        disabled={!statusUpdate.status}
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeInfo;
