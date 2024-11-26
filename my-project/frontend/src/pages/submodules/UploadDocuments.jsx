import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import {
  FaFilePdf,
  FaFileImage,
  FaFileWord,
  FaCloudUploadAlt,
} from "react-icons/fa";
import axios from "axios";

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

const UploadDocuments = () => {
  useEffect(() => {
    document.title = "Upload Documents";
  });

  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [employeeDepartment, setEmployeeDepartment] = useState("");
  const [employeeid, setEmployeeId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [isModalOpen, setModalOpen] = useState(false);
  const [file, setFile] = useState(null);

  const openModal = (file) => {
    setFile(file);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  useEffect(() => {
    const authToken = sessionStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employee_department") || "Unknown";
    const employeeid = localStorage.getItem("employeeId");

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
      setEmployeeId(employeeid);
      setEmployeeFirstName(firstName);
      setEmployeeLastName(lastName);
      setEmployeeDepartment(department);
    }
  }, [navigate]);

  const handleSidebarToggle = () => {
    setIsSidebarOpen((prev) => !prev);
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

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setDocuments(files);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setDocuments(files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:5000";

  const handleUpload = async () => {
    if (documents.length === 0) {
      Swal.fire({
        title: "No Documents Selected",
        text: "Please select documents to upload",
        icon: "error",
      });
      return;
    }

    const formData = new FormData();
    documents.forEach((document) => {
      formData.append("documents", document);
    });

    formData.append("employeeId", employeeid);
    formData.append("employeeFirstName", employeeFirstName);

    try {
      const response = await axios.post(`${APIBase_URL}/api/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      Swal.fire({
        title: "Upload Successful",
        text: "Your documents have been uploaded successfully!",
        icon: "success",
      });
      setDocuments([]); // Clear documents after upload
    } catch (error) {
      console.error("Error uploading files:", error);
      Swal.fire({
        title: "Upload Failed",
        text: "An error occurred while uploading your documents. Please try again.",
        icon: "error",
      });
    }
  };

  // Function to get the correct icon based on file type
  const getFileIcon = (fileName) => {
    const fileExtension = fileName.split(".").pop().toLowerCase();

    switch (fileExtension) {
      case "pdf":
        return <FaFilePdf color="red" />;
      case "jpg":
      case "jpeg":
      case "png":
        return <FaFileImage color="green" />;
      case "doc":
      case "docx":
        return <FaFileWord color="blue" />;
      default:
        return <FaCloudUploadAlt color="gray" />;
    }
  };

  useEffect(() => {
    const fetchUploadedFiles = async () => {
      try {
        const employeeId = localStorage.getItem("employeeId");

        if (!employeeId) {
          setError("User not logged in.");
          return;
        }

        const response = await axios.get(
          `${APIBase_URL}/api/documents?employeeId=${employeeId}`
        );
        setUploadedFiles(response.data);
      } catch (error) {
        console.error("Error fetching uploaded files:", error);
        setError("Error fetching uploaded files");
      }
    };

    fetchUploadedFiles();
  }, []);
  return (
    <div className="flex">
      <EmployeeSidebar
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
        } relative`}
      >
        <EmployeeNav
          onSidebarToggle={handleSidebarToggle}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Mobile overlay */}
        {isSidebarOpen && isMobileView && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-10"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* MAIN CONTENT */}
        <div className="min-h-screen px-4 py-8 ">
          <div className="min-w-screen mx-auto bg-white p-8 rounded-2xl border">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
              Upload Required Documents
            </h2>
            <p className="text-lg text-gray-600 mb-8 text-center">
              Please upload the documents listed below to complete your
              onboarding process.
            </p>

            {/* File Upload Area */}
            <div
              className="border-2 border-dashed border-gray-300 p-8 rounded-xl shadow-lg flex flex-col items-center justify-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <FaCloudUploadAlt size={48} color="#4A90E2" className="mb-4" />
              <p className="text-center text-gray-600 mb-4">
                Drag & Drop or Browse to Upload
              </p>

              {/* File Upload Input with Label */}
              <div className="w-full max-w-xs mb-6">
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="p-2 border border-gray-300 rounded-lg shadow-md w-full max-w-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
                />
              </div>

              {/* Display Document Icons and Names */}
              {documents.length > 0 && (
                <div className="w-full mb-4">
                  <ul className="list-disc pl-5 text-gray-700">
                    {documents.map((doc, index) => (
                      <li
                        key={index}
                        className="mb-2 flex items-center space-x-3"
                      >
                        <span>{getFileIcon(doc.name)}</span>
                        <span>
                          {doc.name} ({(doc.size / 1024).toFixed(2)} KB)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Uploading Status or Button */}
              {uploading ? (
                <div className="w-full mt-6">
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
                  </div>
                  <p className="mt-2 text-center text-gray-600">Uploading...</p>
                </div>
              ) : (
                <button
                  onClick={handleUpload}
                  className="mt-6 py-3 px-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 ease-in-out"
                >
                  Upload Documents
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 py-8">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
            Uploaded Documents
          </h2>
          <div className="flex flex-col items-center">
            {uploadedFiles.length > 0 ? (
              <ul className="space-y-4">
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <span>{file.name}</span>
                    <button
                      className="text-blue-500"
                      onClick={() => openModal(file)}
                    >
                      View Document
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No documents uploaded yet.</p>
            )}
          </div>
        </div>

        {isModalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content">
              <h2 className="modal-title">{file.filename}</h2>
              <img
                src={`${APIBase_URL}/uploads/${file.filename}`}
                alt="Document"
                className="modal-image"
              />
              <button className="close-button" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        )}
        {/* END OF MAIN CONTENT */}
      </div>
    </div>
  );
};

export default UploadDocuments;
