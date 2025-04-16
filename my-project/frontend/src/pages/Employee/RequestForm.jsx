// MANUAL ENTRIES TIME TRACKING

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Swal from "sweetalert2";
import Breadcrumbs from "../../Components/BreadCrumb";
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

const RequestForm = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(() => {
    return localStorage.getItem("hideManualEntryGuide") !== "true";
  });
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [leaveType, setLeaveType] = useState("Sick Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeDepartment, setEmployeeDepartment] = useState("");
  const [employeeUsername, setEmployeeUsername] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [position, setPosition] = useState("");
  const navigate = useNavigate();
  const [proofFile, setProofFile] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [openingModal, setOpeningModal] = useState(false); // loading state for opening modal
  const [pendingSubmitData, setPendingSubmitData] = useState(null); // <-- NEW
  const webcamRef = useRef(null);

  const authToken = localStorage.getItem("employeeToken");
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const fullname = localStorage.getItem("fullName");
  console.log(fullname);

  const email = localStorage.getItem("email");
  console.log("Email:", email);

  useEffect(() => {
    document.title = "Request Form";
    const authToken = localStorage.getItem("employeeToken");
    const fullname = localStorage.getItem("fullName");
    const department = localStorage.getItem("employeeDepartment") || "Unknown";
    const username = localStorage.getItem("employeeUsername") || "";
    const employeeId = localStorage.getItem("employeeId") || "";
    const position = localStorage.getItem("employeePosition") || "";

    if (!authToken) {
      Swal.fire({
        title: "Not Logged In",
        text: "You are not logged in. Redirecting to Login Page",
        icon: "warning",
        confirmButtonText: "OK",
      }).then(() => navigate("/employeelogin"));
    } else {
      setEmployeeId(employeeId);
      setEmployeeName(fullname);
      setEmployeeDepartment(department);
      setEmployeeUsername(username);
      setPosition(position);
    }

    // Pre-fill form data with user information
    setFormData((prevData) => ({
      ...prevData,
      employee_id: employeeId,
      employee_name: fullname,
      position: position,
    }));
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
    fetchSchedules();
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
  const [formData, setFormData] = useState({
    position: "",
    employee_name: "",
    employee_id: "",
    date: new Date().toISOString().split("T")[0],
    morning_time_in: localStorage.getItem("scheduleStartTime") || "",
    morning_time_out: localStorage.getItem("breakStartTime") || "",
    afternoon_time_in: localStorage.getItem("breakEndTime") || "",
    afternoon_time_out: localStorage.getItem("scheduleEndTime") || "",
    overtime_start: "",
    overtime_end: "",
    purpose: "",
    remarks: "",
    status: "pending",
    break_duration: 0,
    label: "OB",
    entry_type: "Manual Entry",
    shift_name: "", // Add shift_name to formData
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isValidDate = (dateString) => {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return selectedDate <= today;
  };

  const getMinDate = () => {
    const pastThreeDays = new Date();
    pastThreeDays.setDate(pastThreeDays.getDate() - 3);
    return pastThreeDays.toISOString().split("T")[0];
  };

  const createDateTime = (date, time) => {
    return new Date(`${date}T${time}:00`).toISOString();
  };

  const getMaxDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const isWorkday = (dateString) => {
    const selectedDate = new Date(dateString);
    const dayName = selectedDate.toLocaleString("en-US", { weekday: "long" });
    return schedules.some((schedule) => schedule.days.includes(dayName));
  };

  //FUNCTION FOR POST METHOD
  const [loading, setLoading] = useState(false);

  const calculateNightShiftDuration = (date, startTime, endTime) => {
    let start = new Date(`${date}T${startTime}`);
    let end = new Date(`${date}T${endTime}`);

    if (end < start) {
      end.setDate(end.getDate() + 1);
    }

    const duration = end - start;

    return duration / (1000 * 60 * 60);
  };

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkFaceId = async () => {
      try {
        setIsLoading(true);
        const email = localStorage.getItem("email");
  
        if (!email) {
          throw new Error("No email found in localStorage");
        }
  
        const response = await axios.get(
          `${LOCAL}/api/login-admin/check-face-id/${email}`
        );
        const { hasFaceId } = response.data;
  
        if (!hasFaceId) {
          Swal.fire({
            title: "Face ID not registered",
            text: "You need to register your face ID in the settings first.",
            icon: "warning",
          }).then(() => {
            navigate("/settings");
          });
        }
      } catch (error) {
        console.error("Error checking face ID:", error);
        Swal.fire({
          title: "Error",
          text: "There was an issue checking your face ID. Please try again later.",
          icon: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };
  
    checkFaceId();
  }, [navigate]); // ✅ Keep navigate in dependency array

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

      // Convert face descriptor to array format
      const descriptorArray = Array.from(faceDescriptor);

      const response = await axios.post(
        `${LOCAL}/api/login-admin/verify-face`,
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
        setFaceVerified(true); // Set before calling handleSubmit
        Swal.fire({
          title: "Face Verified",
          text: "Face verification successful. Submitting your request...",
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });
        setShowCamera(false);
        // If there is a pending submit, proceed
        if (pendingSubmitData !== null) {
          setPendingSubmitData(null);
          setTimeout(() => {
            handleSubmit({ preventDefault: () => {} }, true); // Pass skipFaceCheck=true
          }, 300);
        }
      } else {
        setFaceVerified(false);
      }
    } catch (err) {
      Swal.fire({
        title: "Face Verification Failed",
        text: err.message || "Face verification failed. Please try again.",
        icon: "error",
      });
      setFaceVerified(false);
    }
    setVerifying(false);
  };

  // Update handleSubmit to accept skipFaceCheck
  const handleSubmit = async (e, skipFaceCheck = false) => {
    e.preventDefault && e.preventDefault();

    // Only check faceVerified if not skipping
    if (!skipFaceCheck && !faceVerified) {
      setPendingSubmitData({});
      setShowCamera(true);
      return;
    }

    const authToken = localStorage.getItem("employeeToken");
    if (!authToken) {
      Swal.fire({
        title: "Session Expired",
        text: "Your session has expired. Please login again.",
        icon: "warning",
      }).then(() => navigate("/employeelogin"));
      return;
    }

    const selectedDate = new Date(formData.date);
    const today = new Date();
    if (selectedDate > today) {
      Swal.fire({
        title: "Invalid Date",
        text: "You cannot submit requests for future dates.",
        icon: "warning",
      });
      return;
    }

    // Validate file upload
    if (!proofFile) {
      Swal.fire({
        title: "Missing File",
        text: "Please upload a supporting document image.",
        icon: "warning",
      });
      // Optionally, focus the label or scroll to file upload area
      document.getElementById("fileUpload").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    Swal.fire({
      title: "Submitting...",
      text: "Please wait while we process your request.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const checkResponse = await axios.get(
        `${LOCAL}/api/timetrack/check-duplicate`,
        {
          params: {
            employee_id: formData.employee_id,
            date: formData.date,
          },
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (checkResponse.data.duplicate) {
        Swal.fire({
          title: "Duplicate Entry",
          text: "You have already submitted a request for this date. Only one request per day is allowed.",
          icon: "warning",
        });
        return;
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "Failed to verify existing entries. Please try again.",
        icon: "error",
      });
      return;
    }

    let workDuration = 0;
    let overtimeHours = 0;

    // Calculate first part of shift (before break)
    if (formData.morning_time_in && formData.morning_time_out) {
      workDuration += calculateNightShiftDuration(
        formData.date,
        formData.morning_time_in,
        formData.morning_time_out
      );
    }

    // Calculate second part of shift (after break)
    if (formData.afternoon_time_in && formData.afternoon_time_out) {
      workDuration += calculateNightShiftDuration(
        formData.date,
        formData.afternoon_time_in,
        formData.afternoon_time_out
      );
    }

    // Calculate overtime if present
    if (formData.overtime_start && formData.overtime_end) {
      overtimeHours = calculateNightShiftDuration(
        formData.date,
        formData.overtime_start,
        formData.overtime_end
      );
    }

    let uploadedFileUrl = null;
    if (proofFile) {
      const fileData = new FormData();
      fileData.append("file", proofFile);
      fileData.append("upload_preset", "HR1_UPLOADS");

      try {
        const uploadResponse = await axios.post(
          `https://api.cloudinary.com/v1_1/da7oknctx/upload`,
          fileData
        );
        uploadedFileUrl = uploadResponse.data.secure_url;
      } catch (uploadError) {
        Swal.fire({
          title: "Upload Failed",
          text: "Could not upload the file.",
          icon: "error",
        });
        return;
      }
    }

    const timeIn = new Date(`${formData.date}T${formData.morning_time_in}`);
    const timeOut = new Date(`${formData.date}T${formData.afternoon_time_out}`);

    // Handle night shift crossing midnight
    if (timeOut < timeIn) {
      timeOut.setDate(timeOut.getDate() + 1);
    }

    // Calculate total duration and subtract break time
    const totalMilliseconds = timeOut - timeIn;
    const hoursWorked = totalMilliseconds / (1000 * 60 * 60) - 1; // Subtract 1 hour for break

    const requestData = {
      employee_id: formData.employee_id,
      position: formData.position,
      employee_name: formData.employee_name,
      time_in: timeIn.toISOString(),
      time_out: timeOut.toISOString(),
      overtime_start: formData.overtime_start || null, // Add overtime fields
      overtime_end: formData.overtime_end || null, // Add overtime fields
      status: "pending",
      remarks: formData.remarks,
      purpose: formData.purpose,
      entry_type: "Manual Entry",
      file_url: uploadedFileUrl,
      shift_name: formData.shift_name,
      total_hours: `${Math.floor(hoursWorked)}H`, // Format as "8H" after break deduction
    };

    try {
      const response = await axios.post(
        `${LOCAL}/api/timetrack/manual-entry`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.warning) {
        Swal.fire({
          title: "Warning",
          text: response.data.message,
          icon: "warning",
        });
        return;
      }

      if (response.status === 201) {
        Swal.fire({
          title: "Success",
          text: response.data.is_holiday
            ? "Manual time entry submitted successfully. Note: This was recorded on a holiday."
            : "Manual time entry submitted successfully.",
          icon: "success",
        }).then(() => navigate("/request-form"));
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text:
          error.response?.data?.message ||
          "Failed to submit manual entry. Please try again.",
        icon: "error",
      });
    }
  };

  const handleFileChange = (e) => {
    setProofFile(e.target.files[0]);
  };

  const handleHideGuide = (e) => {
    const hide = e.target.checked;
    localStorage.setItem("hideManualEntryGuide", hide);
    setShowGuide(!hide);
  };

  //FETCH EMPLOYEE SCHEDULE
  const [schedules, setSchedules] = useState([]);
  const [validDates, setValidDates] = useState([]);
  const [scheduleStartTime, setScheduleStartTime] = useState("");
  const [scheduleEndTime, setScheduleEndTime] = useState("");
  const [breakStartTime, setBreakStartTime] = useState("");
  const [breakEndTime, setBreakEndTime] = useState("");

  const processSchedules = (schedules) => {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const validDates = [];
    const currentDate = new Date(lastWeek);

    while (currentDate <= today) {
      const dayName = currentDate.toLocaleString("en-US", { weekday: "long" });
      const matchingSchedule = schedules.find((schedule) =>
        schedule.days.includes(dayName)
      );

      if (matchingSchedule) {
        validDates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return validDates;
  };

  // Add format time display function
  const formatTimeDisplay = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const date = new Date(2000, 0, 1, hours, minutes);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const validateTimeInput = (time, type) => {
    // Convert input time and schedule time to comparable format (minutes since midnight)
    const getMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const inputMinutes = getMinutes(time);
    let scheduleMinutes;

    switch (type) {
      case "start":
        scheduleMinutes = getMinutes(scheduleStartTime);
        break;
      case "break_start":
        scheduleMinutes = getMinutes(breakStartTime);
        break;
      case "break_end":
        scheduleMinutes = getMinutes(breakEndTime);
        break;
      case "end":
        scheduleMinutes = getMinutes(scheduleEndTime);
        break;
      default:
        return false;
    }

    return inputMinutes === scheduleMinutes;
  };

  // Update the fetchSchedules function
  const fetchSchedules = async () => {
    const employeeId = localStorage.getItem("employeeId");
    try {
      const response = await axios.get(
        `${LOCAL}/api/schedule/findByEmployeeId/${employeeId}`
      );
      console.log("Schedule", response.data);

      if (response.data?.message) {
        Swal.fire({
          title: "Warning",
          text: "You currently have no assigned schedule. Please kindly wait, Thank you.",
          icon: "warning",
        });
        return;
      }

      const scheduleData = Array.isArray(response.data)
        ? response.data
        : [response.data];
      setSchedules(scheduleData);

      if (scheduleData[0]) {
        const schedule = scheduleData[0];

        const isNightShift = schedule.endTime < schedule.startTime;

        localStorage.setItem("scheduleStartTime", schedule.startTime);
        localStorage.setItem("scheduleEndTime", schedule.endTime);

        if (isNightShift) {
          const breakStart =
            schedule.breakStart || addHours(schedule.startTime, 4);
          const breakEnd = schedule.breakEnd || addHours(breakStart, 1);

          localStorage.setItem("breakStartTime", breakStart);
          localStorage.setItem("breakEndTime", breakEnd);
        } else {
          localStorage.setItem(
            "breakStartTime",
            schedule.breakStart || "12:00"
          );
          localStorage.setItem("breakEndTime", schedule.breakEnd || "13:00");
        }

        setScheduleStartTime(schedule.startTime);
        setScheduleEndTime(schedule.endTime);
        setBreakStartTime(localStorage.getItem("breakStartTime"));
        setBreakEndTime(localStorage.getItem("breakEndTime"));

        setFormData((prev) => ({
          ...prev,
          morning_time_in: schedule.startTime,
          morning_time_out: localStorage.getItem("breakStartTime"),
          afternoon_time_in: localStorage.getItem("breakEndTime"),
          shift_name: schedule.shiftname,
          afternoon_time_out: schedule.endTime,
        }));
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const addHours = (timeStr, hours) => {
    const [h, m] = timeStr.split(":");
    const date = new Date(2000, 0, 1, parseInt(h), parseInt(m));
    date.setHours(date.getHours() + hours);
    return `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  };

  useEffect(() => {
    document.title = "Work Schedule";
    const authToken = localStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employeeDepartment") || "Unknown";
    const employeeId = localStorage.getItem("employeeId");

    const fetchSchedules = async () => {
      try {
        // Fetch schedule by employee ID
        const response = await axios.get(
          `${LOCAL}/api/schedule/findByEmployeeId/${employeeId}`
        );

        if (response.data?.message) {
          Swal.fire({
            title: "Warning",
            text: "You currently have no assigned schedule. Please kindly wait, Thank you.",
            icon: "warning",
          });
          return;
        }

        // Process the schedule data only if valid
        const scheduleData = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setSchedules(scheduleData);
        const processedDates = processSchedules(scheduleData);
        setValidDates(processedDates);
      } catch (error) {
        console.error(
          "Error fetching schedules:",
          error.response?.data || error.message
        );
        Swal.fire({
          title: "Error",
          text: "Failed to fetch schedule information",
          icon: "error",
        });
      }
    };

    if (employeeId) {
      fetchSchedules();
    }
  }, [navigate]);

  // Modal close handler
  const handleCloseModal = () => {
    if (!verifying) setShowCamera(false);
  };

  // Open modal with loading state
  const handleOpenModal = () => {
    setOpeningModal(true);
    setTimeout(() => {
      setShowCamera(true);
      setOpeningModal(false);
    }, 200); // short delay for smoother UX
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
        <div className="p-5 shadow-sm">
          <Breadcrumbs />
          <h1 className="px-5 font-bold text-xl">Manual Time Entries</h1>
        </div>

        {/* MAIN CONTENT */}
        <div className="p-8 bg-slate-100">
          <div className="transition-all duration-300 ease-in-out flex-grow p-8 bg-white rounded-sm">
            {/* Face Verification Modal with Camera */}
            {showCamera && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="modal modal-open">
                  <div className="modal-box flex flex-col items-center relative p-6">
                    <button
                      className="btn btn-sm btn-circle absolute right-2 top-2"
                      onClick={handleCloseModal}
                      disabled={verifying}
                      aria-label="Close"
                    >
                      ✕
                    </button>
                    <h3 className="font-semibold text-lg mb-2">
                      Face Verification
                    </h3>
                    <p className="mb-2 text-gray-600 text-sm text-center">
                      Please show your face clearly in the camera preview below
                      and click "Verify".
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

            {/* ...existing form... */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="justify-end text-end">
                <span className="text-xs bg-red-100 rounded-full p-1 text-red-500 font-semibold">
                  Required *
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Employee Username */}

                <div>
                  <label className="block text-sm font-medium py-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="employeename"
                    value={formData.employee_name}
                    className="input input-bordered w-full bg-gray-100"
                    readOnly
                  />
                </div>

                {/* Employee ID - Read Only */}
                <div>
                  <label className="block text-sm font-medium py-2">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    name="employee_id"
                    value={formData.employee_id}
                    className="input input-bordered w-full bg-gray-100"
                    readOnly
                  />
                </div>

                {/* Add Shift Name display */}
                <div>
                  <label className="block text-sm font-medium py-2">
                    Shift Name
                  </label>
                  <input
                    type="text"
                    name="shift_name"
                    value={formData.shift_name || ""}
                    className="input input-bordered w-full bg-gray-100"
                    readOnly
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium py-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    max={getMaxDate()}
                    min={getMinDate()}
                    onKeyDown={(e) => e.preventDefault()}
                    required
                    onInput={(e) => {
                      const selectedDate = new Date(e.target.value);
                      if (!isWorkday(e.target.value)) {
                        Swal.fire({
                          title: "Day Off",
                          text: "You cannot submit entries for your days off",
                          icon: "warning",
                        });
                        e.target.value = formData.date; // Reset to previous valid date
                        return;
                      }

                      const threeDaysAgo = new Date();
                      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                      if (selectedDate < threeDaysAgo) {
                        Swal.fire({
                          title: "Invalid Date",
                          text: "You can only submit entries for the last 3 days",
                          icon: "warning",
                        });
                        e.target.value = formData.date;
                      }
                    }}
                  />
                </div>
              </div>

              {/* Morning Time In & Time Out */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium py-2">
                    Shift Start Time * (Schedule:{" "}
                    {formatTimeDisplay(scheduleStartTime)})
                  </label>
                  <input
                    type="time"
                    name="morning_time_in"
                    value={formData.morning_time_in}
                    onChange={(e) => {
                      if (validateTimeInput(e.target.value, "start")) {
                        handleChange(e);
                      } else {
                        Swal.fire({
                          title: "Invalid Time",
                          text: `Time must match your schedule time: ${formatTimeDisplay(
                            scheduleStartTime
                          )}`,
                          icon: "warning",
                        });
                        e.target.value = scheduleStartTime;
                      }
                    }}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium py-2">
                    Break Start Time * (Schedule:{" "}
                    {formatTimeDisplay(breakStartTime)})
                  </label>
                  <input
                    type="time"
                    name="morning_time_out"
                    value={formData.morning_time_out}
                    onChange={(e) => {
                      if (validateTimeInput(e.target.value, "break_start")) {
                        handleChange(e);
                      } else {
                        Swal.fire({
                          title: "Invalid Time",
                          text: `Time must match your schedule time: ${formatTimeDisplay(
                            breakStartTime
                          )}`,
                          icon: "warning",
                        });
                        e.target.value = breakStartTime;
                      }
                    }}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
              </div>

              {/* Afternoon Time In & Time Out */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium py-2">
                    End Break Time * (Schedule:{" "}
                    {formatTimeDisplay(breakEndTime)})
                  </label>
                  <input
                    type="time"
                    name="afternoon_time_in"
                    value={formData.afternoon_time_in}
                    onChange={(e) => {
                      if (validateTimeInput(e.target.value, "break_end")) {
                        handleChange(e);
                      } else {
                        Swal.fire({
                          title: "Invalid Time",
                          text: `Time must match your schedule time: ${formatTimeDisplay(
                            breakEndTime
                          )}`,
                          icon: "warning",
                        });
                        e.target.value = breakEndTime;
                      }
                    }}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium py-2">
                    Shift End Time * (Schedule:{" "}
                    {formatTimeDisplay(scheduleEndTime)})
                  </label>
                  <input
                    type="time"
                    name="afternoon_time_out"
                    value={formData.afternoon_time_out}
                    onChange={(e) => {
                      if (validateTimeInput(e.target.value, "end")) {
                        handleChange(e);
                      } else {
                        Swal.fire({
                          title: "Invalid Time",
                          text: `Time must match your schedule time: ${formatTimeDisplay(
                            scheduleEndTime
                          )}`,
                          icon: "warning",
                        });
                        e.target.value = scheduleEndTime;
                      }
                    }}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
              </div>

              {/* Overtime Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium py-2">
                    Overtime Start (Optional)
                  </label>
                  <input
                    type="time"
                    name="overtime_start"
                    value={formData.overtime_start}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium py-2">
                    Overtime End (Optional)
                  </label>
                  <input
                    type="time"
                    name="overtime_end"
                    value={formData.overtime_end}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Purpose & Remarks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Purpose *</label>
                    <textarea
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      placeholder="Enter purpose for manual entry"
                      className="textarea textarea-bordered w-full h-24"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Remarks (Optional)
                    </label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      placeholder="Additional comments if any"
                      className="textarea textarea-bordered w-full h-24"
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">
                    Supporting Document *
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                    <input
                      id="fileUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="mt-1 text-sm text-gray-600">
                        Click or drag image here
                      </p>
                      <p className="text-xs text-gray-500">JPG, PNG, GIF supported</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-300"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
        {/* END OF MAIN CONTENT */}
      </div>
    </div>
  );
};

export default RequestForm;
