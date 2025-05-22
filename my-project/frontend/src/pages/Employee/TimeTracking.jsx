import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const [webcamError, setWebcamError] = useState(null);

  // Add these new state variables after other state declarations
  const [lastDetections, setLastDetections] = useState([]);
  const [spoofingAttempted, setSpoofingAttempted] = useState(false);
  const detectionHistoryRef = useRef([]);
  // Update these constants for stricter detection
  const SPOOF_THRESHOLD = 0.02; // Lower threshold to detect more subtle patterns
  const MIN_NATURAL_MOVEMENT = 0.8; // Minimum required natural movement
  const MAX_UNIFORM_MOVEMENTS = 3; // Maximum allowed similar movements before flagging as suspicious

  // Enhanced spoofing detection
  const detectSpoofing = (detection, landmarks) => {
    const newDetections = [...detectionHistoryRef.current, {
      box: detection.detection.box,
      landmarks: landmarks.positions,
      timestamp: Date.now(),
      brightness: calculateBrightness(webcamRef.current.video)
    }].slice(-15); // Increased sample size
    
    detectionHistoryRef.current = newDetections;

    if (newDetections.length < 8) return false;

    // Check for video playback patterns
    const movements = newDetections.slice(1).map((det, i) => ({
      x: det.box.x - newDetections[i].box.x,
      y: det.box.y - newDetections[i].box.y,
      time: det.timestamp - newDetections[i].timestamp,
      brightness: det.brightness
    }));

    // Check for suspiciously uniform movement patterns
    let uniformMovementCount = 0;
    for (let i = 1; i < movements.length; i++) {
      const curr = movements[i];
      const prev = movements[i-1];
      
      const movementDiff = Math.abs(
        Math.hypot(curr.x, curr.y) - Math.hypot(prev.x, prev.y)
      );
      
      if (movementDiff < SPOOF_THRESHOLD) {
        uniformMovementCount++;
        if (uniformMovementCount >= MAX_UNIFORM_MOVEMENTS) {
          console.log("Detected uniform movement pattern - possible video playback");
          setSpoofingAttempted(true);
          return true;
        }
      } else {
        uniformMovementCount = 0;
      }
    }

    // Check for natural movement variation
    const totalMovement = movements.reduce((sum, m) => 
      sum + Math.hypot(m.x, m.y), 0
    );
    
    if (totalMovement < MIN_NATURAL_MOVEMENT) {
      console.log("Insufficient natural movement - possible static image");
      setSpoofingAttempted(true);
      return true;
    }

    // Check for brightness consistency
    const brightnessDiffs = movements.map(m => Math.abs(m.brightness));
    const hasNaturalBrightnessVariation = brightnessDiffs.some(diff => diff > 2);
    if (!hasNaturalBrightnessVariation) {
      console.log("Suspiciously constant brightness - possible video playback");
      setSpoofingAttempted(true);
      return true;
    }

    return false;
  };

  // Add this helper function for brightness detection
  const calculateBrightness = (videoElement) => {
    if (!videoElement) return 0;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let brightness = 0;
    
    // Sample pixels for performance
    for (let i = 0; i < data.length; i += 20) {
      brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    
    return brightness / (data.length / 20);
  };

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
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
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
      // Handle 401 Unauthorized
      if (err.response && err.response.status === 401) {
        Swal.fire({
          title: "Face Not Detected",
          text: "Face livenes not detected. Please log in again.",
          icon: "warning",
        }).then(() => {
          localStorage.clear();
          window.location.href = "/employeelogin";
        });
        return false;
      }
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

  // Liveness state
  const [livenessPassed, setLivenessPassed] = useState(false);
  const [livenessChecking, setLivenessChecking] = useState(false);
  const [livenessError, setLivenessError] = useState(null);

  // Timer and attempt state for liveness
  const [livenessTimer, setLivenessTimer] = useState(30); // Changed from 10 to 30
  const [livenessAttempt, setLivenessAttempt] = useState(1);
  const [mouthOpenProgress, setMouthOpenProgress] = useState(0);
  const MAX_ATTEMPTS = 3;
  const TIMER_DURATION = 30; // Changed from 10 to 30 seconds

  // Helper for mouth aspect ratio (MAR)
  const calculateMAR = (mouth) => {
    // MAR = (||p63-p67|| + ||p64-p66|| + ||p62-p68||) / (2 * ||p61-p65||)
    // mouth: [p48, p49, ..., p67] (20 points, but we use 61-68 for inner mouth)
    // face-api.js: 61-68 are mouth[13] to mouth[20]
    const A = Math.hypot(mouth[13].x - mouth[19].x, mouth[13].y - mouth[19].y); // 62-68
    const B = Math.hypot(mouth[14].x - mouth[18].x, mouth[14].y - mouth[18].y); // 63-67
    const C = Math.hypot(mouth[15].x - mouth[17].x, mouth[15].y - mouth[17].y); // 64-66
    const D = Math.hypot(mouth[12].x - mouth[16].x, mouth[12].y - mouth[16].y); // 61-65
    if (D === 0) return 0;
    return (A + B + C) / (2.0 * D);
  };

  // Liveness check: require 2 mouth opens, with timer and attempts
  const runLivenessCheck = useCallback(async () => {
    setLivenessChecking(true);
    setLivenessError(null);
    setLivenessPassed(false);
    setMouthOpenProgress(0);

    let mouthOpenCount = 0;
    let tries = 0;
    let lastMAR = 0.3;

    const MAR_OPEN = 0.6;
    const MAR_CLOSED = 0.3;
    const MAX_TRIES = 240;
    const SLEEP_INTERVAL = 100;

    // Timer logic
    let timer = TIMER_DURATION;
    setLivenessTimer(timer);

    // Timer interval
    let timerInterval = setInterval(() => {
      timer -= 1;
      setLivenessTimer(timer);
    }, 1000);

    let timedOut = false;
    // Timeout promise
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        timedOut = true;
        clearInterval(timerInterval);
        setLivenessTimer(0);
        resolve(false);
      }, TIMER_DURATION * 1000);
    });

    // Liveness detection promise
    const livenessPromise = (async () => {
      while (mouthOpenCount < 2 && tries < MAX_TRIES && !timedOut) {
        tries++;
        if (!webcamRef.current?.video) {
          await new Promise((r) => setTimeout(r, SLEEP_INTERVAL));
          continue;
        }
        const video = webcamRef.current.video;
        try {
          const detection = await faceapi
            .detectSingleFace(
              video,
              new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
            )
            .withFaceLandmarks();

          if (!detection || !detection.landmarks) {
            await new Promise((r) => setTimeout(r, SLEEP_INTERVAL));
            continue;
          }

          // Add spoofing detection
          if (detectSpoofing(detection, detection.landmarks)) {
            clearInterval(timerInterval);
            setLivenessError("Possible spoofing attempt detected. Please use your real face.");
            return false;
          }

          const mouth = detection.landmarks.getMouth();
          if (!mouth || mouth.length < 20) {
            await new Promise((r) => setTimeout(r, SLEEP_INTERVAL));
            continue;
          }

          const mar = calculateMAR(mouth);

          if (lastMAR < MAR_CLOSED && mar > MAR_OPEN) {
            mouthOpenCount++;
            setMouthOpenProgress(mouthOpenCount); // update progress
            let closedDetected = false;
            let closeTries = 0;
            while (!closedDetected && closeTries < 30) {
              closeTries++;
              await new Promise((r) => setTimeout(r, 100));
              const detection2 = await faceapi
                .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks();
              if (detection2 && detection2.landmarks) {
                const mouth2 = detection2.landmarks.getMouth();
                if (mouth2 && mouth2.length >= 20) {
                  const mar2 = calculateMAR(mouth2);
                  if (mar2 < MAR_CLOSED) {
                    closedDetected = true;
                    break;
                  }
                }
              }
            }
          }
          lastMAR = mar;
        } catch (e) {
          console.error("❌ Detection error:", e);
        }
        await new Promise((r) => setTimeout(r, SLEEP_INTERVAL));
      }
      clearInterval(timerInterval);
      return mouthOpenCount >= 2;
    })();

    // Race liveness and timeout
    const result = await Promise.race([livenessPromise, timeoutPromise]);

    if (result) {
      setLivenessPassed(true);
      setLivenessChecking(false);
      setLivenessError(null);
      setLivenessTimer(TIMER_DURATION);
      setLivenessAttempt(1);
      setMouthOpenProgress(0);
      return true;
    } else {
      setLivenessPassed(false);
      setLivenessChecking(false);
      setLivenessError(
        "Mouth open gesture not detected in time. Please open your mouth wide (like saying 'ahh') twice in front of the camera."
      );
      setLivenessTimer(TIMER_DURATION);
      setMouthOpenProgress(0);
      return false;
    }
  }, []);

  // Modify handleFaceVerification to handle spoofing attempts
  const handleFaceVerification = async () => {
    setVerifying(true);
    setSpoofingAttempted(false); // Reset spoofing detection
    detectionHistoryRef.current = []; // Clear detection history

    try {
      let success = false;
      let attempt = livenessAttempt;
      while (attempt <= MAX_ATTEMPTS && !success) {
        setLivenessAttempt(attempt);
        setLivenessTimer(TIMER_DURATION);
        const livenessOk = await runLivenessCheck();
        if (livenessOk) {
          success = true;
          break;
        } else if (attempt < MAX_ATTEMPTS) {
          // Wait a moment before next attempt
          await new Promise((r) => setTimeout(r, 1000));
        }
        attempt++;
      }
      setLivenessAttempt(1);

      if (!success) {
        const logoutMessage = spoofingAttempted 
          ? "Spoofing attempt detected. For security reasons, you will be logged out."
          : "Failed after 3 attempts. For security reasons, you will be logged out.";

        Swal.fire({
          title: "Verification Failed",
          text: logoutMessage,
          icon: "error",
          confirmButtonText: "OK"
        }).then(() => {
          localStorage.clear();
          window.location.href = "/employeelogin";
        });
        setVerifying(false);
        return;
      }

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

      // --- NIGHT SHIFT LOGIC + TIME WINDOW CHECK ---
      const [schedStartHour, schedStartMin] = schedule.startTime
        .split(":")
        .map(Number);
      const [schedEndHour, schedEndMin] = schedule.endTime
        .split(":")
        .map(Number);

      const currentDay = sgTime.toLocaleString("en-US", { weekday: "long" });
      const prevDay = new Date(sgTime);
      prevDay.setDate(sgTime.getDate() - 1);
      const prevDayName = prevDay.toLocaleString("en-US", { weekday: "long" });

      const crossesMidnight =
        schedEndHour < schedStartHour ||
        (schedEndHour === schedStartHour && schedEndMin < schedStartMin);

      let isScheduled = false;
      let canTimeIn = false;

      // Calculate current time in minutes
      const currentMinutes = sgTime.getHours() * 60 + sgTime.getMinutes();
      const startMinutes = schedStartHour * 60 + schedStartMin;
      const endMinutes = schedEndHour * 60 + schedEndMin;

      if (crossesMidnight) {
        // Night shift: allow time-in from startTime (previous day) to endTime (current day)
        if (
          // After start time on previous day
          (schedule.days.includes(currentDay) &&
            currentMinutes >= startMinutes) ||
          // Before end time on current day (after midnight)
          (schedule.days.includes(prevDayName) && currentMinutes < endMinutes)
        ) {
          isScheduled = true;
          canTimeIn = true;
        }
      } else {
        // Regular shift: allow time-in only between start and end time on the same day
        if (
          schedule.days.includes(currentDay) &&
          currentMinutes >= startMinutes &&
          currentMinutes < endMinutes
        ) {
          isScheduled = true;
          canTimeIn = true;
        }
      }

      if (!isScheduled) {
        Swal.fire({
          title: "Not Scheduled",
          text: `You are not scheduled to work at this time.`,
          icon: "warning",
        });
        setLoading(false);
        return;
      }

      if (!canTimeIn) {
        Swal.fire({
          title: "Too Early or Too Late",
          text: `You can only time in during your scheduled start time window.`,
          icon: "warning",
        });
        setLoading(false);
        return;
      }
      // --- END NIGHT SHIFT LOGIC + TIME WINDOW CHECK ---

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

      // Generate time tracking ID using timestamp and random string
      const monthYear = `${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getFullYear()}`;
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      const time_tracking_id = `TRID-${monthYear}-${randomStr}`;

      // Make the time-in request with time_tracking_id
      const response = await axios.post(`${APIBASED_URL}/api/timetrack/time-in`, {
        employee_id: employeeId,
        employee_fullname: fullname,
        position: localStorage.getItem("employeePosition"),
        entry_status: isLate ? "late" : "on_time",
        minutes_late: minutesLate,
        shift_name: schedule.shiftName,
        time_tracking_id: time_tracking_id // Add this line
      });

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
      const response = await axios.put(`${APIBASED_URL}/api/timetrack/time-out`, {
        employee_id: employeeId,
      });

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

  // Add this effect to request camera access as soon as showCamera is true
  useEffect(() => {
    if (showCamera && webcamRef.current) {
      // Try to trigger the webcam stream by forcing a re-mount
      webcamRef.current.video?.play?.().catch(() => {});
    }
  }, [showCamera]);

  // Add this effect to clear webcam error when modal closes
  useEffect(() => {
    if (!showCamera) setWebcamError(null);
  }, [showCamera]);

  // Add a fallback for browsers that block autoplay or require user gesture
  const handleOpenCamera = () => {
    setShowCamera(true);
    setTimeout(() => {
      if (webcamRef.current?.video && webcamRef.current.video.paused) {
        webcamRef.current.video.play().catch(() => {});
      }
    }, 500);
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
                    activeSession
                      ? timeOut(false)
                      : (() => {
                          setPendingAction("timeIn");
                          setShowCamera(true);
                        })()
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
              >
                ✕
              </button>
              <h3 className="font-semibold text-lg mb-2">Face Verification</h3>
              {!livenessPassed && (
                <div className="mb-2 text-blue-600 text-sm text-center">
                  Please <b>open your mouth wide</b> (like saying "ahh") <b>twice</b> to pass the liveness check before face
                  verification.
                  <br />
                  <span>
                    Attempt {livenessAttempt} of {MAX_ATTEMPTS} &nbsp;|&nbsp; Time left: <b>{livenessTimer}s</b>
                  </span>
                  <div className="flex justify-center items-center gap-2 mt-2">
                    <span
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        mouthOpenProgress >= 1
                          ? "bg-green-400 border-green-600 text-white"
                          : "bg-gray-200 border-gray-400 text-gray-400"
                      }`}
                      title="First mouth open"
                    >
                      {mouthOpenProgress >= 1 ? "✓" : "1"}
                    </span>
                    <span
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        mouthOpenProgress >= 2
                          ? "bg-green-400 border-green-600 text-white"
                          : "bg-gray-200 border-gray-400 text-gray-400"
                      }`}
                      title="Second mouth open"
                    >
                      {mouthOpenProgress >= 2 ? "✓" : "2"}
                    </span>
                  </div>
                </div>
              )}
              {livenessChecking && (
                <div className="mb-2 text-sm text-gray-500">
                  Verifying
                </div>
              )}
              {livenessError && (
                <div className="mb-2 text-red-500 text-sm">{livenessError}</div>
              )}
              <div className="relative w-[240px] h-[180px] flex items-center justify-center mb-2">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width={240}
                  height={180}
                  videoConstraints={{ facingMode: "user" }}
                  className="rounded-lg border border-gray-300"
                  onUserMediaError={(err) =>
                    setWebcamError(
                      "Unable to access camera. Please allow camera access in your browser and ensure no other app is using it."
                    )
                  }
                  onUserMedia={() => setWebcamError(null)}
                  forceScreenshotSourceSize
                />
                {webcamError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-lg z-30">
                    <span className="text-red-600 font-semibold text-center px-2">
                      {webcamError}
                    </span>
                  </div>
                )}
                {verifying && !webcamError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80 rounded-lg z-20">
                    <span className="loading loading-spinner loading-lg text-primary mb-2"></span>
                    <span className="text-base font-semibold">
                      {livenessChecking
                        ? "Checking liveness..."
                        : "Verifying face..."}
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
                {verifying
                  ? livenessChecking
                    ? "Checking Liveness..."
                    : "Verifying..."
                  : "Verify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracking;
