// MANUAL ENTRIES TIME TRACKING

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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

  const authToken = localStorage.getItem("employeeToken");
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const fullname = localStorage.getItem("fullName");
  console.log(fullname);

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

  const [formData, setFormData] = useState({
    position: "",
    employee_name: "",
    employee_id: "",
    date: new Date().toISOString().split("T")[0],
    morning_time_in: localStorage.getItem('scheduleStartTime') || "", 
    morning_time_out: localStorage.getItem('breakStartTime') || "",
    afternoon_time_in: localStorage.getItem('breakEndTime') || "",
    afternoon_time_out: localStorage.getItem('scheduleEndTime') || "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    const requestData = {
      employee_id: formData.employee_id,
      position: formData.position,
      employee_name: formData.employee_name,
      time_in: new Date(`${formData.date}T${formData.morning_time_in}`),
      time_out: new Date(`${formData.date}T${formData.afternoon_time_out}`),
      total_hours: workDuration * 3600, // Convert hours to seconds
      overtime_hours: overtimeHours * 3600,
      status: "pending",
      remarks: formData.remarks,
      purpose: formData.purpose,
      entry_type: "Manual Entry",
      file_url: uploadedFileUrl,
      shift_name: formData.shift_name, // Add this line
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
  const [scheduleStartTime, setScheduleStartTime] = useState('');
  const [scheduleEndTime, setScheduleEndTime] = useState('');
  const [breakStartTime, setBreakStartTime] = useState('');
  const [breakEndTime, setBreakEndTime] = useState('');

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
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const date = new Date(2000, 0, 1, hours, minutes);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const validateTimeInput = (time, type) => {
    // Convert input time and schedule time to comparable format (minutes since midnight)
    const getMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const inputMinutes = getMinutes(time);
    let scheduleMinutes;

    switch(type) {
      case 'start':
        scheduleMinutes = getMinutes(scheduleStartTime);
        break;
      case 'break_start':
        scheduleMinutes = getMinutes(breakStartTime);
        break;
      case 'break_end':
        scheduleMinutes = getMinutes(breakEndTime);
        break;
      case 'end':
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
      console.log("Schedule",response.data);

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
        
        localStorage.setItem('scheduleStartTime', schedule.startTime);
        localStorage.setItem('scheduleEndTime', schedule.endTime);
        
    
        if (isNightShift) {
          const breakStart = schedule.breakStart || addHours(schedule.startTime, 4);
          const breakEnd = schedule.breakEnd || addHours(breakStart, 1);
          
          localStorage.setItem('breakStartTime', breakStart);
          localStorage.setItem('breakEndTime', breakEnd);
        } else {
          localStorage.setItem('breakStartTime', schedule.breakStart || '12:00');
          localStorage.setItem('breakEndTime', schedule.breakEnd || '13:00');
        }
        
        setScheduleStartTime(schedule.startTime);
        setScheduleEndTime(schedule.endTime);
        setBreakStartTime(localStorage.getItem('breakStartTime'));
        setBreakEndTime(localStorage.getItem('breakEndTime'));
        
        setFormData(prev => ({
          ...prev,
          morning_time_in: schedule.startTime,
          morning_time_out: localStorage.getItem('breakStartTime'),
          afternoon_time_in: localStorage.getItem('breakEndTime'),
          shift_name: schedule.shiftname,
          afternoon_time_out: schedule.endTime
        }));
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  // Helper function to add hours to time string
  const addHours = (timeStr, hours) => {
    const [h, m] = timeStr.split(':');
    const date = new Date(2000, 0, 1, parseInt(h), parseInt(m));
    date.setHours(date.getHours() + hours);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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

        // Check if the response contains a 'message' (indicating no schedule found)
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
                    value={formData.shift_name || ''}
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
                    Shift Start Time * (Schedule: {formatTimeDisplay(scheduleStartTime)})
                  </label>
                  <input
                    type="time"
                    name="morning_time_in"
                    value={formData.morning_time_in}
                    onChange={(e) => {
                      if (validateTimeInput(e.target.value, 'start')) {
                        handleChange(e);
                      } else {
                        Swal.fire({
                          title: "Invalid Time",
                          text: `Time must match your schedule time: ${formatTimeDisplay(scheduleStartTime)}`,
                          icon: "warning"
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
                    Break Start Time * (Schedule: {formatTimeDisplay(breakStartTime)})
                  </label>
                  <input
                    type="time"
                    name="morning_time_out"
                    value={formData.morning_time_out}
                    onChange={(e) => {
                      if (validateTimeInput(e.target.value, 'break_start')) {
                        handleChange(e);
                      } else {
                        Swal.fire({
                          title: "Invalid Time",
                          text: `Time must match your schedule time: ${formatTimeDisplay(breakStartTime)}`,
                          icon: "warning"
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
                    End Break Time * (Schedule: {formatTimeDisplay(breakEndTime)})
                  </label>
                  <input
                    type="time"
                    name="afternoon_time_in"
                    value={formData.afternoon_time_in}
                    onChange={(e) => {
                      if (validateTimeInput(e.target.value, 'break_end')) {
                        handleChange(e);
                      } else {
                        Swal.fire({
                          title: "Invalid Time",
                          text: `Time must match your schedule time: ${formatTimeDisplay(breakEndTime)}`,
                          icon: "warning"
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
                    Shift End Time * (Schedule: {formatTimeDisplay(scheduleEndTime)})
                  </label>
                  <input
                    type="time"
                    name="afternoon_time_out"
                    value={formData.afternoon_time_out}
                    onChange={(e) => {
                      if (validateTimeInput(e.target.value, 'end')) {
                        handleChange(e);
                      } else {
                        Swal.fire({
                          title: "Invalid Time",
                          text: `Time must match your schedule time: ${formatTimeDisplay(scheduleEndTime)}`,
                          icon: "warning"
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

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium py-2">
                  Purpose *{" "}
                </label>
                <textarea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  placeholder="e.g. Time Tracking"
                  className="textarea textarea-bordered w-full"
                  required
                ></textarea>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium py-2">
                  Remarks (Optional)
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Additional comments"
                  className="textarea textarea-bordered w-full"
                ></textarea>
              </div>

              <div>
                <span className="block text-sm font-medium py-2">Upload Image *</span>
              </div>
              <div className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition duration-300 cursor-pointer bg-gray-50">
                <label
                  htmlFor="fileUpload"
                  className="flex flex-col items-center justify-center w-full text-gray-700 text-sm font-medium cursor-pointer"
                >
                  Supporting Document *
                  <svg
                    className="w-10 h-10 text-gray-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 16V10a4 4 0 018 0v6M5 16h14M12 8v8"
                    ></path>
                  </svg>
                  <span className="text-gray-600">
                    Click or drag a file to upload
                  </span>
                  <span className="text-xs text-gray-500">
                    Only images are allowed (JPG, PNG, GIF)
                  </span>
                </label>
                <input
                  id="fileUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
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
