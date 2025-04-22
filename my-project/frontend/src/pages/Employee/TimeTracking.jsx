import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Swal from "sweetalert2";
import Breadcrumb from "../../Components/BreadCrumb";
import Calendar from "react-calendar";
import axios from "axios";
import { formatDuration, calculateDuration } from "../../utils/timeUtils";
import Breadcrumbs from "../../Components/BreadCrumb";
import { FaPlus } from "react-icons/fa6";
import * as faceapi from "face-api.js";
import Webcam from "react-webcam";

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

const TimeTracking = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [employeeDepartment, setEmployeeDepartment] = useState("");
  const [timeTracking, setTimeTracking] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [timeTrackingHistory, setTimeTrackingHistory] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [filterDateRange, setFilterDateRange] = useState("3 Months");
  const navigate = useNavigate();
  const [showCamera, setShowCamera] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const webcamRef = useRef(null);

  useEffect(() => {
    document.title = "Dashboard - Home";
    const authToken = localStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employeeDepartment") || "Unknown";
    const employeeId = localStorage.getItem("employeeId");

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

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const fetchActiveSession = async () => {
    try {
      const employeeId = localStorage.getItem("employeeId");
      const response = await axios.get(
        `${APIBASED_URL}/api/timetrack/active-session/${employeeId}`
      );
      setActiveSession(response.data);
    } catch (error) {
      console.error("Error fetching active session:", error);
    }
  };

  useEffect(() => {
    const employeeId = localStorage.getItem("employeeId");
    if (employeeId) {
      fetchActiveSession();
    }
  }, []);

  useEffect(() => {
    const fetchTimeTrackingHistory = async () => {
      try {
        const employeeId = localStorage.getItem("employeeId");
        const response = await axios.get(
          `${APIBASED_URL}/api/timetrack/history/${employeeId}`
        );
        setTimeTrackingHistory(response.data);
      } catch (error) {
        console.error("Error fetching time tracking history:", error);
      }
    };

    fetchTimeTrackingHistory();
  }, [activeSession]);

  const calculateDateRange = (range) => {
    const date = new Date();
    switch (range) {
      case "1 Month":
        date.setMonth(date.getMonth() - 1);
        break;
      case "3 Months":
        date.setMonth(date.getMonth() - 3);
        break;
      case "6 Months":
        date.setMonth(date.getMonth() - 6);
        break;
      default:
        date.setMonth(date.getMonth() - 3);
    }
    return date;
  };

  const filteredRecords = timeTrackingHistory.filter((record) => {
    const recordDate = new Date(record.time_in);
    const dateRange = calculateDateRange(filterDateRange);
    if (filterStatus === "All") return recordDate >= dateRange;
    return (
      record.status.toLowerCase() === filterStatus.toLowerCase() &&
      recordDate >= dateRange
    );
  });

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const [loading, setLoading] = useState(false);
  const fullname = localStorage.getItem("fullName");
  console.log("Full Name:", fullname);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        console.log("✅ face-api models loaded");
      } catch (error) {
        console.error("❌ Error loading face-api models", error);
      }
    };

    loadModels();
  }, []);

  const getFaceDescriptorFromWebcam = async () => {
    if (!webcamRef.current) throw new Error("Webcam not available");
    const video = webcamRef.current.video;
    if (!video) throw new Error("Webcam video not ready");
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!detection) throw new Error("No face detected.");
    return detection.descriptor;
  };

  const verifyFaceBeforeSubmit = async (faceDescriptor) => {
    try {
      const email = localStorage.getItem("email");
      const descriptorArray = Array.from(faceDescriptor);
      const response = await axios.post(
        `${APIBASED_URL}/api/login-admin/verify-face`,
        {
          email,
          faceDescriptor: descriptorArray,
        }
      );

      if (response.status === 200) {
        console.log("✅ Face verified successfully");
        return true;
      }
      return false;
    } catch (err) {
      console.error("❌ Face verification failed:", err);
      Swal.fire({
        title: "Face Verification Failed",
        text:
          err.response?.data?.message ||
          "Face verification failed. Please try again.",
        icon: "error",
      });
      return false;
    }
  };

  const handleFaceVerification = async () => {
    setVerifying(true);
    try {
      const faceDescriptor = await getFaceDescriptorFromWebcam();
      const isVerified = await verifyFaceBeforeSubmit(faceDescriptor);
      if (isVerified) {
        setFaceVerified(true);
        setShowCamera(false);
        Swal.fire({
          title: "Face Verified",
          text: "Face verification successful. Processing your request...",
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });

        // Execute pending action after verification
        if (pendingAction === "timeIn") {
          timeIn(true);
        } else if (pendingAction === "timeOut") {
          timeOut(true);
        }
        setPendingAction(null);
      }
    } catch (err) {
      Swal.fire({
        title: "Face Verification Failed",
        text: err.message || "Face verification failed. Please try again.",
        icon: "error",
      });
    } finally {
      setVerifying(false);
    }
  };

  // Time In Function
  const timeIn = async (skipFaceCheck = false) => {
    if (!skipFaceCheck) {
      setPendingAction("timeIn");
      setShowCamera(true);
      return;
    }

    try {
      setLoading(true);
      const employeeId = localStorage.getItem("employeeId");

      // Get schedule first
      const scheduleResponse = await axios.get(
        `${APIBASED_URL}/api/schedule/get-schedule/${employeeId}`
      );

      const schedule = scheduleResponse.data[0];
      if (!schedule) {
        Swal.fire({
          title: "No Schedule Found",
          text: "You don't have any assigned schedule. Please contact your administrator.",
          icon: "warning",
        });
        setLoading(false);
        return;
      }

      // Get Singapore time
      const now = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Singapore",
      });
      const sgTime = new Date(now);

      // Check if today is a working day
      const currentDay = sgTime.toLocaleString("en-US", { weekday: "long" });
      if (!schedule.days.includes(currentDay)) {
        Swal.fire({
          title: "Not Scheduled",
          text: `You are not scheduled to work on ${currentDay}`,
          icon: "warning",
        });
        setLoading(false);
        return;
      }

      // Determine shift based on current time
      const currentHour = sgTime.getHours();
      let shiftName = "";

      if (currentHour >= 6 && currentHour < 14) {
        shiftName = "Morning Shift";
      } else if (currentHour >= 14 && currentHour < 22) {
        shiftName = "Afternoon Shift";
      } else {
        shiftName = "Night Shift";
      }

      // Check for existing time in
      const checkResponse = await axios.get(
        `${APIBASED_URL}/api/timetrack/check-time-in`,
        {
          params: { employee_id: employeeId },
        }
      );

      const { hasTimeIn, hasManualEntry } = checkResponse.data;

      if (hasTimeIn) {
        Swal.fire({
          title: "Already Timed In",
          text: "You have already recorded a time-in for today.",
          icon: "warning",
        });
        setLoading(false);
        return;
      }

      if (hasManualEntry) {
        Swal.fire({
          title: "Manual Entry Exists",
          text: "You already submitted a Manual Entry for today.",
          icon: "warning",
        });
        setLoading(false);
        return;
      }

      // Calculate if late
      const [scheduleStartHour, scheduleStartMinute] =
        schedule.startTime.split(":");
      const scheduleStartInMinutes =
        parseInt(scheduleStartHour) * 60 + parseInt(scheduleStartMinute);
      const currentTimeInMinutes = currentHour * 60 + sgTime.getMinutes();
      const isLate = currentTimeInMinutes > scheduleStartInMinutes;
      const minutesLate = isLate
        ? currentTimeInMinutes - scheduleStartInMinutes
        : 0;

      // Make the time-in request with shift name
      const response = await axios.post(
        `${APIBASED_URL}/api/timetrack/time-in`,
        {
          employee_id: employeeId,
          employee_fullname: fullname,
          position: localStorage.getItem("employeePosition"),
          entry_status: isLate ? "late" : "on_time",
          minutes_late: minutesLate,
          shift_name: schedule.shiftName, // Add shift name here
        }
      );

      setActiveSession(response.data.session);

      const message = isLate
        ? `Time in recorded successfully. You are ${Math.floor(
            minutesLate / 60
          )}h ${minutesLate % 60}m late.`
        : "Time in recorded successfully!";

      Swal.fire({
        title: "Success!",
        text: `${message}\nShift: ${shiftName}`,
        icon: "success",
      });
    } catch (error) {
      console.error("Error recording Time In:", error);
      Swal.fire({
        title: "Error!",
        text: error.response?.data?.message || "Failed to record Time In",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Time Out Function
  const timeOut = async (skipFaceCheck = false) => {
    if (!skipFaceCheck) {
      setPendingAction("timeOut");
      setShowCamera(true);
      return;
    }

    try {
      const employeeId = localStorage.getItem("employeeId");
      const response = await axios.put(
        `${APIBASED_URL}/api/timetrack/time-out`,
        {
          employee_id: employeeId,
        }
      );

      setActiveSession(null);
      Swal.fire("Success!", "Time Out recorded successfully!", "success");
    } catch (error) {
      console.error("Error recording Time Out:", error);
      Swal.fire(
        "Error!",
        error.response?.data?.message || "Failed to record Time Out.",
        "error"
      );
    }
  };

  const formatHours = (duration) => {
    if (!duration) return "-";

    // If duration is a number (minutes), convert to HH:MM:00 format
    if (typeof duration === "number") {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:00`;
    }

    // If duration is a string with 'H' and 'M' format
    if (typeof duration === "string") {
      const hoursMatch = duration.match(/(\d+)H/);
      const minutesMatch = duration.match(/(\d+)M/);

      const hours = parseInt(hoursMatch?.[1] || 0);
      const minutes = parseInt(minutesMatch?.[1] || 0);

      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:00`;
    }

    return "-";
  };

  const [selectedRows, setSelectedRows] = useState([]);
  const toggleRowSelection = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

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
        {isSidebarOpen && isMobileView && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-10"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <div className="p-5 font-bold text-2xl">
          <Breadcrumbs />
          <h1 className="px-3">Start Your Time Tracking</h1>
        </div>

        {/* MAIN CONTENT */}
        <div className="transition-all min-h-screen bg-slate-100 duration-300 ease-in-out flex-grow p-5">
          {/* Time Tracking Controls */}
          <div className="card bg-base-100 shadow-sm mb-6 border-2">
            <div className="card-body flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-left">
                <h2 className="text-lg font-semibold">Today:</h2>
                <span className="text-xl font-bold">
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    activeSession ? timeOut(false) : timeIn(false)
                  }
                  className={`btn py-2 px-4 text-lg font-semibold ${
                    activeSession ? "btn-error" : "btn-success"
                  } flex items-center space-x-2`}
                >
                  <FaPlus />
                  <span>{activeSession ? "Time Out" : "Time In"}</span>
                </button>

                <button
                  className="bg-blue-300 py-2 px-4 rounded-md font-semibold hover:bg-blue-400 transition-all duration-300 ease-in-out text-lg"
                  onClick={() => navigate("/request-form")}
                >
                  Manual Time Entries
                </button>
              </div>
            </div>
          </div>

          {/* Time Tracking History Table */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-4">
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

              <select
                className="select select-bordered"
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
              >
                <option value="1 Month">Last 1 Month</option>
                <option value="3 Months">Last 3 Months</option>
                <option value="6 Months">Last 6 Months</option>
              </select>
            </div>
          </div>

          {/* TABLE */}
          <div className="card bg-base-100 shadow-sm">
            <div>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="text-sm border-b-2 border-gray-100">
                      <th>{""}</th>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Duration</th>
                      <th>Overtime Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.length > 0 ? (
                      currentRecords.map((record) => (
                        <tr
                          key={record._id}
                          className={
                            selectedRows.includes(record._id)
                              ? "bg-gray-200"
                              : ""
                          }
                        >
                          <td>
                            <input
                              type="checkbox"
                              onChange={() => toggleRowSelection(record._id)}
                              checked={selectedRows.includes(record._id)}
                            />
                          </td>
                          <td>
                            {new Date(record.time_in).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </td>
                          <td>
                            {new Date(record.time_in).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}
                            {record.entry_status === "late" && (
                              <span className="badge badge-warning ml-2">
                                Late ({formatHours(record.minutes_late)})
                              </span>
                            )}
                          </td>
                          <td>
                            {record.time_out
                              ? new Date(record.time_out).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                )
                              : "-"}
                          </td>
                          <td>
                            {record.time_out ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-sm">
                                  {formatHours(record.total_hours)}
                                </span>
                                {record.overtime_hours > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {formatHours(record.overtime_hours)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              "Active"
                            )}
                          </td>
                          <td>
                            {record.overtime_hours > 0
                              ? formatHours(record.overtime_hours)
                              : "No Overtime"}
                          </td>
                          <td>
                            <span
                              className={`badge capitalize ${
                                record.status === "active"
                                  ? "badge-success"
                                  : record.status === "pending"
                                  ? "badge-warning"
                                  : record.status === "approved"
                                  ? "badge-info"
                                  : "badge-error"
                              }`}
                            >
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="text-center py-4 text-gray-500"
                        >
                          No Time Tracking Records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-4 p-4">
                <div>
                  <span className="text-sm text-gray-600">
                    Showing entries {indexOfFirstRecord + 1} -{" "}
                    {Math.min(indexOfLastRecord, filteredRecords.length)} of{" "}
                    {filteredRecords.length}
                  </span>
                </div>
                <div className="join">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={index + 1}
                      className={`join-item btn ${
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

      {/* Add Face Verification Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="modal modal-open">
            <div className="modal-box flex flex-col items-center relative p-6">
              <button
                className="btn btn-sm btn-circle absolute right-2 top-2"
                onClick={() => {
                  if (!verifying) {
                    setShowCamera(false);
                    setPendingAction(null);
                  }
                }}
                disabled={verifying}
                aria-label="Close"
              >
                ✕
              </button>
              <h3 className="font-semibold text-lg mb-2">Face Verification</h3>
              <p className="mb-2 text-gray-600 text-sm text-center">
                Please show your face clearly in the camera preview below and
                click "Verify".
              </p>
              <div className="relative w-[240px] h-[180px] flex items-center justify-center mb-2">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width={240}
                  height={180}
                  videoConstraints={{ facingMode: "user" }}
                  className="rounded-lg border border-gray-300"
                />
                {verifying && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80 rounded-lg z-20">
                    <span className="loading loading-spinner loading-lg text-primary mb-2"></span>
                    <span className="text-base font-semibold">
                      Verifying face...
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn btn-primary mt-3 w-full flex items-center justify-center"
                onClick={handleFaceVerification}
                disabled={verifying}
              >
                {verifying && (
                  <span className="loading loading-spinner loading-xs mr-2"></span>
                )}
                {verifying ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracking;
