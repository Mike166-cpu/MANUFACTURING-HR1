// RESIGNATION FORM

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Swal from "sweetalert2";
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

const ResignationForm = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const navigate = useNavigate();
  const employeeId = localStorage.getItem("employeeId");
  const [formDisabled, setFormDisabled] = useState(false);

  const LOCAL = "http://localhost:7685";
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";

  const resignationReasons = [
    "Career Growth",
    "Health Issues",
    "Relocation",
    "Work-Life Balance",
    "Higher Studies",
    "Job Dissatisfaction",
    "Other",
  ];

  const [formData, setFormData] = useState({
    employeeName: "",
    employeeId: "",
    department: "",
    lastWorkingDay: "",
    reason: "",
    message: "",
  });

  useEffect(() => {
    document.title = "Resignation Form - HRMS";
    const authToken = localStorage.getItem("employeeToken");

    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const employeeId = localStorage.getItem("employeeId") || "";
    const department = localStorage.getItem("employeeDepartment") || "Unknown";
    console.log(employeeId, department);

    setFormData({
      employeeName: `${firstName} ${lastName}`,
      employeeId,
      department,
      lastWorkingDay: "",
      reason: "",
      message: "",
    });
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  
  // SUBMIT REQUEST
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Fetch existing resignations for the logged-in employee
    try {
      const response = await fetch(
        `${APIBASED_URL}/api/resignation/employee/${formData.employeeId}`
      );
      const data = await response.json();

      if (data.pending) {
        Swal.fire({
          title: "Submission Not Allowed",
          text: "You already have a pending resignation request. Please wait for approval or rejection.",
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      }
    } catch (error) {
      console.error("Error checking existing resignation:", error);
    }

    // Proceed with submission logic
    let resignationData = { ...formData };

    if (formData.reason === "Other" && !formData.otherReason) {
      Swal.fire({
        title: "Specify Reason",
        text: "Please provide a reason for resignation.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    resignationData.reason = formData.otherReason || formData.reason;
    delete resignationData.otherReason;

    // Confirm submission
    const confirmSubmission = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to submit your resignation request?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Submit",
      cancelButtonText: "Cancel",
    });

    if (!confirmSubmission.isConfirmed) return;

    // Submit resignation request
    try {
      const submitResponse = await fetch(
        `${APIBASED_URL}/api/resignation/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!submitResponse.ok)
        throw new Error("Failed to submit resignation request.");

      Swal.fire({
        title: "Resignation Submitted",
        text: "Your resignation request has been submitted successfully.",
        icon: "success",
        confirmButtonText: "OK",
      });

      setFormDisabled(true);
    } catch (error) {
      Swal.fire({
        title: "Submission Failed",
        text: "There was an issue submitting your resignation request. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      });
      console.error("Error submitting resignation:", error);
    }
  };

  //FETCH STATUS OF RESIGNATION
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `${APIBASED_URL}/api/resignation/status/${employeeId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch resignation status");
        }

        setStatus(data.status);
      } catch (error) {
        console.error("Error fetching resignation status:", error);
        setStatus("Error fetching status");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [employeeId]);

  return (
    <div className="flex">
      <EmployeeSidebar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
        } relative`}
      >
        <EmployeeNav
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {isSidebarOpen && isMobileView && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-10"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <div className="border-b-2 p-4">
          <Breadcrumbs />
          <div className="px-4 flex justify-between items-center">
            <span className="text-xl font-bold">Resignation Request</span>
            <div className="flex items-center gap-3">
              <span className="text-gray-700 font-medium">Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  status === "Pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : status === "Approved"
                    ? "bg-green-100 text-green-800"
                    : status === "Rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {status || "No Request"}
              </span>
            </div>
          </div>
        </div>

        <div className="transition-all bg-gray-100 duration-300 ease-in-out flex-grow p-5">
          <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Employee Information Card */}
            <div className="p-6 bg-white shadow-lg rounded-xl border border-gray-100">
              <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                <span className="bg-blue-100 text-blue-800 p-2 rounded-lg mr-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </span>
                Employee Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium dark:text-white">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
                    disabled
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium dark:text-white">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
                    required
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium dark:text-white">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium dark:text-white">
                    Last Working Day
                  </label>
                  <input
                    type="date"
                    name="lastWorkingDay"
                    value={formData.lastWorkingDay}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Resignation Details Card */}
            <div className="p-6 bg-white shadow-lg rounded-xl border border-gray-100">
              <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                <span className="bg-purple-100 text-purple-800 p-2 rounded-lg mr-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </span>
                Resignation Details
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium dark:text-white">
                      Reason for Resignation
                    </label>
                    <select
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select a reason</option>
                      {resignationReasons.map((reason, index) => (
                        <option key={index} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formData.reason === "Other" && (
                    <div>
                      <label className="block text-sm font-medium dark:text-white">
                        Please Specify
                      </label>
                      <input
                        type="text"
                        name="otherReason"
                        value={formData.otherReason || ""}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium dark:text-white">
                      Additional Message (Optional)
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
                    ></textarea>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className={`px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      formDisabled
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg"
                    }`}
                    disabled={formDisabled}
                  >
                    <span>Submit Resignation</span>
                    {!formDisabled && (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResignationForm;
