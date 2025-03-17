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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showGuide, setShowGuide] = useState(() => {
    return localStorage.getItem("hideManualEntryGuide") !== "true";
  });
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [leaveType, setLeaveType] = useState("Sick Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [employeeDepartment, setEmployeeDepartment] = useState("");
  const [employeeUsername, setEmployeeUsername] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const navigate = useNavigate();
  const [proofFile, setProofFile] = useState(null);

  const authToken = localStorage.getItem("employeeToken");
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  useEffect(() => {
    document.title = "Request Form";
    const authToken = localStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
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
      setEmployeeFirstName(firstName);
      setEmployeeLastName(lastName);
      setEmployeeDepartment(department);
      setEmployeeUsername(username);
    }

    // Pre-fill form data with user information
    setFormData((prevData) => ({
      ...prevData,
      employee_id: employeeId,
      employee_firstname: firstName,
      employee_lastname: lastName,
      position: position,
    }));
  }, [navigate]);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const [formData, setFormData] = useState({
    position: "",
    empoyee_firstname: "",
    employee_lastname: "",
    employee_id: "",
    date: new Date().toISOString().split("T")[0],
    morning_time_in: "08:00", // Default morning start time
    morning_time_out: "12:00", // Default morning end time
    afternoon_time_in: "13:00", // Default afternoon start time
    afternoon_time_out: "17:00",
    overtime_start: "",
    overtime_end: "",
    purpose: "",
    remarks: "",
    status: "pending",
    break_duration: 0,
    label: "OB",
    entry_type: "Manual Entry", // Add this field
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isValidDate = (dateString) => {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return selectedDate <= today; // Allows past and present dates only
  };

  const getMinDate = () => {
    const pastWeek = new Date();
    pastWeek.setDate(pastWeek.getDate() - 7);
    return pastWeek.toISOString().split("T")[0];
  };

  const createDateTime = (date, time) => {
    return new Date(`${date}T${time}:00`).toISOString();
  };

  const getMaxDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  //FUNCTION FOR POST METHOD
  const handleSubmit = async (e) => {
    e.preventDefault();

    const authToken = localStorage.getItem("employeeToken");
    if (!authToken) {
      Swal.fire({
        title: "Session Expired",
        text: "Your session has expired. Please login again.",
        icon: "warning",
      }).then(() => {
        navigate("/employeelogin");
      });
      return;
    }

    const selectedDate = new Date(formData.date);
    const today = new Date();
    if (selectedDate > today) {
      Swal.fire({
        title: "Invalid Date",
        text: "You cannot submit requests for future dates",
        icon: "warning",
      });
      return;
    }

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
        return; // Stop further execution
      }
    } catch (error) {
      console.error("Error checking duplicate:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to verify existing entries. Please try again.",
        icon: "error",
      });
      return;
    }

    const todayDate = new Date().toISOString().split("T")[0];

    let workDuration = 0;
    let overtimeHours = 0;

    if (formData.morning_time_in && formData.morning_time_out) {
      const morningStart = new Date(
        `${formData.date}T${formData.morning_time_in}`
      );
      const morningEnd = new Date(
        `${formData.date}T${formData.morning_time_out}`
      );
      workDuration += (morningEnd - morningStart) / (1000 * 60 * 60);
    }

    if (formData.afternoon_time_in && formData.afternoon_time_out) {
      const afternoonStart = new Date(
        `${formData.date}T${formData.afternoon_time_in}`
      );
      const afternoonEnd = new Date(
        `${formData.date}T${formData.afternoon_time_out}`
      );
      workDuration += (afternoonEnd - afternoonStart) / (1000 * 60 * 60);
    }

    if (formData.overtime_start && formData.overtime_end) {
      const overtimeStart = new Date(
        `${formData.date}T${formData.overtime_start}`
      );
      const overtimeEnd = new Date(`${formData.date}T${formData.overtime_end}`);
      overtimeHours = (overtimeEnd - overtimeStart) / (1000 * 60 * 60);
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
        console.log("File uploaded successfully:", uploadedFileUrl);
      } catch (uploadError) {
        console.error("File upload error:", uploadError);
        Swal.fire({
          title: "Upload Failed",
          text: "Could not upload the file.",
          icon: "error",
        });
        return;
      }
    }

    // Prepare request data
    const requestData = {
      employee_id: formData.employee_id,
      position: formData.position,
      employee_firstname: formData.employee_firstname,
      employee_lastname: formData.employee_lastname,
      time_in: new Date(`${formData.date}T${formData.morning_time_in}`),
      time_out: new Date(`${formData.date}T${formData.afternoon_time_out}`),
      total_hours: workDuration,
      overtime_hours: overtimeHours,
      status: "pending",
      remarks: formData.remarks,
      purpose: formData.purpose,
      entry_type: "Manual Entry",
      file_url: uploadedFileUrl,
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

      if (response.status === 201) {
        Swal.fire({
          title: "Success",
          text: response.data.is_holiday
            ? "Manual time entry submitted successfully. Note: This was recorded on a holiday."
            : "Manual time entry submitted successfully.",
          icon: "success",
        }).then(() => {
          navigate("/request-form");
        });
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        Swal.fire({
          title: "Invalid Request",
          text: error.response.data.message || "Failed to submit request",
          icon: "error",
        });
      } else {
        Swal.fire({
          title: "Error",
          text: "Failed to submit manual entry. Please try again.",
          icon: "error",
        });
        console.error("Error submitting request:", error);
      }
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

  //FETCH DATA
  const fetchManualEntries = async () => {
    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/ob/requests/${employeeId}`
      );
      console.log("Manual Entries:", response.data);
    } catch (error) {
      console.error("Error fetching manual entries", error);
    }
  };

  //FETCH EMPLOYEE SCHEDULE
  const [schedules, setSchedules] = useState([]);
  const [validDates, setValidDates] = useState([]);

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

  useEffect(() => {
    document.title = "Work Schedule";
    const authToken = localStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employeeDepartment") || "Unknown";
    const employeeId = localStorage.getItem("employeeId");

    const fetchSchedules = async () => {
      try {
        // Updated API endpoint
        const response = await axios.get(
          `${APIBASED_URL}/api/schedule/findByEmployeeId/${employeeId}`
        );
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
        <div className="p-8 bg-gray-100">
          <div className="transition-all duration-300 ease-in-out flex-grow p-8 bg-white rounded-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium">
                    Employee Username
                  </label>
                  <input
                    type="text"
                    name="employee_username"
                    value={`${formData.employee_firstname} ${formData.employee_lastname}`}
                    className="input input-bordered w-full bg-gray-100"
                    readOnly
                  />
                </div>

                {/* Employee ID - Read Only */}
                <div>
                  <label className="block text-sm font-medium">
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
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium">Date</label>
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
                      const isValidWorkday = validDates.some(
                        (date) =>
                          date.toISOString().split("T")[0] === e.target.value
                      );

                      if (!isValidWorkday) {
                        Swal.fire({
                          title: "Invalid Day Schedule",
                          text: "Please select a date from your work schedule",
                          icon: "warning",
                        });
                        e.target.value = formData.date; // Reset to previous valid date
                      }
                    }}
                  />
                </div>
              </div>

              {/* Morning Time In & Time Out */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">
                    Morning Start Time
                  </label>
                  <input
                    type="time"
                    name="morning_time_in"
                    value={formData.morning_time_in}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Morning End Time
                  </label>
                  <input
                    type="time"
                    name="morning_time_out"
                    value={formData.morning_time_out}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
              </div>

              {/* Afternoon Time In & Time Out */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">
                    Afternoon Start Time
                  </label>
                  <input
                    type="time"
                    name="afternoon_time_in"
                    value={formData.afternoon_time_in}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Afternoon End Time
                  </label>
                  <input
                    type="time"
                    name="afternoon_time_out"
                    value={formData.afternoon_time_out}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
              </div>

              {/* Overtime Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">
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
                  <label className="block text-sm font-medium">
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
                <label className="block text-sm font-medium">Purpose</label>
                <textarea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  placeholder="Enter reason for OB"
                  className="textarea textarea-bordered w-full"
                  required
                ></textarea>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium">
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
                <label className="block text-sm font-medium">
                  Upload Proof
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>

              {/* Submit Button */}
              <button type="submit" className="btn btn-primary w-full">
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
