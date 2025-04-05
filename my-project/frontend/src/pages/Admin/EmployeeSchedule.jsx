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
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPrint } from 'react-icons/fa';
import { MdEdit, MdVisibility } from 'react-icons/md';
import { IoArrowBack } from 'react-icons/io5';

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
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await axios.get(`${LOCAL}/api/schedule/all-schedules`);
        setSchedules(response.data);
        console.log("Fetched Schedules:", response.data);
      } catch (error) {
        console.error("Error fetching schedules:", error);
      }
    };

    fetchSchedules();
  }, []);

  const [schedule, setSchedule] = useState([]);
  useEffect(() => {
    const fetchShiftSchedule = async () => {
      try {
        const response = await axios.get(`${LOCAL}/api/schedule/fetch-shift`);
        setSchedule(response.data);
        console.log("Shifting Schedule",response.data);
      } catch (error) {
        console.error("Error fetching shift schedule:", error);
      }
    };
    fetchShiftSchedule();
  }, []);

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedScheduleForView, setSelectedScheduleForView] = useState(null);
  const [showScheduleDetail, setShowScheduleDetail] = useState(false);
  const [selectedEmployeeSchedule, setSelectedEmployeeSchedule] = useState(null);
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
      
      console.log("Viewing schedule for employee:", employee.employeeId);
      const response = await axios.get(`${LOCAL}/api/schedule/view-schedule/${employee.employeeId}`);
      
      if (response.data.success) {
        setSelectedEmployeeSchedule({
          ...response.data.schedule,
          employee: employee
        });
        setShowScheduleDetail(true);
      } else {
        toast.error('Could not find schedule for this employee');
      }
    } catch (error) {
      console.error('Error viewing schedule:', error);
      toast.error(error.response?.data?.message || 'Failed to view schedule');
      setError(error.response?.data?.message || 'Failed to view schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setShowScheduleDetail(false);
    setSelectedEmployeeSchedule(null);
  };

  const handleUpdateSchedule = (employee) => {
    const schedule = schedules.find(s => s.employeeId === employee.employeeId);
    setSelectedEmployee(employee);
    setSelectedShift(schedule.shiftType);
    setEditMode(true);
    setSelectedSchedule(schedule);
    setShowAssignModal(true);
  };

  const handleShiftAssignment = async () => {
    if (!selectedEmployee || !selectedShift) {
      toast.error('Please select both an employee and a shift');
      return;
    }

    try {
      const selectedShiftData = schedule.find(s => s._id === selectedShift);
      
      if (!selectedShiftData) {
        throw new Error('Invalid shift selected');
      }

      const assignmentData = {
        employeeId: selectedEmployee.employeeId,
        firstName: selectedEmployee.fullname.split(' ')[0],
        lastName: selectedEmployee.fullname.split(' ')[1] || '',
        email: selectedEmployee.email,
        department: selectedEmployee.department, 
        role: selectedEmployee.role,
        days: selectedShiftData.days,
        startTime: selectedShiftData.startTime,
        endTime: selectedShiftData.endTime,
        shiftType: selectedShiftData.shiftType,
        shiftname: selectedShiftData.name,
        breakStart: selectedShiftData.breakStart || null,
        breakEnd: selectedShiftData.breakEnd || null,
        flexibleStartTime: selectedShiftData.flexibleStartTime || null,
        flexibleEndTime: selectedShiftData.flexibleEndTime || null,
      };

      console.log('Sending assignment data:', assignmentData); // Debug log
      
      let response;
      if (editMode && selectedSchedule) {
        response = await axios.put(`${LOCAL}/api/schedule/${selectedSchedule._id}`, assignmentData);
        toast.success('Schedule updated successfully');
      } else {
        response = await axios.post(`${LOCAL}/api/schedule/assign`, assignmentData);
        toast.success('Schedule assigned successfully');
      }

      setShowAssignModal(false);
      setEditMode(false);
      setSelectedSchedule(null);

      // Refresh the schedules list
      const updatedSchedules = await axios.get(`${LOCAL}/api/schedule/all-schedules`);
      setSchedules(updatedSchedules.data);
    } catch (error) {
      console.error('Shift assignment error:', error);
      toast.error(error.response?.data?.message || 'Failed to process schedule');
    }
  };

  const handlePrintSchedule = () => {
    if (!selectedScheduleForView) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Employee Schedule Details", 20, 20);

    const shift = schedule.find(s => s._id === selectedScheduleForView.shiftType);
    
    const scheduleData = [
      ["Employee ID", selectedScheduleForView.employeeId],
      ["Name", `${selectedScheduleForView.firstName} ${selectedScheduleForView.lastName}`],
      ["Position", selectedScheduleForView.department],
      ["Role", selectedScheduleForView.role],
      ["Email", selectedScheduleForView.email],
      ["Working Days", selectedScheduleForView.days.join(", ")],
      ["Start Time", selectedScheduleForView.startTime],
      ["End Time", selectedScheduleForView.endTime],
      ["Shift Type", shift?.shiftType || "N/A"],
    ];

    if (shift?.breakStart && shift?.breakEnd) {
      scheduleData.push(["Break Time", `${shift.breakStart} - ${shift.breakEnd}`]);
    }

    doc.autoTable({
      startY: 30,
      head: [["Field", "Details"]],
      body: scheduleData,
      theme: 'grid',
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
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Employee ID</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Full Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Department</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {employees.map((employee) => (
            <tr key={employee.employeeId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">{employee.employeeId}</td>
              <td className="px-6 py-4 whitespace-nowrap">{employee.fullname}</td>
              <td className="px-6 py-4 whitespace-nowrap">{employee.department}</td>
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
                  {schedules.find(s => s.employeeId === employee.employeeId) && (
                    <button
                      onClick={() => handleEditSchedule(schedules.find(s => s.employeeId === employee.employeeId))}
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

  const viewScheduleModal = (
    showViewModal && selectedScheduleForView && (
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
                <p><span className="font-semibold">ID:</span> {selectedScheduleForView.employeeId}</p>
                <p><span className="font-semibold">Name:</span> {`${selectedScheduleForView.firstName} ${selectedScheduleForView.lastName}`}</p>
                <p><span className="font-semibold">Department:</span> {selectedScheduleForView.department}</p>
                <p><span className="font-semibold">Role:</span> {selectedScheduleForView.role}</p>
                <p><span className="font-semibold">Email:</span> {selectedScheduleForView.email}</p>
              </div>
            </div>
            <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-2">Schedule Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <p><span className="font-semibold">Working Days:</span> {selectedScheduleForView.days.join(", ")}</p>
                <p><span className="font-semibold">Shift Type:</span> {selectedScheduleForView.shiftname}</p>
                <p><span className="font-semibold">Start Time:</span> {selectedScheduleForView.startTime}</p>
                <p><span className="font-semibold">End Time:</span> {selectedScheduleForView.endTime}</p>
                {selectedScheduleForView.breakStart && (
                  <p><span className="font-semibold">Break Time:</span> {`${selectedScheduleForView.breakStart} - ${selectedScheduleForView.breakEnd}`}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const ScheduleDetailView = () => {
    if (loading) {
      return <div className="text-center py-4">Loading schedule details...</div>;
    }

    if (error) {
      return <div className="text-red-500 text-center py-4">{error}</div>;
    }

    if (!selectedEmployeeSchedule) {
      return <div className="text-center py-4">No schedule found</div>;
    }

    // Create weekly schedule data if it doesn't exist
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weeklySchedule = weekDays.map(day => ({
      day,
      isWorking: selectedEmployeeSchedule.days.includes(day),
      startTime: selectedEmployeeSchedule.days.includes(day) ? selectedEmployeeSchedule.startTime : null,
      endTime: selectedEmployeeSchedule.days.includes(day) ? selectedEmployeeSchedule.endTime : null,
      breakStart: selectedEmployeeSchedule.days.includes(day) ? selectedEmployeeSchedule.breakStart : null,
      breakEnd: selectedEmployeeSchedule.days.includes(day) ? selectedEmployeeSchedule.breakEnd : null,
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
              <h3 className="font-bold text-lg mb-3 text-gray-800">Employee Information</h3>
              <div className="space-y-2">
                <p><span className="font-semibold">Employee ID:</span> {selectedEmployeeSchedule.employeeId}</p>
                <p><span className="font-semibold">Name:</span> {`${selectedEmployeeSchedule.firstName} ${selectedEmployeeSchedule.lastName}`}</p>
                <p><span className="font-semibold">Department:</span> {selectedEmployeeSchedule.department}</p>
                <p><span className="font-semibold">Role:</span> {selectedEmployeeSchedule.role}</p>
                <p><span className="font-semibold">Email:</span> {selectedEmployeeSchedule.email}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3 text-gray-800">Schedule Summary</h3>
              <div className="space-y-2">
                <p><span className="font-semibold">Shift Type:</span> {selectedEmployeeSchedule.shiftname}</p>
                <p><span className="font-semibold">Working Hours:</span> {selectedEmployeeSchedule.startTime} - {selectedEmployeeSchedule.endTime}</p>
                {selectedEmployeeSchedule.breakStart && (
                  <p><span className="font-semibold">Break Time:</span> {`${selectedEmployeeSchedule.breakStart} - ${selectedEmployeeSchedule.breakEnd}`}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Weekly Schedule</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2">Day</th>
                    <th className="border border-gray-200 px-4 py-2">Status</th>
                    <th className="border border-gray-200 px-4 py-2">Start Time</th>
                    <th className="border border-gray-200 px-4 py-2">End Time</th>
                    <th className="border border-gray-200 px-4 py-2">Break Time</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklySchedule.map((day) => (
                    <tr key={day.day}>
                      <td className="border border-gray-200 px-4 py-2">{day.day}</td>
                      <td className="border border-gray-200 px-4 py-2">
                        <span className={`font-semibold ${day.isWorking ? 'text-green-600' : 'text-red-600'}`}>
                          {day.isWorking ? 'Work Day' : 'Day Off'}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {day.isWorking ? day.startTime : '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {day.isWorking ? day.endTime : '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {day.isWorking && day.breakStart ? 
                          `${day.breakStart} - ${day.breakEnd}` : '-'}
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
              {showScheduleDetail ? 'Employee Schedule Details' : 'Set Employee Schedule'}
            </span>
          </div>

          {/* MAIN CONTENT */}
          <div className="p-6">
            {showScheduleDetail && selectedEmployeeSchedule ? (
              <ScheduleDetailView />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="overflow-x-auto">
                  {tableContent}
                </div>
              </div>
            )}
          </div>

          {/* Assignment Modal */}
          {showAssignModal && selectedEmployee && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-96">
                <h2 className="text-xl font-bold mb-4">
                  {editMode ? 'Edit Schedule for' : 'Assign Shift to'} {selectedEmployee.fullname}
                </h2>
                <div className="space-y-4">
                  <select 
                    className="w-full p-2 border rounded"
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value)}
                  >
                    <option key="default" value="">Select a shift</option>
                    {schedule.map((shift) => (
                      <option key={shift._id} value={shift._id}>
                        {shift.name} ({shift.shiftType}) - {shift.days.join(", ")} 
                        ({shift.startTime} - {shift.endTime})
                      </option>
                    ))}
                  </select>
                  {selectedShift && (
                    <div className="text-sm text-gray-600">
                      {(() => {
                        const shift = schedule.find(s => s._id === selectedShift);
                        if (!shift) return null;
                        return (
                          <div className="space-y-2">
                            <p><strong>Shift Type:</strong> {shift.shiftType}</p>
                            <p><strong>Working Days:</strong> {shift.days.join(", ")}</p>
                            <p><strong>Timings:</strong> {shift.startTime} - {shift.endTime}</p>
                            {shift.breakStart && shift.breakEnd && (
                              <p><strong>Break Time:</strong> {shift.breakStart} - {shift.breakEnd}</p>
                            )}
                            {shift.shiftType === 'Flexible' && (
                              <p><strong>Flexible Hours:</strong> {shift.flexibleStartTime} - {shift.flexibleEndTime}</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowAssignModal(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleShiftAssignment}
                      disabled={!selectedShift}
                      className={`px-4 py-2 rounded text-white ${
                        selectedShift ? 'bg-blue-500 hover:bg-blue-700' : 'bg-blue-300'
                      }`}
                    >
                      Assign
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
