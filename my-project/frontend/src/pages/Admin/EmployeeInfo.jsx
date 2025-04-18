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
      const response = await axios.get(
        `${LOCAL}/api/login-admin/employee-data`
      );
      console.log("LOGIN ", response.data);
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Email Field */}
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-base-content/70">
                        Email
                      </label>
                      <div
                        className="hover:blur-none transition-all duration-300 cursor-pointer tooltip tooltip-primary text-left"
                        data-tip="Click to view"
                      >
                        <span className="text-base font-medium text-gray-900">
                          {selectedEmployee.email}
                        </span>
                      </div>
                    </div>

                    {/* Department Field */}
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-base-content/70">
                        Department
                      </label>
                      <span className="text-base font-medium text-gray-900">
                        {selectedEmployee.department}
                      </span>
                    </div>

                    {/* Experience Field */}
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-base-content/70">
                        Experience
                      </label>
                      <span className="text-base font-medium text-gray-900">
                        {selectedEmployee.experience}
                      </span>
                    </div>

                    {/* Education Field */}
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-base-content/70">
                        Education
                      </label>
                      <span className="text-base font-medium text-gray-900">
                        {selectedEmployee.education}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-base-content/70">
                        Gender
                      </label>
                      <span className="text-base font-medium text-gray-900">
                        {selectedEmployee.gender}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-base-content/70">
                        Employee Status
                      </label>
                      <span className="text-base font-medium text-gray-900">
                        {selectedEmployee.status}
                      </span>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Skills Field */}
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-base-content/70">
                        Skills
                      </label>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {selectedEmployee.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="badge badge-secondary badge-outline text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Nationality Field */}
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-base-content/70">
                        Nationality
                      </label>
                      <div
                        className="hover:blur-none transition-all duration-300 cursor-pointer tooltip tooltip-primary text-left"
                        data-tip="Click to view"
                      >
                        <span className="text-base font-medium text-gray-900">
                          {selectedEmployee.nationality}
                        </span>
                      </div>
                    </div>

                    {/* Civil Status Field */}
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-base-content/70">
                        Civil Status
                      </label>
                      <div
                        className="hover:blur-none transition-all duration-300 cursor-pointer tooltip tooltip-primary text-left"
                        data-tip="Click to view"
                      >
                        <span className="text-base font-medium text-gray-900">
                          {selectedEmployee.civilStatus}
                        </span>
                      </div>
                    </div>

                    {/* POSITION */}
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-base-content/70">
                        Position
                      </label>
                      <div
                        className="hover:blur-none transition-all duration-300 cursor-pointer tooltip tooltip-primary text-left"
                        data-tip="Click to view"
                      >
                        <span className="text-base font-medium text-gray-900">
                          {selectedEmployee.position}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-base-content/70">
                        Hired Date
                      </label>
                      <div
                        className="hover:blur-none transition-all duration-300 cursor-pointer tooltip tooltip-primary text-left"
                        data-tip="Click to view"
                      >
                        <span className="text-base font-medium text-gray-900">
                          {new Date(
                            selectedEmployee.createdAt
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divider"></div>

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
                        <div className="space-y-4">
                          {selectedEmployee.documents.map((doc, index) => {
                            const isPdf = doc.url.endsWith(".pdf");

                            return (
                              <div
                                key={index}
                                className="blur-sm hover:blur-none transition-all duration-300 cursor-help"
                                data-tip="Hover to view"
                              >
                                {isPdf ? (
                                  <embed
                                    src={doc.url}
                                    type="application/pdf"
                                    width="100%"
                                    height="600px"
                                    className="border-none rounded-lg"
                                  />
                                ) : (
                                  <img
                                    src={doc.url}
                                    alt={doc.name}
                                    className="w-full h-auto max-h-[600px] object-contain rounded-lg"
                                  />
                                )}
                              </div>
                            );
                          })}
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
                    <table className="table w-full">
                      <thead>
                        <tr>
                          <th className="bg-base-200">Employee ID</th>
                          <th className="bg-base-200">Full Name</th>
                          <th className="bg-base-200">Email</th>
                          <th className="bg-base-200">Department</th>
                          <th className="bg-base-200">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.map((employee) => (
                          <tr key={employee._id} className="hover">
                            <td className="font-medium">
                              {employee.employeeId}
                            </td>
                            <td className="font-medium">{employee.fullname}</td>
                            <td>{employee.email}</td>
                            <td>
                              <div className="badge badge-ghost">
                                {employee.department}
                              </div>
                            </td>

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
