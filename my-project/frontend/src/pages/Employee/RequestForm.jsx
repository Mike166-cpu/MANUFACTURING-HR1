import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Swal from "sweetalert2";

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
  const authToken = localStorage.getItem("employeeToken");
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";

  useEffect(() => {
    document.title = "Request Form";
    const authToken = localStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employeeDepartment") || "Unknown";
    const username = localStorage.getItem("employeeUsername") || "";
    const employeeId = localStorage.getItem("employeeId") || "";

   

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
      employee_username: username,
      employee_id: employeeId,
    }));
  }, [navigate]);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const [formData, setFormData] = useState({
    employee_username: "",
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
    const pastWeek = new Date();
    pastWeek.setDate(today.getDate() - 7);
    pastWeek.setHours(0, 0, 0, 0); // Start of the day 7 days ago

    return selectedDate >= pastWeek && selectedDate <= today;
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

    if (!isValidDate(formData.date)) {
      Swal.fire({
        title: "Invalid Date",
        text: "Please select a date within the past 7 days up to today",
        icon: "error",
      });
      return;
    }

    // Calculate work duration
    let workDuration = 0;
    if (formData.morning_time_in && formData.morning_time_out) {
      const morningStart = new Date(
        `${formData.date}T${formData.morning_time_in}:00`
      );
      const morningEnd = new Date(
        `${formData.date}T${formData.morning_time_out}:00`
      );
      workDuration += (morningEnd - morningStart) / 1000; // Duration in seconds
    }
    if (formData.afternoon_time_in && formData.afternoon_time_out) {
      const afternoonStart = new Date(
        `${formData.date}T${formData.afternoon_time_in}:00`
      );
      const afternoonEnd = new Date(
        `${formData.date}T${formData.afternoon_time_out}:00`
      );
      workDuration += (afternoonEnd - afternoonStart) / 1000; // Duration in seconds
    }

    // Calculate overtime duration
    let overtimeDuration = 0;
    if (formData.overtime_start && formData.overtime_end) {
      const overtimeStart = new Date(
        `${formData.date}T${formData.overtime_start}:00`
      );
      const overtimeEnd = new Date(
        `${formData.date}T${formData.overtime_end}:00`
      );
      overtimeDuration = (overtimeEnd - overtimeStart) / 1000; // Duration in seconds
    }

    try {
      const response = await axios.post(
        `${APIBASED_URL}/api/ob/request`,
        {
          employee_username: formData.employee_username,
          employee_id: formData.employee_id,
          time_in: new Date(
            `${formData.date}T${formData.morning_time_in}:00`
          ).toISOString(), // Convert to date-time string
          time_out: new Date(
            `${formData.date}T${formData.afternoon_time_out}:00`
          ).toISOString(), // Convert to date-time string
          date: new Date(formData.date).toISOString(),
          purpose: formData.purpose,
          remarks: formData.remarks,
          entry_type: formData.entry_type,
          work_duration: workDuration, // Add this field
          overtime_duration: overtimeDuration, // Add this field
        },
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
          text: "OB Request Submitted Successfully",
          icon: "success",
        }).then(() => {
          navigate("/request-form"); // Make sure this route exists
        });
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Handle unauthorized access
        Swal.fire({
          title: "Session Expired",
          text: "Your session has expired. Please login again.",
          icon: "warning",
        }).then(() => {
          navigate("/employeelogin");
        });
      } else {
        // Handle other errors
        Swal.fire({
          title: "Error",
          text: "Failed to submit OB request",
          icon: "error",
        });
        console.error("Error submitting request:", error);
      }
    }
  };
  const fetchManualEntries = async () => {
    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/ob/manual-entries/${employeeId}`
      );
      console.log("Manual Entries:", response.data);
    } catch (error) {
      console.error("Error fetching manual entries", error);
    }
  };

  useEffect(() => {
    console.log("Employee ID:", employeeId); // Debugging
    if (employeeId) {
      fetchManualEntries();
    }
  }, [employeeId]);
  
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
        {/* MAIN CONTENT */}
        <div className="transition-all duration-300 ease-in-out flex-grow p-5">
          <h2 className="text-2xl font-bold mb-4">
            Official Business (OB) Request
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employee Username - Read Only */}
            <div>
              <label className="block text-sm font-medium">
                Employee Username
              </label>
              <input
                type="text"
                name="employee_username"
                value={formData.employee_username}
                className="input input-bordered w-full bg-gray-100"
                readOnly
              />
            </div>

            {/* Employee ID - Read Only */}
            <div>
              <label className="block text-sm font-medium">Employee ID</label>
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
                min={getMinDate()}
                max={getMaxDate()}
                required
              />
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

            {/* Submit Button */}
            <button type="submit" className="btn btn-primary w-full">
              Submit Request
            </button>
          </form>
        </div>
        {/* END OF MAIN CONTENT */}
      </div>
    </div>
  );
};

export default RequestForm;
