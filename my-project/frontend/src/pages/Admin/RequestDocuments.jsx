import React, { useEffect, useState } from "react";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import BreadCrumbs from "../../Components/BreadCrumb";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiCheck, FiX } from "react-icons/fi"; // Remove FiEye icon
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";

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

const RequestDocuments = () => {
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [documentName, setDocumentName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal State
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadedDocuments, setUploadedDocuments] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedDocuments, setSelectedDocuments] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  useEffect(() => {
    document.title = "Request Document - Admin";

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
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          `${APIBASED_URL}/api/employeeData/employees `
        );
        console.log("Employee data:", response.data);

        setEmployees(response.data || []);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    const fetchDocumentRequests = async () => {
      try {
        const response = await axios.get(
          `${APIBASED_URL}/api/document-request`
        );
        setDocumentRequests(response.data);
      } catch (error) {
        console.error("Error fetching document requests:", error);
      }
    };

    fetchEmployees();
    fetchDocumentRequests();
  }, []);

  const handleRequest = async (e) => {
    e.preventDefault();

    if (!selectedEmployee || !documentName) {
      toast.error("Please complete all fields.");
      return;
    }

    try {
      const employee = employees.find(
        (emp) => emp.employeeId === selectedEmployee
      );
      if (!employee) {
        toast.error("Invalid employee selection");
        return;
      }

      const payload = {
        employeeId: selectedEmployee,
        document_name: documentName,
      };
      console.log("Sending request:", payload);

      const response = await axios.post(
        `${APIBASED_URL}/api/document-request`,
        payload
      );
      console.log("Response:", response.data);

      toast.success("Request submitted successfully!");
      setDocumentName("");
      setSelectedEmployee("");
      setIsModalOpen(false);

      // Refresh document requests
      const refreshResponse = await axios.get(
        `${APIBASED_URL}/api/document-request`
      );
      setDocumentRequests(refreshResponse.data);
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error(error.response?.data?.message || "Failed to submit request.");
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      await axios.put(`${APIBASED_URL}/api/document-request/${requestId}`, {
        status: newStatus,
      });

      toast.success(`Request ${newStatus.toLowerCase()} successfully!`);

      // Refresh the document LOCA
      const response = await axios.get(`${APIBASED_URL}/api/document-request`);
      setDocumentRequests(response.data);
    } catch (error) {
      console.error("Error updating request status:", error);
      toast.error("Failed to update request status.");
    }
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      await axios.delete(`${APIBASED_URL}/api/document-request/${requestId}`);
      toast.success("Request deleted successfully!");

      // Refresh the document requests
      const response = await axios.get(`${APIBASED_URL}/api/document-request`);
      setDocumentRequests(response.data);
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error("Failed to delete request.");
    }
  };

  const filteredRequests = documentRequests
    .filter((request) => {
      if (filterStatus === "all") return true;
      return request.status === filterStatus;
    })
    .filter((request) => {
      const employee = employees.find(
        (emp) => emp.employeeId === request.employeeId
      );
      const searchString = `${employee?.fullname || ""} ${
        request.document_name
      }`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fetch uploaded documents for a specific request
  const fetchUploadedDocuments = async (requestId) => {
    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/uploaded-documents/request/${requestId}`
      );
      if (response.data && response.data.documents) {
        setSelectedDocuments(response.data.documents);
        setIsViewModalOpen(true);
      } else {
        toast.info("No documents uploaded yet");
      }
    } catch (error) {
      console.error("Error fetching uploaded documents:", error);
      toast.error("Failed to fetch documents");
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  //checkbox
  const [selectedRows, setSelectedRows] = useState([]);

  const handleRowSelection = (id) => {
    setSelectedRows(
      (prevSelected) =>
        prevSelected.includes(id)
          ? prevSelected.filter((rowId) => rowId !== id) // Unselect if already selected
          : [...prevSelected, id] // Add if not selected
    );
  };

  return (
    <div className="min-h-screen bg-base-200">
      <ToastContainer />
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div
          className={`flex-1 transition-all duration-300 ${
            isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
          }`}
        >
          <Navbar toggleSidebar={toggleSidebar} />

          {/* BREADCRUMBS */}
          <div className="bg-white pb-4 px-5">
            <BreadCrumbs />
            <span className="px-4 font-bold text-2xl">
              {" "}
              Send Document Request
            </span>
          </div>

          <div className="p-4 md:p-8">
            {/* Combined Header and Filters Card */}

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <div className="form-control w-full md:w-64">
                  <input
                    type="text"
                    placeholder="Search requests..."
                    className="input input-bordered w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="select select-bordered w-full md:w-48"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="Submitted for Approval">
                    Pending Approval
                  </option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn btn-primary w-full md:w-auto"
                >
                  Send New Request
                </button>
              </div>
            </div>

            {/* Request Table Card */}
            <div className="card bg-base-100 shadow-sm overflow-x-auto">
              <div className="card-body p-0">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>{""}</th>
                      <th>Request ID</th>
                      <th className="hidden md:table-cell">Requsted To</th>
                      <th>Document Type</th>
                      <th>Status</th>
                      <th className="hidden md:table-cell">Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((request) => {
                        const employee = employees.find(
                          (emp) => emp.employeeId === request.employeeId
                        );
                        const isSelected = selectedRows.includes(request._id);
                        return (
                          <tr
                            key={request._id}
                            className={isSelected ? "bg-blue-100" : ""}
                          >
                            <td>
                              <input
                                type="checkbox"
                                onChange={() => handleRowSelection(request._id)}
                                checked={isSelected}
                              />
                            </td>
                            <td className="font-mono text-sm">
                              {request.request_id}
                            </td>
                            <td className="font-medium capitalize">
                              {request.employeeName}
                            </td>
                            <td className="font-medium capitalize">
                              {request.document_name}
                            </td>
                            <td>
                              <div
                                className={`badge ${getStatusBadgeClass(
                                  request.status
                                )} gap-2`}
                              >
                                {request.status}
                              </div>
                            </td>
                            <td className="hidden md:table-cell">
                              {new Date(
                                request.requested_at
                              ).toLocaleDateString()}
                            </td>
                            <td>
                              <div className="flex gap-2">
                                {request.status ===
                                  "Submitted for Approval" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleStatusUpdate(
                                          request.request_id,
                                          "Approved"
                                        )
                                      }
                                      className="btn btn-success btn-xs"
                                    >
                                      <FiCheck />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusUpdate(
                                          request.request_id,
                                          "Rejected"
                                        )
                                      }
                                      className="btn btn-error btn-xs"
                                    >
                                      <FiX />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() =>
                                    fetchUploadedDocuments(request.request_id)
                                  }
                                  className="btn btn-info btn-xs"
                                >
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <div className="flex flex-col items-center text-gray-500">
                            <HiOutlineClipboardDocumentList className="w-28 h-28 opacity-50" />
                            <span>No document requests found</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="flex justify-between items-center p-4">
                  <span className="text-gray-600 text-sm">
                    Showing{" "}
                    {Math.min(
                      (currentPage - 1) * itemsPerPage + 1,
                      filteredRequests.length
                    )}{" "}
                    to{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredRequests.length
                    )}{" "}
                    of {filteredRequests.length} entries
                  </span>

                  {/* */}
                  <div className="join">
                    {Array.from(
                      {
                        length: Math.ceil(
                          filteredRequests.length / itemsPerPage
                        ),
                      },
                      (_, index) => (
                        <button
                          key={index}
                          className={`join-item btn btn-sm ${
                            currentPage === index + 1 ? "btn-active" : ""
                          }`}
                          onClick={() => paginate(index + 1)}
                        >
                          {index + 1}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal */}
          {isModalOpen && (
            <dialog className="modal modal-open">
              <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">Request Document</h3>
                <form onSubmit={handleRequest} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Select Employee</span>
                    </label>
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="select select-bordered w-full"
                    >
                      <option value="">Select Employee</option>
                      {employees && employees.length > 0 ? (
                        employees.map((employee) => (
                          <option
                            key={employee.employeeId}
                            value={employee.employeeId}
                          >
                            {employee.employeeId} - {employee.fullname}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          Loading employees...
                        </option>
                      )}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Document Name</span>
                    </label>
                    <input
                      type="text"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      placeholder="Enter document name"
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div className="modal-action">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Submit Request
                    </button>
                  </div>
                </form>
              </div>
              <form method="dialog" className="modal-backdrop">
                <button onClick={() => setIsModalOpen(false)}>close</button>
              </form>
            </dialog>
          )}

          {/* Document Viewer Modal */}
          {isViewModalOpen && (
            <dialog className="modal modal-open">
              <div className="modal-box w-11/12 max-w-4xl">
                <h3 className="font-bold text-lg mb-4">Uploaded Documents</h3>

                <div className="overflow-y-auto max-h-96">
                  {selectedDocuments && selectedDocuments.length > 0 ? (
                    <div className="grid gap-4">
                      {selectedDocuments.map((doc, index) => (
                        <div key={index} className="card bg-base-200">
                          <div className="card-body">
                            <h4 className="card-title text-sm">
                              Document {index + 1}
                            </h4>
                            {doc.document_url && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                  Uploaded:{" "}
                                  {new Date(doc.uploaded_at).toLocaleString()}
                                </span>
                                <a
                                  href={doc.document_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-primary btn-sm"
                                >
                                  View Document
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4">No documents available</p>
                  )}
                </div>

                <div className="modal-action">
                  <button
                    className="btn"
                    onClick={() => setIsViewModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
              <form method="dialog" className="modal-backdrop">
                <button onClick={() => setIsViewModalOpen(false)}>close</button>
              </form>
            </dialog>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDocuments;
