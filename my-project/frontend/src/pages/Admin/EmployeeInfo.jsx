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

  const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";
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

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${LOCAL}/api/onboarding/employee`);
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
      const response = await axios.get(`${LOCAL}/api/login-admin/employee-data`);
      console.log("LOGIN ",response.data);
    } catch (error) {
      console.error("Error fetching login data:", error);
    }
  };

  useEffect(() => {
    fetchLoginData();
  }, []);

  return (
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-primary mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="text-2xl font-bold text-primary">
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
                  <h2 className="card-title text-xl font-bold flex items-center">
                    <div className="avatar placeholder mr-3">
                      <div className="bg-primary text-white rounded-full w-12">
                        <span className="text-xl">
                          {selectedEmployee.fullname.charAt(0)}
                        </span>
                      </div>
                    </div>
                    {selectedEmployee.fullname}
                  </h2>
                  <button
                    className="btn btn-sm btn-circle btn-ghost"
                    onClick={() => setSelectedEmployee(null)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="divider"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-base-content/70">
                        Email
                      </label>
                      <div
                        className="blur-sm hover:blur-none transition-all duration-300 cursor-help tooltip tooltip-primary"
                        data-tip="Hover to view"
                      >
                        <span className="text-base font-medium">
                          {selectedEmployee.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-base-content/70">
                        Department
                      </label>
                      <span className="text-base font-medium">
                        {selectedEmployee.department}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-base-content/70">
                        Experience
                      </label>
                      <span className="text-base font-medium">
                        {selectedEmployee.experience}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-base-content/70">
                        Education
                      </label>
                      <span className="text-base font-medium">
                        {selectedEmployee.education}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-base-content/70">
                        Skills
                      </label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedEmployee.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="badge badge-secondary badge-outline"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-base-content/70">
                        Nationality
                      </label>
                      <div
                        className="blur-sm hover:blur-none transition-all duration-300 cursor-help tooltip tooltip-primary"
                        data-tip="Hover to view"
                      >
                        <span className="text-base font-medium">
                          {selectedEmployee.nationality}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-base-content/70">
                        Civil Status
                      </label>
                      <div
                        className="blur-sm hover:blur-none transition-all duration-300 cursor-help tooltip tooltip-primary"
                        data-tip="Hover to view"
                      >
                        <span className="text-base font-medium">
                          {selectedEmployee.civilStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divider"></div>
                {/* 
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-base-content/70">
                    Documents
                  </span>
                  <div className="mt-2 space-y-4">
                    {selectedEmployee.documents && selectedEmployee.documents.length > 0 ? (
                      selectedEmployee.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-primary"
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
                            <div className="flex flex-col">
                              <span className="font-medium">{doc.name}</span>
                              <span className="text-sm text-base-content/70">
                                Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="blur-sm hover:blur-none transition-all duration-300 cursor-help tooltip tooltip-primary"
                              data-tip="Hover to view"
                            >
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary btn-sm"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                                  />
                                </svg>
                                View Document
                              </a>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="alert alert-info">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>No documents available</span>
                      </div>
                    )}
                  </div>
                </div> */}

                {selectedEmployee.documents &&
                  selectedEmployee.documents.some((doc) =>
                    doc.url.endsWith(".pdf")
                  ) && (
                    <div className="mt-4">
                      <div className="bg-base-200 rounded-lg p-4 border border-base-300">
                        <div className="flex items-center mb-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-primary mr-2"
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
                          <span className="font-medium">Document Preview</span>
                        </div>
                        <div
                          className="blur-sm hover:blur-none transition-all duration-300 cursor-help"
                          data-tip="Hover to view"
                        >
                          <embed
                            src={
                              selectedEmployee.documents.find((doc) =>
                                doc.url.endsWith(".pdf")
                              )?.url
                            }
                            type="application/pdf"
                            width="100%"
                            height="600px"
                            className="border-none rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                <div className="card-actions justify-end mt-4">
                  <button
                    className="btn btn-outline"
                    onClick={() => setSelectedEmployee(null)}
                  >
                    Back to List
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <h2 className="card-title text-xl font-bold">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-primary mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Employee List
                  </h2>
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
                        <button className="btn btn-square">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </button>
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
                  <div className="alert alert-info">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>No employees found matching your search.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th className="bg-base-200">Full Name</th>
                          <th className="bg-base-200">Email</th>
                          <th className="bg-base-200">Department</th>
                          <th className="bg-base-200">Experience</th>
                          <th className="bg-base-200">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.map((employee) => (
                          <tr key={employee._id} className="hover">
                            <td className="font-medium">{employee.fullname}</td>
                            <td>{employee.email}</td>
                            <td>
                              <div className="badge badge-ghost">
                                {employee.department}
                              </div>
                            </td>
                            <td>{employee.experience}</td>
                            <td>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setSelectedEmployee(employee)}
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeInfo;
