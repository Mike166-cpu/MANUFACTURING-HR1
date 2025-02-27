import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Swal from "sweetalert2";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import {
  Search,
  Filter,
  Upload,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

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

const UploadRequirements = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [employeeDepartment, setEmployeeDepartment] = useState("");
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const navigate = useNavigate();

  const LOCAL = "http://localhost:7685";

  useEffect(() => {
    document.title = "Upload Requirements - Employee";
    const authToken = localStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employeeDepartment") || "Unknown";
    const employeeId = localStorage.getItem("employeeId");

    console.log("First Name:", firstName, "Employee Id:", employeeId);
    if (!authToken) {
      Swal.fire({
        title: "Not Logged In",
        text: "You are not logged in. Redirecting to Login Page",
        icon: "warning",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/employeelogin");
      });
    } else {
      setEmployeeFirstName(firstName);
      setEmployeeLastName(lastName);
      setEmployeeDepartment(department);
    }
  }, [navigate]);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState(""); // New state for selected document ID
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  //Upload file to Cloudinary
  const handleUpload = async () => {
    if (!file) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a file first.",
      });
      return;
    }

    setUploading(true);
    Swal.fire({
      title: "Uploading file...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    if (!selectedRequestId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a request first.",
      });
      setUploading(false);
      return;
    }

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "HR1_UPLOADS");
    data.append("cloud_name", "da7oknctx");

    const fileType = file.type.split("/")[0];
    if (fileType !== "image") {
      data.append("resource_type", "raw");
    }

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/da7oknctx/upload", {
        method: "POST",
        body: data,
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          setUploadProgress(Math.round(progress));
        },
      });

      const uploadFile = await res.json();
      setUploadedUrl(uploadFile.secure_url);

      const employeeId = localStorage.getItem("employeeId");

      // Find existing document for this request
      const existingDoc = uploadedDocuments.find(doc => doc.request_id === selectedRequestId);

      if (existingDoc) {
        // Update existing document
        await axios.put(`${LOCAL}/api/uploaded-documents/${existingDoc._id}`, {
          document_url: uploadFile.secure_url,
          request_id: selectedRequestId
        });
      } else {
        // Create new document
        await axios.post(`${LOCAL}/api/document-request/uploaded-documents`, {
          employee_id: employeeId,
          document_url: uploadFile.secure_url,
          request_id: selectedRequestId,
        });
      }

      // Update document request status
      await axios.put(`${LOCAL}/api/document-request/${selectedRequestId}`, {
        status: "Submitted for Approval",
      });

      // Refresh document requests
      const updatedRequests = await axios.get(`${LOCAL}/api/document-request/${employeeId}`);
      setDocumentRequests(updatedRequests.data);
      
      // Refresh uploaded documents
      const updatedUploads = await axios.get(`${LOCAL}/api/uploaded-documents/employee/${employeeId}`);
      setUploadedDocuments(updatedUploads.data);

      setIsModalOpen(false);
      setFile(null);
      Swal.fire({
        icon: "success",
        title: "Upload successful! 🎉",
        showConfirmButton: false,
        timer: 3000,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      Swal.fire({
        icon: "error",
        title: "Upload failed! ❌",
        text: error.message,
        showConfirmButton: false,
        timer: 3000,
      });
    } finally {
      setUploading(false);
    }
  };

  const [documentRequests, setDocumentRequests] = useState([]);

  // Fetch document requests
  useEffect(() => {
    const fetchDocumentRequests = async () => {
      const employeeId = localStorage.getItem("employeeId");

      if (!employeeId) {
        console.error("No employee ID found in local storage");
        return;
      }

      try {
        const response = await axios.get(
          `${LOCAL}/api/document-request/${employeeId}`
        );
        setDocumentRequests(response.data);
        console.log("Document Requests:", response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching document requests:", error);
        setIsLoading(false);
      }
    };

    fetchDocumentRequests();
  }, []);

  // Fetch uploaded documents for the logged-in user
  useEffect(() => {
    const fetchUploadedDocuments = async () => {
      const employeeId = localStorage.getItem("employeeId");

      if (!employeeId) {
        console.error("No employee ID found in local storage");
        return;
      }

      try {
        const response = await axios.get(
          `${LOCAL}/api/uploaded-documents/employee/${employeeId}`
        );
        setUploadedDocuments(response.data);
        console.log("Uploaded Documents:", response.data);
      } catch (error) {
        console.error("Error fetching uploaded documents:", error);
      }
    };

    fetchUploadedDocuments();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Approved":
        return "badge-success";
      case "Rejected":
        return "badge-error";
      case "Submitted for Approval":
        return "badge-info";
      default:
        return "badge-warning";
    }
  };

  const getUploadButtonStatus = (status) => {
    switch (status) {
      case "Approved":
        return { show: false, text: "", disabled: true }; // Removed redundant "Approved" text
      case "Rejected":
        return { show: true, text: "Upload Again", disabled: false };
      case "Submitted for Approval":
        return { show: false, text: "Under Review", disabled: true };
      default:
        return { show: true, text: "Upload", disabled: false };
    }
  };

  // Filter and pagination logic
  const filteredRequests = documentRequests.filter((request) => {
    const matchesStatus =
      filterStatus === "all" || request.status === filterStatus;
    const matchesSearch =
      request.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.request_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  return (
    <div className="min-h-screen bg-base-200">
      <div className="flex flex-col md:flex-row">
        <EmployeeSidebar
          onSidebarToggle={handleSidebarToggle}
          isSidebarOpen={isSidebarOpen}
        />
        <div
          className={`flex-1 transition-all duration-300 ${
            isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
          }`}
        >
          <EmployeeNav
            onSidebarToggle={handleSidebarToggle}
            isSidebarOpen={isSidebarOpen}
          />

          {/* Main Content */}
          <div className="p-6">
            {/* Enhanced Search and Filter Card */}
            <div className="card bg-base-100 shadow-sm mb-6 hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  {/* h1 tag */}
                  <div className="form-control w-full md:flex-1">
                    <div className="flex items-center overflow-hidden">
                      <h1 className="card-title text-2xl font-bold">
                        Upload Document
                      </h1>
                    </div>
                  </div>
                  {/* Search Input */}
                  <div className="form-control w-full md:flex-1">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <span className="btn btn-square btn-ghost h-full">
                        <Search className="w-5 h-5" />
                      </span>
                      <input
                        type="text"
                        placeholder="Search documents..."
                        className="input input-bordered w-full border-none focus:ring-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Filter Dropdown */}
                  <div className="form-control w-full md:w-64">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <span className="btn btn-square btn-ghost h-full">
                        <Filter className="w-5 h-5" />
                      </span>
                      <select
                        className="select select-bordered w-full border-none focus:ring-0"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="all">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Submitted for Approval">
                          Under Review
                        </option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Enhanced Documents Table */}
            <div className="card bg-base-100 shadow-xl overflow-hidden">
              <div className="card-body p-0">
                {isLoading ? (
                  // Skeleton loader
                  <div className="animate-pulse p-4">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-16 bg-base-200 mb-2 rounded"
                      ></div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table table-fixed w-full">
                      <thead>
                        <tr>
                          <th>Request ID</th>
                          <th>Document</th>
                          <th>Requested At</th>
                          <th>Status</th>
                          <th>Actions</th>
                          <th>Uploaded Documents</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((request) => (
                          <tr
                            key={request._id}
                            className="hover:bg-base-200 transition-colors"
                          >
                            <td className="text-xs">{request.request_id}</td>
                            <td className="text-xs font-bold">{request.document_name}</td>
                            <td className="text-xs">
                              {new Date(request.requested_at).toLocaleString()}
                            </td>
                            <td>
                              <div
                                className={`badge ${getStatusBadgeClass(
                                  request.status
                                )} gap-2 transition-all duration-300 hover:scale-105`}
                                title={`Current status: ${request.status}`}
                              >
                                {request.status}
                              </div>
                            </td>
                            <td>
                              {getUploadButtonStatus(request.status).show && (
                                <button
                                  className="btn btn-primary btn-xs gap-2 hover:scale-105 transition-transform"
                                  onClick={() => {
                                    setSelectedRequestId(request.request_id);
                                    setIsModalOpen(true);
                                  }}
                                  title="Upload new document"
                                >
                                  <Upload className="text-xs w-4 h-4" />
                                  {getUploadButtonStatus(request.status).text}
                                </button>
                              )}
                            </td>
                            <td>
                              {uploadedDocuments
                                .filter(
                                  (doc) => doc.request_id === request.request_id
                                )
                                .map((doc) => (
                                  <a
                                    key={doc._id}
                                    href={doc.document_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-ghost btn-sm gap-2"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    View
                                  </a>
                                ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center p-4 bg-base-200">
                    <div className="join">
                      <button
                        className="join-item btn btn-sm"
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {[...Array(totalPages)].map((_, index) => (
                        <button
                          key={index + 1}
                          className={`join-item btn btn-sm ${
                            currentPage === index + 1 ? "btn-active" : ""
                          }`}
                          onClick={() => paginate(index + 1)}
                        >
                          {index + 1}
                        </button>
                      ))}
                      <button
                        className="join-item btn btn-sm"
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Upload Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Document
            </h3>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                file
                  ? "border-primary bg-primary/5"
                  : "border-base-300 hover:border-primary"
              }`}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <div className="w-full max-w-xs mx-auto">
                    <progress
                      className="progress progress-primary w-full"
                      value={uploadProgress}
                      max="100"
                    ></progress>
                    <p className="text-sm mt-2">{uploadProgress}% uploaded</p>
                  </div>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="badge badge-primary text-lg p-4">
                    {file.name}
                  </div>
                  <p className="text-sm text-base-content/70">
                    Click or drag to change file
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-12 h-12 text-base-content/50" />
                  <div>
                    <p className="font-medium">
                      Drop your file here, or click to browse
                    </p>
                    <p className="text-sm text-base-content/70 mt-1">
                      Supports images, PDFs, and documents
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-action gap-2">
              <button
                className="btn btn-ghost hover:bg-base-200"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className={`btn btn-primary ${uploading ? "loading" : ""}`}
                onClick={handleUpload}
                disabled={uploading || !file}
              >
                {uploading ? "Uploading..." : "Upload Document"}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop bg-base-200/80"
            onClick={() => !uploading && setIsModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export default UploadRequirements;
