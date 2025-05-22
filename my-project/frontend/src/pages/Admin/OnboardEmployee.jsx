import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    fetchDocumentRequest();
  }, []); 

  const renderDocumentRequests = (employeeId) => {
    const employeeRequests = documentRequests.filter(
      request => request.employeeId === employeeId
    );
  
    return (
      <div className="space-y-2">
        {employeeRequests.map((request) => (
          <div key={request.request_id} className="flex items-center justify-between bg-base-100 p-2 rounded">
            <span>{request.document_name}</span>
            <span className={`badge ${
              request.status === 'Approved' ? 'badge-success' : 
              request.status === 'Rejected' ? 'badge-error' : 
              'badge-warning'
            }`}>
              {request.status}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const [loading, setLoading] = useState(true); 

  const [documentRequests, setDocumentRequests] = useState([]);

  const fetchDocumentRequest = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${APIBASED_URL}/api/document-request`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      
      console.log("Document Requests:", response.data);
      setDocumentRequests(response.data);
  
    } catch (error) {
      console.error("Error fetching document requests:", error);
      toast.error("Failed to fetch document requests");
    } finally {
      setLoading(false);
    }
  };
  
  

  const fetcApplicant = async () => {
    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/onboarding/applicant`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
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
    if (!applicant || !applicant._id) {
      toast.error("Invalid applicant data.");
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [applicant._id]: "onboarding" }));

      const response = await axios.post(
        `${APIBASED_URL}/api/onboarding/accept`,
        { applicant },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      toast.success(
        response.data?.message || "Applicant onboarded successfully!"
      );
      fetcApplicant(); // make sure this is spelled correctly
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to onboard applicant.";
      console.error("Onboarding error:", errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading((prev) => ({ ...prev, [applicant._id]: null }));
    }
  };

  const archiveApplicant = async (applicant) => {
    try {
      setActionLoading((prev) => ({ ...prev, [applicant._id]: "archiving" }));
      await axios.post(
        `${APIBASED_URL}/api/onboarding/archive`,
        { email: applicant.email }, // Changed from applicantId to email
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
      setActionLoading((prev) => ({ ...prev, [applicant._id]: null }));
    }
  };

  const unarchiveApplicant = async (applicant) => {
    try {
      setActionLoading((prev) => ({ ...prev, [applicant._id]: "unarchiving" }));
      await axios.post(
        `${APIBASED_URL}/api/onboarding/unarchive`,
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
      console.error(
        "Unarchiving error:",
        error.response?.data || error.message
      );
      toast.error("Failed to unarchive applicant.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [applicant._id]: null }));
    }
  };

  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const modalRef = useRef(null);
  const openModal = async (applicant) => {
    setSelectedApplicant(applicant);
    if (applicant.inOnboarding) {
      try {
        // Always fetch onboarding record to get the correct employeeId
        const response = await axios.get(
          `${APIBASED_URL}/api/onboarding/onboard`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );
        const onboardingRecord = response.data.find(
          (record) => record.email === applicant.email
        );
        if (onboardingRecord) {
          setOnboardingStatus(onboardingRecord); // Set initial status directly from record
        } else {
          setOnboardingStatus(null);
        }
      } catch (error) {
        setOnboardingStatus(null);
        toast.error("Failed to load onboarding status");
      }
    } else {
      setOnboardingStatus(null);
    }
    modalRef.current.showModal();
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("unarchived"); // Change default to "unarchived"
  const itemsPerPage = 10;

  // Update the filtering logic
  const filteredApplicants = applicants.filter((applicant) => {
    const matchesSearch =
      applicant.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment
      ? applicant.department === selectedDepartment
      : true;

    // Status filtering with updated logic
    switch (filterStatus) {
      case "archived":
        return applicant.archived && matchesSearch && matchesDepartment;
      case "unarchived": // Show only unarchived applicants
        return !applicant.archived && matchesSearch && matchesDepartment;
      case "rejected":
        return applicant.rejected && matchesSearch && matchesDepartment;
      case "onboarded":
        return (
          applicant.onboarded &&
          !applicant.archived &&
          !applicant.rejected &&
          matchesSearch &&
          matchesDepartment
        );
      case "all": // Only show all when explicitly selected
        return matchesSearch && matchesDepartment;
      default:
        return !applicant.archived && matchesSearch && matchesDepartment;
    }
  });

  const totalPages = Math.ceil(filteredApplicants.length / itemsPerPage);
  const paginatedApplicants = filteredApplicants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique departments for filter dropdown
  const departments = [...new Set(applicants.map((app) => app.department))];

  // Update the filter section JSX
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
        value={selectedDepartment}
        onChange={(e) => setSelectedDepartment(e.target.value)}
      >
        <option value="">All Departments</option>
        {departments.map((dept) => (
          <option key={dept} value={dept}>
            {dept}
          </option>
        ))}
      </select>

      <select
        className="select select-bordered w-full md:w-64"
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
      >
        {/* Remove "Pending" and "All" options */}
        <option value="unarchived">Active</option>
        <option value="onboarded">Onboarded</option>
        <option value="archived">Archived</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>
  );

  // Add status badge component
  const StatusBadge = ({ applicant }) => {
    if (applicant.archived)
      return <span className="badge badge-neutral">Archived</span>;
    if (applicant.rejected)
      return <span className="badge badge-error">Rejected</span>;
    if (applicant.onboarded)
      return <span className="badge badge-success">Onboarded</span>;
    if (applicant.inOnboarding)
      return <span className="badge badge-warning">In Progress</span>;
    return <span className="badge badge-info">Pending</span>;
  };

  const [selectedRows, setSelectedRows] = useState(new Set());

  const toggleRowSelection = (id) => {
    setSelectedRows((prev) => {
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
      setSelectedRows(new Set(paginatedApplicants.map((app) => app._id)));
    }
  };

  const [isViewingOnboarding, setIsViewingOnboarding] = useState(false);
  const [onboardingDetails, setOnboardingDetails] = useState(null);

  const fetchOnboardingStatus = async (employeeId) => {
    if (!employeeId) {
      console.error("No employeeId provided");
      return;
    }
    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/onboarding/status/${employeeId}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      setOnboardingStatus(response.data);
    } catch (error) {
      console.error("Error fetching onboarding status:", error);
    }
  };

  const updateOnboardingStatus = async (updates) => {
    if (!onboardingStatus || !onboardingStatus.employeeId) {
      toast.error("Unable to update status - missing reference");
      return;
    }

    try {
      const allStepsCompleted = Object.values(
        updates.completionSteps || {}
      ).every((step) => step === true);
      const updatedStatus = allStepsCompleted
        ? "Completed"
        : updates.onboardingStatus;

      const response = await axios.put(
        `${APIBASED_URL}/api/onboarding/status/${onboardingStatus.employeeId}`,
        {
          completionSteps: updates.completionSteps,
          onboardingStatus: updatedStatus,
          notes: updates.notes,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      if (response.data.employeeCreated) {
        toast.success(
          "All steps completed! Employee account created successfully!"
        );
        modalRef.current.close();
        fetcApplicant();
      } else {
        setOnboardingStatus(response.data.onboarding);
        toast.success("Onboarding status updated");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update status");
    }
  };

  const openOnboardingDetails = async (onboardingId) => {
    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/onboarding/onboarding-status/${onboardingId}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      setOnboardingDetails(response.data);
      setIsViewingOnboarding(true);
    } catch (error) {
      toast.error("Failed to fetch onboarding details");
    }
  };

  const renderOnboardingDetails = () => (
    <div className="modal-box max-w-3xl">
      <h3 className="font-bold text-lg mb-4">Onboarding Progress</h3>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Employee Name:</p>
            <p>{onboardingDetails?.fullname}</p>
          </div>
          <div>
            <p className="font-semibold">Status:</p>
            <select
              className="select select-bordered w-full"
              value={onboardingDetails?.onboardingStatus}
              onChange={(e) =>
                updateOnboardingStatus({
                  ...onboardingDetails,
                  onboardingStatus: e.target.value,
                })
              }
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="divider">Completion Steps</div>

        <div className="grid gap-2">
          {Object.entries(onboardingDetails?.completionSteps || {}).map(
            ([step, completed]) => (
              <div key={step} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={(e) =>
                    updateOnboardingStatus({
                      ...onboardingDetails,
                      completionSteps: {
                        ...onboardingDetails.completionSteps,
                        [step]: e.target.checked,
                      },
                    })
                  }
                  className="checkbox"
                />
                <span className="capitalize">
                  {step.replace(/([A-Z])/g, " $1").toLowerCase()}
                </span>
              </div>
            )
          )}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Notes</span>
          </label>
          <textarea
            className="textarea textarea-bordered"
            value={onboardingDetails?.notes ?? ""}
            onChange={(e) =>
              updateOnboardingStatus({
                ...onboardingDetails,
                notes: e.target.value,
              })
            }
          ></textarea>
        </div>

        <div className="modal-action">
          <button
            className="btn btn-ghost"
            onClick={() => {
              setIsViewingOnboarding(false);
              modalRef.current.close();
            }}
          >
            Back to List
          </button>
        </div>
      </div>
    </div>
  );

  const renderModal = () => (
    <dialog ref={modalRef} className="modal">
      <div className="modal-box max-w-4xl">
        {selectedApplicant && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                Employee Onboarding Progress
              </h3>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => modalRef.current.close()}
              >
                ✕
              </button>
            </div>

            {/* Always show onboarding progress UI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-base-200 p-4 rounded-lg max-h-[70vh] overflow-y-auto">
                {/* Basic Info Section */}
                <h4 className="font-semibold mb-3">Basic Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <input
                      type="text"
                      value={onboardingStatus?.fullname ?? selectedApplicant.fullname ?? ""}
                      disabled
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <input
                      type="text"
                      value={onboardingStatus?.email ?? selectedApplicant.email ?? ""}
                      disabled
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Department</label>
                    <input
                      type="text"
                      value={onboardingStatus?.department ?? selectedApplicant.department ?? ""}
                      disabled
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Position</label>
                    <input
                      type="text"
                      value={onboardingStatus?.position ?? selectedApplicant.role ?? ""}
                      disabled
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Experience</label>
                    <input
                      type="text"
                      value={onboardingStatus?.experience ?? selectedApplicant.experience ?? ""}
                      disabled
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Education</label>
                    <input
                      type="text"
                      value={onboardingStatus?.education ?? selectedApplicant.education ?? ""}
                      disabled
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>

                {/* Documents Section */}
                <div className="mt-6">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold mb-3">Documents</h4>
                  </div>

                  <div className="space-y-2">
                    {(onboardingStatus?.documents ?? selectedApplicant.documents ?? []).map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-base-100 p-2 rounded"
                      >
                        <span>{doc.name}</span>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-xs btn-link"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-5">
                  <h4 className="text-sm font-semibold mb-3">To Follow Documents</h4>
                  <Link to="/request-documents">
                    <h4 className="mb-3 text-xs font-medium bg-blue-200 text-blue-600 px-2 rounded-full cursor-pointer hover:underline hover:bg-blue-300 transition">
                      Request Documents
                    </h4>
                  </Link>
                </div>
                {renderDocumentRequests(onboardingStatus?.employeeId ?? selectedApplicant.employeeId)}
              </div>

              <div className="bg-base-200 p-4 rounded-lg max-h-[70vh] overflow-y-auto">
                <h4 className="font-semibold mb-3">Onboarding Progress</h4>
                <div className="space-y-4">
                  <div className="bg-base-100 p-3 rounded-lg">
                    <label className="text-sm font-medium block mb-2">
                      Current Status
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={onboardingStatus?.onboardingStatus || "Pending"}
                      onChange={(e) =>
                        updateOnboardingStatus({
                          ...onboardingStatus,
                          onboardingStatus: e.target.value,
                        })
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="bg-base-100 p-3 rounded-lg">
                    <label className="text-sm font-medium block mb-2">
                      Completion Steps
                    </label>
                    <div className="space-y-2">
                      {Object.entries(
                        onboardingStatus?.completionSteps || {}
                      ).map(([step, completed]) => (
                        <div
                          key={step}
                          className="flex items-center gap-2 hover:bg-base-200 p-2 rounded transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={completed}
                            onChange={(e) =>
                              updateOnboardingStatus({
                                ...onboardingStatus,
                                completionSteps: {
                                  ...onboardingStatus.completionSteps,
                                  [step]: e.target.checked,
                                },
                              })
                            }
                          />
                          <span className="capitalize">
                            {step.replace(/([A-Z])/g, " $1").toLowerCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-base-100 p-3 rounded-lg">
                    <label className="text-sm font-medium block mb-2">
                      Notes
                    </label>
                    <textarea
                      className="textarea textarea-bordered w-full min-h-[100px]"
                      value={onboardingStatus?.notes ?? ""}
                      onChange={(e) =>
                        updateOnboardingStatus({
                          ...onboardingStatus,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Add notes about the onboarding process..."
                    />
                  </div>

                  <div className="p-2 rounded-lg bg-base-100">
                    <div className="text-sm">
                      {Object.values(
                        onboardingStatus?.completionSteps || {}
                      ).every((step) => step === true) ? (
                        <div className="text-success flex items-center gap-2">
                          <span className="text-lg">✓</span>
                          <span className="font-semibold">
                            All steps completed!
                          </span>
                        </div>
                      ) : (
                        <div className="text-info flex items-center gap-2">
                          <span className="loading loading-spinner loading-sm"></span>
                          <span className="font-semibold">
                            Completion in progress...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => modalRef.current.close()}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );

  const actionButtons = (applicant) => {
    // Get onboarding status from multiple sources
    const onboardingRecord =
      onboardingStatus?.email === applicant.email ? onboardingStatus : null;
    const isCompleted =
      onboardingRecord?.onboardingStatus === "Completed" || // Check onboarding record
      applicant.onboardingStatus === "Completed" || // Check applicant's own status
      applicant.status === "Active" || // Check if already an active employee
      applicant.onboarded; // Check if marked as onboarded

    return (
      <td className="space-x-1">
        <div className="flex flex-wrap gap-1">
          <button
            className="btn btn-xs btn-primary"
            onClick={() => openModal(applicant)}
          >
            {applicant.inOnboarding || applicant.onboarded
              ? "View Progress"
              : "View Details"}
          </button>

          {/* Show Onboard only for new applicants */}
          {!applicant.inOnboarding &&
            !applicant.onboarded &&
            !applicant.rejected &&
            !applicant.archived && (
            <button
              className={`btn btn-xs btn-success ${
                actionLoading[applicant._id] === "onboarding"
                  ? "loading"
                  : ""
              }`}
              onClick={() => onboardApplicant(applicant)}
              disabled={actionLoading[applicant._id]}
            >
              {actionLoading[applicant._id] === "onboarding"
                ? "Processing..."
                : "Onboard"}
            </button>
          )}

          {/* Archive/Unarchive buttons */}
          {applicant.onboarded && !applicant.archived && (
            <button
              className={`btn btn-xs btn-error ${
                actionLoading[applicant._id] === "archiving" ? "loading" : ""
              }`}
              onClick={() => archiveApplicant(applicant)}
              disabled={actionLoading[applicant._id]}
            >
              {actionLoading[applicant._id] === "archiving"
                ? "Archiving..."
                : "Archive"}
            </button>
          )}

          {applicant.archived && (
            <button
              className={`btn btn-xs btn-info ${
                actionLoading[applicant._id] === "unarchiving" ? "loading" : ""
              }`}
              onClick={() => unarchiveApplicant(applicant)}
              disabled={actionLoading[applicant._id]}
            >
              {actionLoading[applicant._id] === "unarchiving"
                ? "Unarchiving..."
                : "Unarchive"}
            </button>
          )}
        </div>
      </td>
    );
  };

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
            <h1 className="text-xls font-bold px-4">Onboard Applicants</h1>
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
                  <tr className="bg-white border-b-4">
                    <th>{""}</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Status</th>
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
                            selectedRows.has(applicant._id) ? "bg-base-200" : ""
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
                            </div>
                          </td>

                          <td>{applicant.email}</td>
                          <td>{applicant.department}</td>
                          <td>
                            {" "}
                            <StatusBadge applicant={applicant} />
                          </td>
                          {actionButtons(applicant)}
                        </tr>
                      ))}
                  <tr>
                    <td colSpan="7">
                      <div className="flex justify-between items-center py-2 px-4">
                        <span>
                          Showing{" "}
                          {Math.min(
                            (currentPage - 1) * itemsPerPage + 1,
                            filteredApplicants.length
                          )}{" "}
                          to{" "}
                          {Math.min(
                            currentPage * itemsPerPage,
                            filteredApplicants.length
                          )}{" "}
                          of {filteredApplicants.length} entries
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
                            onClick={() =>
                              setCurrentPage((curr) => Math.max(curr - 1, 1))
                            }
                            disabled={currentPage === 1}
                          >
                            ‹
                          </button>
                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i + 1}
                              className={`join-item btn btn-sm ${
                                currentPage === i + 1 ? "btn-active" : ""
                              }`}
                              onClick={() => setCurrentPage(i + 1)}
                            >
                              {i + 1}
                            </button>
                          ))}
                          <button
                            className="join-item btn btn-sm"
                            onClick={() =>
                              setCurrentPage((curr) =>
                                Math.min(curr + 1, totalPages)
                              )
                            }
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

              {renderModal()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardEmployee;
