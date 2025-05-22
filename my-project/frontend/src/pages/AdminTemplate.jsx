import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const LOCAL = "http://localhost:7685";
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";


  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const adminToken = localStorage.getItem("adminToken");
  const gatewayToken = localStorage.getItem("gatewayToken");

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

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // MAIN FUNCTION

  const [shiftType, setShiftType] = useState("Fixed");
  const [shiftData, setShiftData] = useState({
    name: "",
    days: [], // Array to hold selected days
    startTime: "",
    endTime: "",
    breakStart: "",  // Initialize break times for all shift types
    breakEnd: "",
    flexibleStartTime: "",
    flexibleEndTime: "",
  });

  // Handle shift type change
  const handleShiftTypeChange = (e) => {
    setShiftType(e.target.value);
    setShiftData({
      ...shiftData,
      days: [], // Reset days when shift type changes
      startTime: "",
      endTime: "",
      breakStart: "",
      breakEnd: "",
      flexibleStartTime: "",
      flexibleEndTime: "",
    });
  };

  const handleChange = (e) => {
    setShiftData({
      ...shiftData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle multiple day selection
  const handleDaySelection = (e) => {
    const selectedDay = e.target.value;
    const isChecked = e.target.checked;

    setShiftData((prevData) => {
      let newDays = [...prevData.days];
      if (isChecked) {
        newDays.push(selectedDay);
      } else {
        newDays = newDays.filter((day) => day !== selectedDay);
      }
      return { ...prevData, days: newDays };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (shiftData.days.length === 0) {
      toast.error("Please select at least one day for the shift.");
      return;
    }

    try {
      const shiftPayload = {
        ...shiftData,
        shiftType: shiftType // Add shiftType to the payload
      };

      const response = await axios.post(
        `${APIBASED_URL}/api/schedule/create-shift`,
        shiftPayload
      );
      toast.success("Shift created successfully!");
      setShiftData({
        name: "",
        days: [],
        startTime: "",
        endTime: "",
        breakStart: "",
        breakEnd: "",
        flexibleStartTime: "",
        flexibleEndTime: "",
      });
      setShiftType("Fixed"); // Reset shift type
    } catch (error) {
      toast.error(error.response?.data?.error || "Error creating shift");
      console.error("Error creating shift:", error);
    }
  };

  //delete shift
  const handleDeleteShift = async (id) => {
    try {
      await axios.delete(`${APIBASED_URL}/api/schedule/delete-shift/${id}`);
      toast.success("Shift deleted successfully!");
      fetchShifts();
    } catch (error) {
      console.error(
        "Error deleting shift:",
        error.response?.data || error.message
      );
      toast.error("Failed to delete shift!");
    }
  };

  //format time
  const formatTime = (time) => {
    if (!time) return "";

    const [hour, minute] = time.split(":").map(Number);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12; // Convert 0 to 12 for AM format

    return `${formattedHour}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  //create modal
  const [modalOpen, setModalOpen] = useState(false);
  const toggleModal = () => {
    setModalOpen(!modalOpen);

    // Reset form only when creating a new shift
    if (!modalOpen) {
      setIsEditing(false);
      setCurrentShiftId(null);
      setShiftData({ name: "", day: "Monday", startTime: "", endTime: "" });
    }
  };

  //edit modal
  const [isEditing, setIsEditing] = useState(false);
  const [currentShiftId, setCurrentShiftId] = useState(null);

  const openEditModal = (shift) => {
    if (!shift || !shift._id) {
      console.error("Invalid shift object:", shift);
      return;
    }

    console.log("Editing Shift:", shift);

    setIsEditing(true);
    setCurrentShiftId(shift._id);
    setShiftData({
      name: shift.name || "",
      day: shift.day || "Monday",
      startTime: shift.startTime || "",
      endTime: shift.endTime || "",
    });
    setModalOpen(true);
  };

  // Add this helper function before the return statement
  const isNightShift = () => {
    if (!shiftData.startTime || !shiftData.endTime) return false;
    const [startHour, startMin] = shiftData.startTime.split(":").map(Number);
    const [endHour, endMin] = shiftData.endTime.split(":").map(Number);
    return (
      endHour < startHour ||
      (endHour === startHour && endMin < startMin)
    );
  };

  return (
    <div className="flex min-h-screen bg-base-200">
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

        <div className="container mx-auto p-6">
          <ToastContainer position="top-right" autoClose={3000} />
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Create Shift Schedule</h2>

              {/* Night shift hint */}
              {isNightShift() && (
                <div className="alert alert-info mb-4 text-sm">
                  <span>
                    <b>Night Shift Detected:</b> This shift crosses midnight. Employees scheduled on <b>{shiftData.days.join(", ")}</b> will be able to time in from <b>{shiftData.startTime}</b> until <b>{shiftData.endTime}</b> the next day. For example, if you select "Monday", employees can time in on Monday night and after midnight (early Tuesday morning).
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Shift Name */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold capitalize">Shift Name</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={shiftData.name}
                    onChange={handleChange}
                    className="input input-bordered w-full capitalize"
                    required
                  />
                </div>

                {/* Shift Type Selection */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Shift Type</span>
                  </label>
                  <select
                    value={shiftType}
                    onChange={handleShiftTypeChange}
                    className="select select-bordered w-full"
                  >
                    <option value="Fixed">Fixed Shift</option>
                    <option value="Rotating">Rotating Shift</option>
                    <option value="Split">Split Shift</option>
                    <option value="Flexible">Flexible Shift</option>
                  </select>
                </div>

                {/* Multiple Days Selection - Now available for all shift types */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Select Days</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                      <label key={day} className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          value={day}
                          onChange={handleDaySelection}
                          checked={shiftData.days.includes(day)}
                          className="checkbox checkbox-primary"
                        />
                        <span className="label-text">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Start and End Times */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Start Time</span>
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={shiftData.startTime}
                      onChange={handleChange}
                      className="input input-bordered"
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">End Time</span>
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={shiftData.endTime}
                      onChange={handleChange}
                      className="input input-bordered"
                      required
                    />
                  </div>
                </div>

                {/* Break Times (for all shifts) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Break Start Time</span>
                    </label>
                    <input
                      type="time"
                      name="breakStart"
                      value={shiftData.breakStart}
                      onChange={handleChange}
                      className="input input-bordered"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Break End Time</span>
                    </label>
                    <input
                      type="time"
                      name="breakEnd"
                      value={shiftData.breakEnd}
                      onChange={handleChange}
                      className="input input-bordered"
                    />
                  </div>
                </div>

                {/* Flexible Shift Times */}
                {shiftType === "Flexible" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Flexible Start Time</span>
                      </label>
                      <input
                        type="time"
                        name="flexibleStartTime"
                        value={shiftData.flexibleStartTime}
                        onChange={handleChange}
                        className="input input-bordered"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Flexible End Time</span>
                      </label>
                      <input
                        type="time"
                        name="flexibleEndTime"
                        value={shiftData.flexibleEndTime}
                        onChange={handleChange}
                        className="input input-bordered"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="card-actions justify-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Create Shift
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

export default Dashboard;
