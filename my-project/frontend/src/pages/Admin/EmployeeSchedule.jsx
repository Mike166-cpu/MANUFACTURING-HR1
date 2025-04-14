import React, { useEffect, useState } from "react";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import { useNavigate } from "react-router-dom";
import BreadCrumbs from "../../Components/BreadCrumb";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { IoFilter } from "react-icons/io5";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPrint } from "react-icons/fa";
import { MdEdit, MdVisibility } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";

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

const APIBASE_URL = "https://backend-hr1.jjm-manufacturing.com";
const LOCAL = "http://localhost:7685";

const EmployeeSchedule = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    document.title = "Employee Schedule";

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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleResize = () => {
    setIsSidebarOpen(window.innerWidth >= 768);
  };

  useEffect(() => {
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  //fetch Schedules
  const [schedules, setSchedules] = useState([]);

  // Modify the schedules fetch to be a function we can reuse
  const fetchSchedules = async () => {
    try {
      const response = await axios.get(`${LOCAL}/api/schedule/all-schedules`);
      setSchedules(response.data);
      console.log("Fetched Schedules:", response.data);
      return response.data; // Return the data for immediate use
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Failed to fetch schedules");
      return [];
    }
  };

  // Use the function in useEffect
  useEffect(() => {
    fetchSchedules();
  }, []);

  const [schedule, setSchedule] = useState([]);
  useEffect(() => {
    const fetchShiftSchedule = async () => {
      try {
        const response = await axios.get(`${LOCAL}/api/schedule/fetch-shift`);
        setSchedule(response.data);
        console.log("Shifting Schedule", response.data);
      } catch (error) {
        console.error("Error fetching shift schedule:", error);
      }
    };
    fetchShiftSchedule();
  }, []);

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedScheduleForView, setSelectedScheduleForView] = useState(null);
  const [showScheduleDetail, setShowScheduleDetail] = useState(false);
  const [selectedEmployeeSchedule, setSelectedEmployeeSchedule] =
    useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(`${LOCAL}/api/onboarding/employee`);
        setEmployees(response.data);
        console.log("Fetched Employees:", response.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();
  }, []);

  const handleAssignShift = (employee) => {
    setSelectedEmployee(employee);
    setShowAssignModal(true);
  };

  const handleEditSchedule = (schedule) => {
    setSelectedEmployee(schedule.employeeId);
    setSelectedShift(schedule.shiftType);
    setEditMode(true);
    setSelectedSchedule(schedule);
    setShowAssignModal(true);
  };

  const handleViewSchedule = async (employee) => {
    try {
      setLoading(true);
      setError(null);

      const [scheduleResponse, shiftsResponse] = await Promise.all([
        axios.get(`${LOCAL}/api/schedule/view-schedule/${employee.employeeId}`),
        axios.get(`${LOCAL}/api/schedule/fetch-shift`),
      ]);

      if (scheduleResponse.data.success) {
        const scheduleData = scheduleResponse.data.schedule;
        const shifts = shiftsResponse.data;

        // Find the matching shift
        const matchingShift = shifts.find(
          (s) => s._id === scheduleData.shiftType
        );

        setSelectedEmployeeSchedule({
          ...scheduleData,
          employee: employee,
          shiftType: matchingShift?._id || scheduleData.shiftType,
        });
        setShowScheduleDetail(true);
      } else {
        toast.error("Could not find schedule for this employee");
      }
    } catch (error) {
      console.error("Error viewing schedule:", error);
      toast.error("Failed to view schedule");
      setError("Failed to view schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setShowScheduleDetail(false);
    setSelectedEmployeeSchedule(null);
  };

  // Modify handleUpdateSchedule to fetch fresh data
  const handleUpdateSchedule = async (employee) => {
    try {
      console.log("Updating schedule for employee:", employee);

      // Get both schedule and shifts data
      const [scheduleResponse, shiftsResponse] = await Promise.all([
        axios.get(`${LOCAL}/api/schedule/view-schedule/${employee.employeeId}`),
        axios.get(`${LOCAL}/api/schedule/fetch-shift`),
      ]);

      console.log("Schedule response:", scheduleResponse.data);
      console.log("Shifts response:", shiftsResponse.data);

      if (!scheduleResponse.data.success) {
        toast.error("No schedule found for this employee");
        return;
      }

      const existingSchedule = scheduleResponse.data.schedule;
      const shifts = shiftsResponse.data;

      // Find the matching shift
      const matchingShift = shifts.find(
        (s) => s._id === existingSchedule.shiftType
      );

      console.log("Found matching shift:", matchingShift);

      setSelectedEmployee(employee);
      setSelectedShift(matchingShift?._id || "");
      setEditMode(true);
      setSelectedSchedule(existingSchedule);
      setShowAssignModal(true);
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error("Failed to update schedule");
    }
  };

  const handleShiftAssignment = async () => {
    if (!selectedEmployee || !selectedShift) {
      toast.error("Please select both an employee and a shift");
      return;
    }

    try {
      const selectedShiftData = schedule.find((s) => s._id === selectedShift);
      console.log("Selected shift data:", selectedShiftData);

      if (!selectedShiftData) {
        throw new Error("Invalid shift selected");
      }

      // Get the correct employee data format
      const employeeData =
        typeof selectedEmployee === "object"
          ? selectedEmployee
          : schedules.find((s) => s.employeeId === selectedEmployee);

      if (!employeeData) {
        console.error("Employee data:", selectedEmployee);
        throw new Error("Invalid employee data");
      }

      const assignmentData = {
        employeeId: employeeData.employeeId,
        firstName:
          employeeData.firstName || employeeData.fullname?.split(" ")[0],
        lastName:
          employeeData.lastName || employeeData.fullname?.split(" ")[1] || "",
        email: employeeData.email,
        department: employeeData.department,
        role: employeeData.role || employeeData.position || "Employee",
        days: selectedShiftData.days,
        startTime: selectedShiftData.startTime,
        endTime: selectedShiftData.endTime,
        shiftType: selectedShift, // This is the shift _id
        shiftname: selectedShiftData.name,
        breakStart: selectedShiftData.breakStart || null,
        breakEnd: selectedShiftData.breakEnd || null,
        flexibleStartTime: selectedShiftData.flexibleStartTime || null,
        flexibleEndTime: selectedShiftData.flexibleEndTime || null,
      };

      console.log("Sending assignment data:", assignmentData);

      let response;
      if (editMode && selectedSchedule?._id) {
        response = await axios.put(
          `${LOCAL}/api/schedule/${selectedSchedule._id}`,
          assignmentData
        );
      } else {
        response = await axios.post(
          `${LOCAL}/api/schedule/assign`,
          assignmentData
        );
      }

      if (response.data.success) {
        toast.success(
          editMode
            ? "Schedule updated successfully"
            : "Schedule assigned successfully"
        );
        await fetchSchedules(); // Refresh the schedules list
        setShowAssignModal(false);
        setEditMode(false);
        setSelectedSchedule(null);
      } else {
        throw new Error(response.data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Shift assignment error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to process schedule"
      );
    }
  };

  const handlePrintSchedule = () => {
    if (!selectedScheduleForView) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Employee Schedule Details", 20, 20);

    const shift = schedule.find(
      (s) => s._id === selectedScheduleForView.shiftType
    );

    const scheduleData = [
      ["Employee ID", selectedScheduleForView.employeeId],
      [
        "Name",
        `${selectedScheduleForView.firstName} ${selectedScheduleForView.lastName}`,
      ],
      ["Position", selectedScheduleForView.department],
      ["Role", selectedScheduleForView.role],
      ["Email", selectedScheduleForView.email],
      ["Working Days", selectedScheduleForView.days.join(", ")],
      ["Start Time", selectedScheduleForView.startTime],
      ["End Time", selectedScheduleForView.endTime],
      ["Shift Type", shift?.shiftType || "N/A"],
    ];

    if (shift?.breakStart && shift?.breakEnd) {
      scheduleData.push([
        "Break Time",
        `${shift.breakStart} - ${shift.breakEnd}`,
      ]);
    }

    doc.autoTable({
      startY: 30,
      head: [["Field", "Details"]],
      body: scheduleData,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`schedule-${selectedScheduleForView.employeeId}.pdf`);
  };

  const tableContent = (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg">
        <thead className="bg-blue-600 text-white">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Employee ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Full Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {employees.map((employee) => (
            <tr key={employee.employeeId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                {employee.employeeId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {employee.fullname}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {employee.department}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{employee.email}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAssignShift(employee)}
                    className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-2 px-3 rounded inline-flex items-center"
                  >
                    Assign
                  </button>
                  <button
                    onClick={() => handleViewSchedule(employee)}
                    className="bg-purple-500 hover:bg-purple-700 text-white text-sm font-bold py-2 px-3 rounded inline-flex items-center"
                  >
                    <MdVisibility className="mr-1" /> View
                  </button>
                  {schedules.find(
                    (s) => s.employeeId === employee.employeeId
                  ) && (
                    <button
                      onClick={() =>
                        handleEditSchedule(
                          schedules.find(
                            (s) => s.employeeId === employee.employeeId
                          )
                        )
                      }
                      className="bg-green-500 hover:bg-green-700 text-white text-sm font-bold py-2 px-3 rounded inline-flex items-center"
                    >
                      <MdEdit className="mr-1" /> Edit
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <div className="text-center py-4">Loading...</div>}
      {error && <div className="text-red-500 text-center py-4">{error}</div>}
    </div>
  );

  const viewScheduleModal = showViewModal && selectedScheduleForView && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Schedule Details</h2>
          <div className="flex space-x-2">
            <button
              onClick={handlePrintSchedule}
              className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
            >
              <FaPrint className="mr-2" /> Print
            </button>
            <button
              onClick={() => setShowViewModal(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">Employee Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <p>
                <span className="font-semibold">ID:</span>{" "}
                {selectedScheduleForView.employeeId}
              </p>
              <p>
                <span className="font-semibold">Name:</span>{" "}
                {`${selectedScheduleForView.firstName} ${selectedScheduleForView.lastName}`}
              </p>
              <p>
                <span className="font-semibold">Department:</span>{" "}
                {selectedScheduleForView.department}
              </p>
              <p>
                <span className="font-semibold">Role:</span>{" "}
                {selectedScheduleForView.role}
              </p>
              <p>
                <span className="font-semibold">Email:</span>{" "}
                {selectedScheduleForView.email}
              </p>
            </div>
          </div>
          <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">Schedule Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <p>
                <span className="font-semibold">Working Days:</span>{" "}
                {selectedScheduleForView.days.join(", ")}
              </p>
              <p>
                <span className="font-semibold">Shift Type:</span>{" "}
                {selectedScheduleForView.shiftname}
              </p>
              <p>
                <span className="font-semibold">Start Time:</span>{" "}
                {selectedScheduleForView.startTime}
              </p>
              <p>
                <span className="font-semibold">End Time:</span>{" "}
                {selectedScheduleForView.endTime}
              </p>
              {selectedScheduleForView.breakStart && (
                <p>
                  <span className="font-semibold">Break Time:</span>{" "}
                  {`${selectedScheduleForView.breakStart} - ${selectedScheduleForView.breakEnd}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ScheduleDetailView = () => {
    if (loading) {
      return (
        <div className="text-center py-4">Loading schedule details...</div>
      );
    }

    if (error) {
      return <div className="text-red-500 text-center py-4">{error}</div>;
    }

    if (!selectedEmployeeSchedule) {
      return <div className="text-center py-4">No schedule found</div>;
    }

    // Create weekly schedule data if it doesn't exist
    const weekDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const weeklySchedule = weekDays.map((day) => ({
      day,
      isWorking: selectedEmployeeSchedule.days.includes(day),
      startTime: selectedEmployeeSchedule.days.includes(day)
        ? selectedEmployeeSchedule.startTime
        : null,
      endTime: selectedEmployeeSchedule.days.includes(day)
        ? selectedEmployeeSchedule.endTime
        : null,
      breakStart: selectedEmployeeSchedule.days.includes(day)
        ? selectedEmployeeSchedule.breakStart
        : null,
      breakEnd: selectedEmployeeSchedule.days.includes(day)
        ? selectedEmployeeSchedule.breakEnd
        : null,
    }));

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <button
            onClick={handleBackToList}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <IoArrowBack className="mr-2" /> Back to Employee List
          </button>
          <div className="flex space-x-3">
            <button
              onClick={() => handleUpdateSchedule(selectedEmployeeSchedule)}
              className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
            >
              <MdEdit className="mr-2" /> Update Schedule
            </button>
            <button
              onClick={handlePrintSchedule}
              className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
            >
              <FaPrint className="mr-2" /> Print Schedule
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3 text-gray-800">
                Employee Information
              </h3>
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Employee ID:</span>{" "}
                  {selectedEmployeeSchedule.employeeId}
                </p>
                <p>
                  <span className="font-semibold">Name:</span>{" "}
                  {`${selectedEmployeeSchedule.firstName} ${selectedEmployeeSchedule.lastName}`}
                </p>
                <p>
                  <span className="font-semibold">Department:</span>{" "}
                  {selectedEmployeeSchedule.department}
                </p>
                <p>
                  <span className="font-semibold">Role:</span>{" "}
                  {selectedEmployeeSchedule.role}
                </p>
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  {selectedEmployeeSchedule.email}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3 text-gray-800">
                Schedule Summary
              </h3>
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Shift Type:</span>{" "}
                  {selectedEmployeeSchedule.shiftname}
                </p>
                <p>
                  <span className="font-semibold">Working Hours:</span>{" "}
                  {new Date(
                    `1970-01-01T${selectedEmployeeSchedule.startTime}`
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}{" "}
                  -{" "}
                  {new Date(
                    `1970-01-01T${selectedEmployeeSchedule.endTime}`
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
                {selectedEmployeeSchedule.breakStart && (
                  <p>
                    <span className="font-semibold">Break Time:</span>{" "}
                    {selectedEmployeeSchedule.breakStart &&
                    selectedEmployeeSchedule.breakEnd
                      ? `${new Date(
                          `1970-01-01T${selectedEmployeeSchedule.breakStart}`
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })} - ${new Date(
                          `1970-01-01T${selectedEmployeeSchedule.breakEnd}`
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}`
                      : "No break"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Weekly Schedule</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-500">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider rounded-tl-lg">
                      Day
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Start Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      End Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider rounded-tr-lg">
                      Break Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {weeklySchedule.map((day) => (
                    <tr key={day.day} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {day.day}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            day.isWorking
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {day.isWorking ? 'Work Day' : 'Day Off'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {day.isWorking
                          ? new Date(`1970-01-01T${day.startTime}`).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {day.isWorking
                          ? new Date(`1970-01-01T${day.endTime}`).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {day.isWorking && day.breakStart
                          ? `${new Date(`1970-01-01T${day.breakStart}`).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })} - ${new Date(`1970-01-01T${day.breakEnd}`).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div
          className={`flex-grow transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
          }`}
        >
          <Navbar toggleSidebar={toggleSidebar} />
          {isSidebarOpen && isMobileView && (
            <div
              className="fixed inset-0 bg-black opacity-50 z-10"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* BREADCRUMBS */}
          <div className="bg-white pb-4 px-5">
            <BreadCrumbs />
            <span className="px-4 font-bold text-2xl">
              {showScheduleDetail
                ? "Employee Schedule Details"
                : "Set Employee Schedule"}
            </span>
          </div>

          {/* MAIN CONTENT */}
          <div className="p-6">
            {showScheduleDetail && selectedEmployeeSchedule ? (
              <ScheduleDetailView />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="overflow-x-auto">{tableContent}</div>
              </div>
            )}
          </div>

          {/* Assignment Modal */}
          {showAssignModal && selectedEmployee && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 border-b pb-3">
                  {editMode ? "Edit Schedule for" : "Assign Shift to"}{" "}
                  <span className="text-blue-600">
                    {selectedEmployee.fullname}
                  </span>
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Shift Schedule
                    </label>
                    <select
                      className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={selectedShift}
                      onChange={(e) => setSelectedShift(e.target.value)}
                    >
                      <option value="">Choose a shift schedule</option>
                      {schedule.map((shift) => (
                        <option key={shift._id} value={shift._id}>
                          {shift.name || "Unnamed Shift"} -{" "}
                          {shift.days.join(", ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedShift && (
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      {(() => {
                        const shift = schedule.find(
                          (s) => s._id === selectedShift
                        );
                        if (!shift) return null;
                        return (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <h3 className="font-semibold text-lg mb-3 text-blue-600">
                                {shift.name || "Shift Details"}
                              </h3>
                            </div>
                            <div className="space-y-3">
                              <p className="flex items-center">
                                <span className="font-medium text-gray-600 w-32">
                                  Shift Type:
                                </span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                  {shift.shiftType || "Regular"}
                                </span>
                              </p>
                              <p className="flex items-center">
                                <span className="font-medium text-gray-600 w-32">
                                  Working Hours:
                                </span>
                                <span className="text-gray-800">
                                  {shift.startTime} - {shift.endTime}
                                </span>
                              </p>
                              {shift.breakStart && shift.breakEnd && (
                                <p className="flex items-center">
                                  <span className="font-medium text-gray-600 w-32">
                                    Break Time:
                                  </span>
                                  <span className="text-gray-800">
                                    {shift.breakStart} - {shift.breakEnd}
                                  </span>
                                </p>
                              )}
                            </div>
                            <div className="space-y-3">
                              <p className="flex items-start">
                                <span className="font-medium text-gray-600 w-32">
                                  Working Days:
                                </span>
                                <span className="text-gray-800 flex flex-wrap gap-1">
                                  {shift.days.map((day) => (
                                    <span
                                      key={day}
                                      className="px-2 py-1 bg-gray-200 rounded-full text-sm"
                                    >
                                      {day}
                                    </span>
                                  ))}
                                </span>
                              </p>
                              {shift.shiftType === "Flexible" && (
                                <p className="flex items-center">
                                  <span className="font-medium text-gray-600 w-32">
                                    Flexible Hours:
                                  </span>
                                  <span className="text-gray-800">
                                    {shift.flexibleStartTime} -{" "}
                                    {shift.flexibleEndTime}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => setShowAssignModal(false)}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleShiftAssignment}
                      disabled={!selectedShift}
                      className={`px-6 py-2 rounded-lg text-white transition-all ${
                        selectedShift
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-blue-300 cursor-not-allowed"
                      }`}
                    >
                      {editMode ? "Update Schedule" : "Assign Schedule"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* END OF MAIN CONTENT */}
          {viewScheduleModal}
        </div>
      </div>
    </div>
  );
};

export default EmployeeSchedule;
