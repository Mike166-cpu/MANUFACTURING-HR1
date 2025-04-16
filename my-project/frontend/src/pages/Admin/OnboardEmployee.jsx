import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import axios from "axios";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import moment from "moment";
import Swal from "sweetalert2";
import Breadcrumbs from "../../Components/BreadCrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const socket = io("http://localhost:7685");
socket.on("connect", () => console.log("Connected to WebSocket"));
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

const OnboardEmployee = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const adminToken = localStorage.getItem("adminToken");

  const handleResize = () => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    document.title = "Onboard Applicants | HRMS";
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const [applicants, setApplicants] = useState([]);

  useEffect(() => {
    fetcApplicant();
  }, []);

  const [loading, setLoading] = useState(true); // <-- Add this line

  const fetcApplicant = async () => {
    try {
      const response = await axios.get(`${LOCAL}/api/onboarding/applicant`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      setApplicants(response.data); // Remove the filter here
      console.log("Fetched applicants:", response.data);
    } catch (error) {
      console.error("Error fetching applicants:", error);
    } finally {
      setLoading(false);
    }
  };

  const [actionLoading, setActionLoading] = useState({});

  const onboardApplicant = async (applicant) => {
    try {
      setActionLoading(prev => ({ ...prev, [applicant._id]: 'onboarding' }));
      await axios.post(
        `${LOCAL}/api/onboarding/accept`,
        { applicant },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      toast.success("Applicant onboarded successfully!");
      fetcApplicant();
    } catch (error) {
      console.error("Onboarding error:", error.response?.data || error.message);
      toast.error("Failed to onboard applicant.");
    } finally {
      setActionLoading(prev => ({ ...prev, [applicant._id]: null }));
    }
  };

  const archiveApplicant = async (applicant) => {
    try {
      setActionLoading(prev => ({ ...prev, [applicant._id]: 'archiving' }));
      await axios.post(
        `${LOCAL}/api/onboarding/archive`,
        { email: applicant.email },  // Changed from applicantId to email
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      setApplicants((prevApplicants) =>
        prevApplicants.filter((app) => app._id !== applicant._id)
      );
      toast.success("Employee archived successfully!");

      toast.success("Applicant archived successfully!");
      fetcApplicant(); // Refresh the list
    } catch (error) {
      console.error("Archiving error:", error.response?.data || error.message);
      toast.error("Failed to archive applicant.");
    } finally {
      setActionLoading(prev => ({ ...prev, [applicant._id]: null }));
    }
  };

  const unarchiveApplicant = async (applicant) => {
    try {
      setActionLoading(prev => ({ ...prev, [applicant._id]: 'unarchiving' }));
      await axios.post(
        `${LOCAL}/api/onboarding/unarchive`,
        { email: applicant.email },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      toast.success("Employee unarchived successfully!");
      fetcApplicant();
    } catch (error) {
      console.error("Unarchiving error:", error.response?.data || error.message);
      toast.error("Failed to unarchive applicant.");
    } finally {
      setActionLoading(prev => ({ ...prev, [applicant._id]: null }));
    }
  };

  const rejectApplicant = async (applicant) => {
    try {
      setActionLoading(prev => ({ ...prev, [applicant._id]: 'rejecting' }));
      await axios.post(
        `${LOCAL}/api/onboarding/reject`,
        { email: applicant.email },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      toast.success("Employee rejected successfully!");
      fetcApplicant();
    } catch (error) {
      console.error("Rejection error:", error.response?.data || error.message);
      toast.error("Failed to reject applicant.");
    } finally {
      setActionLoading(prev => ({ ...prev, [applicant._id]: null }));
    }
  };

  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const modalRef = useRef(null);
  const openModal = (applicant) => {
    setSelectedApplicant(applicant);
    if (modalRef.current) {
      modalRef.current.showModal();
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // Add this state
  const itemsPerPage = 10;

  // Add this function to filter and paginate applicants
  const filteredApplicants = applicants
    .filter((applicant) => {
      const matchesSearch = applicant.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          applicant.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = selectedDepartment ? applicant.department === selectedDepartment : true;
      
      // Status filtering
      switch (filterStatus) {
        case "archived":
          return applicant.archived && matchesSearch && matchesDepartment;
        case "unarchived":
          return !applicant.archived && !applicant.rejected && matchesSearch && matchesDepartment;
        case "rejected":
          return applicant.rejected && matchesSearch && matchesDepartment;
        case "onboarded":
          return applicant.onboarded && !applicant.archived && !applicant.rejected && matchesSearch && matchesDepartment;
        default:
          return matchesSearch && matchesDepartment;
      }
    });

  const totalPages = Math.ceil(filteredApplicants.length / itemsPerPage);
  const paginatedApplicants = filteredApplicants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique departments for filter dropdown
  const departments = [...new Set(applicants.map(app => app.department))];

  // Add the status filter dropdown to the UI
  const filterSection = (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <div className="form-control w-full md:w-64">
        <div className="relative">
          <input
            type="text"
            placeholder="Search employee..."
            className="input input-bordered w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <select
        className="select select-bordered w-full md:w-64"
        value={selectedDepartment}
        onChange={(e) => setSelectedDepartment(e.target.value)}
      >
        <option value="">All Departments</option>
        {departments.map((dept) => (
          <option key={dept} value={dept}>{dept}</option>
        ))}
      </select>

      <select
        className="select select-bordered w-full md:w-64"
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
      >
        <option value="all">All Status</option>
        <option value="onboarded">Onboarded</option>
        <option value="archived">Archived</option>
        <option value="unarchived">Pending</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>
  );

  // Add status badge component
  const StatusBadge = ({ applicant }) => {
    if (applicant.archived) return <span className="badge badge-neutral">Archived</span>;
    if (applicant.rejected) return <span className="badge badge-error">Rejected</span>;
    if (applicant.onboarded) return <span className="badge badge-success">Onboarded</span>;
    return <span className="badge badge-info">Pending</span>;
  };

  const [selectedRows, setSelectedRows] = useState(new Set());

  const toggleRowSelection = (id) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAllRows = () => {
    if (selectedRows.size === paginatedApplicants.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedApplicants.map(app => app._id)));
    }
  };

  // Update the action buttons in the table
  const actionButtons = (applicant) => (
    <td className="space-x-1">
      <div className="flex flex-wrap gap-1">
        <button 
          className="btn btn-xs btn-primary"
          onClick={() => openModal(applicant)}
        >
          View
        </button>

        {!applicant.onboarded && !applicant.rejected && !applicant.archived && (
          <>
            <button 
              className={`btn btn-xs btn-success ${actionLoading[applicant._id] === 'onboarding' ? 'loading' : ''}`}
              onClick={() => onboardApplicant(applicant)}
              disabled={actionLoading[applicant._id]}
            >
              {actionLoading[applicant._id] === 'onboarding' ? 'Onboarding...' : 'Onboard'}
            </button>
            <button 
              className={`btn btn-xs btn-warning ${actionLoading[applicant._id] === 'rejecting' ? 'loading' : ''}`}
              onClick={() => rejectApplicant(applicant)}
              disabled={actionLoading[applicant._id]}
            >
              {actionLoading[applicant._id] === 'rejecting' ? 'Rejecting...' : 'Reject'}
            </button>
          </>
        )}

        {applicant.onboarded && !applicant.archived && (
          <button 
            className={`btn btn-xs btn-error ${actionLoading[applicant._id] === 'archiving' ? 'loading' : ''}`}
            onClick={() => archiveApplicant(applicant)}
            disabled={actionLoading[applicant._id]}
          >
            {actionLoading[applicant._id] === 'archiving' ? 'Archiving...' : 'Archive'}
          </button>
        )}

        {applicant.archived && (
          <button 
            className={`btn btn-xs btn-info ${actionLoading[applicant._id] === 'unarchiving' ? 'loading' : ''}`}
            onClick={() => unarchiveApplicant(applicant)}
            disabled={actionLoading[applicant._id]}
          >
            {actionLoading[applicant._id] === 'unarchiving' ? 'Unarchiving...' : 'Unarchive'}
          </button>
        )}
      </div>
    </td>
  );

  return (
    <div>
      <ToastContainer />
      <div className="flex min-h-screen bg-base-200">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div
          className={`flex-grow transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
          } relative`}
        >
          <Navbar toggleSidebar={toggleSidebar} />
          {isSidebarOpen && isMobileView && (
            <div
              className="fixed inset-0 bg-gray-200 opacity-50 z-10"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
          )}
          <div className="bg-white p-5">
            <Breadcrumbs />
            <h1 className="text-lg font-bold">Onboard Applicants</h1>
          </div>

          <div className="p-6 min-h-screen">
            <div className="p-4">
              <div className="flex justify-between py-5">
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate("/employee-info")}
                >
                  View Onboarded Employees
                </button>
              </div>

              {filterSection}

              <table className="table w-full border border-gray-300 bg-white">
                <thead>
                  <tr className="bg-white">
                    <th>{""}
                    </th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Experience</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index} className="animate-pulse border-b">
                          <td>
                            <div className="h-4 bg-gray-300 rounded w-24 mx-auto"></div>
                          </td>
                          <td>
                            <div className="h-4 bg-gray-300 rounded w-32 mx-auto"></div>
                          </td>
                          <td>
                            <div className="h-4 bg-gray-300 rounded w-24 mx-auto"></div>
                          </td>
                          <td>
                            <div className="h-4 bg-gray-300 rounded w-24 mx-auto"></div>
                          </td>
                          <td>
                            <div className="h-4 bg-gray-300 rounded w-16 mx-auto"></div>
                          </td>
                          <td>
                            <div className="flex justify-center space-x-2">
                              <div className="h-8 w-20 bg-gray-300 rounded"></div>
                              <div className="h-8 w-28 bg-gray-300 rounded"></div>
                            </div>
                          </td>
                        </tr>
                      ))
                    : paginatedApplicants.map((applicant) => (
                        <tr 
                          key={applicant._id} 
                          className={`border-b ${
                            selectedRows.has(applicant._id) ? 'bg-base-200' : ''
                          }`}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedRows.has(applicant._id)}
                              onChange={() => toggleRowSelection(applicant._id)}
                            />
                          </td>
                          <td>
                            <div className="flex flex-col">
                              <span>{applicant.fullname}</span>
                              <StatusBadge applicant={applicant} />
                            </div>
                          </td>
                          <td>{applicant.email}</td>
                          <td>{applicant.department}</td>
                          <td>{applicant.role}</td>
                          <td>{applicant.experience}</td>
                          {actionButtons(applicant)}
                        </tr>
                      ))}
                  <tr>
                    <td colSpan="7">
                      <div className="flex justify-between items-center py-2 px-4">
                        <span>
                          Showing {Math.min(((currentPage - 1) * itemsPerPage) + 1, filteredApplicants.length)} to {Math.min(currentPage * itemsPerPage, filteredApplicants.length)} of {filteredApplicants.length} entries
                        </span>
                        <div className="join">
                          <button
                            className="join-item btn btn-sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                          >
                            «
                          </button>
                          <button
                            className="join-item btn btn-sm"
                            onClick={() => setCurrentPage(curr => Math.max(curr - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            ‹
                          </button>
                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i + 1}
                              className={`join-item btn btn-sm ${currentPage === i + 1 ? 'btn-active' : ''}`}
                              onClick={() => setCurrentPage(i + 1)}
                            >
                              {i + 1}
                            </button>
                          ))}
                          <button
                            className="join-item btn btn-sm"
                            onClick={() => setCurrentPage(curr => Math.min(curr + 1, totalPages))}
                            disabled={currentPage === totalPages}
                          >
                            ›
                          </button>
                          <button
                            className="join-item btn btn-sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                          >
                            »
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <dialog ref={modalRef} className="modal">
                <div className="modal-box">
                  {selectedApplicant && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={selectedApplicant.fullname}
                          disabled
                          className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="text"
                          value={selectedApplicant.email}
                          disabled
                          className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          value={selectedApplicant.department}
                          disabled
                          className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Position
                        </label>
                        <input
                          type="text"
                          value={selectedApplicant.role}
                          disabled
                          className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Experience
                        </label>
                        <input
                          type="text"
                          value={selectedApplicant.experience}
                          disabled
                          className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Education
                        </label>
                        <input
                          type="text"
                          value={selectedApplicant.education}
                          disabled
                          className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Skills
                        </label>
                        <input
                          type="text"
                          value={selectedApplicant.skills.join(", ")}
                          disabled
                          className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nationality
                        </label>
                        <input
                          type="text"
                          value={selectedApplicant.nationality}
                          disabled
                          className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Civil Status
                        </label>
                        <input
                          type="text"
                          value={selectedApplicant.civilStatus}
                          disabled
                          className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Resume
                        </label>
                        <a
                          href={selectedApplicant.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm underline"
                        >
                          View Resume
                        </a>
                      </div>

                      <div className="md:col-span-2 text-right mt-4">
                        <button
                          className="btn"
                          onClick={() => modalRef.current.close()}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardEmployee;
