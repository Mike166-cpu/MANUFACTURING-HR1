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

const UploadRequirements = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [employeeDepartment, setEmployeeDepartment] = useState("");
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const navigate = useNavigate();
  const employee_id = localStorage.getItem("employeeId");

  const LOCAL = "http://localhost:7685";
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";

  useEffect(() => {
    document.title = "Upload Requirements - Employee";
    const authToken = localStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employeeDepartment") || "Unknown";
    const employeeId = localStorage.getItem("employeeId");

    setEmployeeFirstName(firstName);
    setEmployeeLastName(lastName);
    setEmployeeDepartment(department);
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
    if (!file || !selectedRequestId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select both a file and a request.",
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

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "HR1_UPLOADS");
    data.append("cloud_name", "da7oknctx");

    // Handle different file types
    const fileExtension = file.name.split(".").pop().toLowerCase();
    const documentTypes = ["pdf", "doc", "docx", "txt", "rtf"];

    // If file is a document type, set resource_type to 'raw'
    if (documentTypes.includes(fileExtension)) {
      data.append("resource_type", "raw");
    } else if (file.type.startsWith("image/")) {
      data.append("resource_type", "image");
    } else {
      data.append("resource_type", "raw");
    }

    try {
      // Use auto upload endpoint for automatic type detection
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/da7oknctx/auto/upload",
        {
          method: "POST",
          body: data,
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setUploadProgress(Math.round(progress));
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Upload failed with status: ${res.status}`);
      }

      const uploadFile = await res.json();

      if (!uploadFile.secure_url) {
        throw new Error("No secure URL received from Cloudinary");
      }

      const employeeId = localStorage.getItem("employeeId");
      const currentRequest = documentRequests.find(
        (req) => req.request_id === selectedRequestId
      );

      if (currentRequest.status === "Rejected") {
        const existingDoc = uploadedDocuments.find(
          (doc) => doc.request_id === selectedRequestId
        );
        if (existingDoc) {
          await axios.put(
            `${APIBASED_URL}/api/uploaded-documents/${existingDoc._id}`,
            {
              document_url: uploadFile.secure_url,
              request_id: selectedRequestId,
            }
          );
        } else {
          await axios.post(`${APIBASED_URL}/api/document-request/uploaded-documents`, {
            employeeId: employeeId,
            document_url: uploadFile.secure_url,
            request_id: selectedRequestId,
          });
        }
      } else {
        await axios.post(`${APIBASED_URL}/api/document-request/uploaded-documents`, {
          employeeId: employeeId, // Changed from employeeid to employeeId
          document_url: uploadFile.secure_url,
          request_id: selectedRequestId,
        });
      }

      // Update request status to "Submitted for Approval"
      await axios.put(`${APIBASED_URL}/api/document-request/${selectedRequestId}`, {
        status: "Submitted for Approval",
      });

      // Refresh data
      const [updatedRequests, updatedUploads] = await Promise.all([
        axios.get(`${APIBASED_URL}/api/document-request/${employeeId}`),
        axios.get(`${APIBASED_URL}/api/uploaded-documents/employee/${employeeId}`),
      ]);

      setDocumentRequests(updatedRequests.data);
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
        text: error.message || "Failed to upload file",
        showConfirmButton: true,
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
          `${APIBASED_URL}/api/document-request/${employeeId}`
        );
        setDocumentRequests(response.data);

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
          `${APIBASED_URL}/api/uploaded-documents/employee/${employeeId}`
        );
        setUploadedDocuments(response.data);
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
        return { show: false, text: "", disabled: true };
      case "Rejected":
      case "Submitted for Approval": // Allow upload even when under review
      case "Pending":
        return { show: true, text: "Upload", disabled: false };
      default:
        return { show: true, text: "Upload", disabled: false };
    }
  };

  // Filter and pagination logic
  const filteredRequests = documentRequests.filter((request) => {
    const matchesStatus =
      filterStatus.toLowerCase() === "all" || request.status === filterStatus;
    const matchesSearch =
      request.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.request_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10; // Change this as needed
  //pagitnation
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRequests.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(filteredRequests.length / recordsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  //Month filtering
  const [filter, setFilter] = useState("all");

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const filteredMonths = currentRecords.filter((request) => {
    const requestedDate = new Date(request.requested_at);

    if (filter === "last1month") {
      return requestedDate >= oneMonthAgo;
    } else if (filter === "last2month") {
      return requestedDate >= twoMonthsAgo;
    } else if (filter === "last3months") {
      return requestedDate >= threeMonthsAgo;
    }
    return true;
  });

  //checkbox function
  const [selectedRows, setSelectedRows] = useState([]);
  const toggleRowSelection = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="flex flex-col md:flex-row">
        <EmployeeSidebar
          onSidebarToggle={handleSidebarToggle}
          isSidebarOpen={isSidebarOpen}
        />
        <div
          className={`flex-1 transition-all duration ${
            isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
          }`}
        >
          <EmployeeNav
            onSidebarToggle={handleSidebarToggle}
            isSidebarOpen={isSidebarOpen}
          />

          <div className="p-5 font-bold text-2xl bg-white border-t">
            <Breadcrumbs />
            <h1 className="px-3">Upload Your Requirements</h1>
          </div>

          {/* Main Content */}
          <div className="p-6 bg-slate-100">
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto py-4">
              <div className="relative">
                <select
                  className="select select-bordered"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="realtive">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="select select-bordered"
                >
                  <option value="all">Filter Month</option>
                  <option value="last1month">Last 1 Month</option>
                  <option value="last3months">Last 2 Months</option>
                  <option value="last3months">Last 3 Months</option>
                </select>
              </div>
            </div>

            <div className=" bg-white rounded-lg overflow-hidden">
              <div>
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
                    <table className="table w-full rounded-none">
                      <thead>
                        <tr className="text-sm border-b-2 border-gray-100">
                          <th>{""}</th>
                          <th>Request ID</th>
                          <th>Document</th>
                          <th>Requested At</th>
                          <th>Status</th>
                          <th>Actions</th>
                          <th>Uploaded Documents</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentRecords.map((request) => (
                          <tr
                            key={request._id}
                            className={`hover:bg-base-200 transition-colors ${
                              selectedRows.includes(request._id)
                                ? "bg-gray-300"
                                : ""
                            }`}
                          >
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedRows.includes(request._id)}
                                onChange={() => toggleRowSelection(request._id)}
                              />
                            </td>
                            <td className="text-xs">{request.request_id}</td>
                            <td className="text-xs font-bold">
                              {request.document_name}
                            </td>
                            <td className="text-xs">
                              {new Date(
                                request.requested_at
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
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
              </div>
              <div className="flex justify-between items-center p-4 border-t bg-white">
                <div>
                  <span className="text-sm text-gray-600">
                    Showing entries {indexOfFirstRecord + 1} -{" "}
                    {Math.min(indexOfLastRecord, filteredRequests.length)} of{" "}
                    {filteredRequests.length}
                  </span>
                </div>
                <div className="join">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={index + 1}
                      className={`join-item btn py-2 ${
                        currentPage === index + 1 ? "btn-active" : ""
                      }`}
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
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
