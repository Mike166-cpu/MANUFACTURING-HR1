import React, { useEffect, useState } from "react";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import { useNavigate } from "react-router-dom";
import BreadCrumbs from "../../Components/BreadCrumb";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
const Local = "http://localhost:7685";

const EmployeeSchedule = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "employee_id",
    direction: "ascending",
  });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    days: [],
    startTime: "08:00",
    endTime: "17:00",
  });
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const response = await fetch(`${APIBASE_URL}/api/employee`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setEmployees(data);
        } else if (data.employees) {
          // In case the data is wrapped in an object
          setEmployees(data.employees);
        } else {
          throw new Error("Invalid data format received");
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        Swal.fire({
          title: "Error",
          text: "Failed to fetch employee data. Please try again later.",
          icon: "error",
          confirmButtonText: "OK",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []); // Empty dependency array ✅

  useEffect(() => {
    document.title = "Employee Schedule";

    const token = localStorage.getItem("adminToken");
    if (!token) {
      // Show SweetAlert if not logged in
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

  useEffect(() => {
    // Extract unique departments from employees
    const uniqueDepartments = [
      ...new Set(employees.map((emp) => emp.employee_department)),
    ];
    setDepartments(uniqueDepartments);
  }, [employees]);

  const filteredEmployees = employees.filter(
    (employee) =>
      selectedDepartment === "all" ||
      employee.employee_department === selectedDepartment
  );

  const getSortedData = () => {
    const sortedData = [...filteredEmployees];
    sortedData.sort((a, b) => {
      if (!a[sortConfig.key]) return 1;
      if (!b[sortConfig.key]) return -1;

      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
    return sortedData;
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [newHireData, setNewHireData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    jobTitle: "",
    startDate: "",
    department: "",
    supervisor: "",
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleChange = (e) => {
    setNewHireData({ ...newHireData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add logic to handle the form submission
    console.log("New Hire Data Submitted:", newHireData);
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

  const sortData = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const SortIndicator = ({ column }) => {
    if (sortConfig.key !== column) {
      return <span className="ml-1 text-gray-400">↕</span>;
    }
    return (
      <span className="ml-1">
        {sortConfig.direction === "ascending" ? "↑" : "↓"}
      </span>
    );
  };

  const fetchSchedules = async (employeeId) => {
    try {
      const response = await fetch(`${APIBASE_URL}/api/schedule/${employeeId}`);
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const handleRowClick = (employee) => {
    setSelectedEmployee(employee);
    fetchSchedules(employee._id);
  };

  const handleBackClick = () => {
    setSelectedEmployee(null);
    setSchedules([]);
  };

  const handleScheduleChange = (e) => {
    const { name, value } = e.target;
    if (name === "days") {
      const selectedDays = [...newSchedule.days];
      if (selectedDays.includes(value)) {
        setNewSchedule({
          ...newSchedule,
          days: selectedDays.filter((day) => day !== value),
        });
      } else {
        setNewSchedule({ ...newSchedule, days: [...selectedDays, value] });
      }
    } else {
      setNewSchedule({ ...newSchedule, [name]: value });
    }
  };

  const handleEditClick = (schedule) => {
    setEditingSchedule(schedule);
    setIsModalOpen(true);
    setNewSchedule({
      days: schedule.days,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    });
  };

  const handleCancelEdit = () => {
    setEditingSchedule(null);
    setNewSchedule({ days: [], startTime: "08:00", endTime: "17:00" });
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!editingSchedule && schedules.length > 0) {
        Swal.fire({
          title: "Schedule Exists",
          text: "This employee already has a schedule. Please update the existing one.",
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      }

      const scheduleData = {
        ...newSchedule,
        employeeId: selectedEmployee._id,
        employee_id: selectedEmployee.employee_id,
        first_name: selectedEmployee.employee_firstname,
        last_name: selectedEmployee.employee_lastname,
      };

      const url = editingSchedule
        ? `${APIBASE_URL}/api/schedule/${editingSchedule._id}`
        : `${APIBASE_URL}/api/schedule`;

      const method = editingSchedule ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      });

      if (response.ok) {
        fetchSchedules(selectedEmployee._id);
        setNewSchedule({ days: [], startTime: "08:00", endTime: "17:00" });
        setEditingSchedule(null);
        setIsModalOpen(false);
        Swal.fire({
          title: "Success",
          text: `Schedule ${
            editingSchedule ? "updated" : "created"
          } successfully`,
          icon: "success",
          confirmButtonText: "OK",
        });
      } else {
        throw new Error(
          `Failed to ${editingSchedule ? "update" : "create"} schedule`
        );
      }
    } catch (error) {
      console.error(
        `Error ${editingSchedule ? "updating" : "creating"} schedule:`,
        error
      );
      Swal.fire({
        title: "Error",
        text: `Failed to ${editingSchedule ? "update" : "create"} schedule`,
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const response = await fetch(`${Local}/api/schedule/${scheduleId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          fetchSchedules(selectedEmployee._id);
          Swal.fire("Deleted!", "Schedule has been deleted.", "success");
        } else {
          throw new Error("Failed to delete schedule");
        }
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to delete schedule",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const printScheduleAsPDF = () => {
    const doc = new jsPDF();

    // Add title and header
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.text("Employee Schedule", 105, 20, { align: "center" });

    // Add employee details
    doc.setFontSize(12);
    doc.setTextColor(52, 73, 94);
    doc.text(
      `Employee: ${selectedEmployee.employee_firstname} ${selectedEmployee.employee_lastname}`,
      20,
      35
    );
    doc.text(`Department: ${selectedEmployee.employee_department}`, 20, 42);
    doc.text(`ID: ${selectedEmployee.employee_id}`, 20, 49);

    // Current date
    const currentDate = new Date().toLocaleDateString();
    doc.text(`Generated on: ${currentDate}`, 20, 56);

    // Prepare schedule data
    let tableData = [];
    schedules.forEach((schedule) => {
      schedule.days.forEach((day) => {
        tableData.push([day, schedule.startTime, schedule.endTime]);
      });
    });

    // Sort days in correct order
    const dayOrder = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7,
    };

    tableData.sort((a, b) => dayOrder[a[0]] - dayOrder[b[0]]);

    // Add table
    doc.autoTable({
      startY: 65,
      head: [["Day", "Start Time", "End Time"]],
      body: tableData,
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 12,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 11,
        halign: "center",
        textColor: 50,
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249],
      },
      columnStyles: {
        0: { fontStyle: "bold" },
      },
      margin: { top: 20 },
      styles: {
        cellPadding: 5,
        fontSize: 10,
        valign: "middle",
        overflow: "linebreak",
        lineWidth: 0.1,
      },
      theme: "grid",
    });

    // Save the PDF
    doc.save(
      `${selectedEmployee.employee_firstname}_${selectedEmployee.employee_lastname}_Schedule.pdf`
    );
  };

  const openModal = () => {
    setIsModalOpen(true);
    setNewSchedule({ days: [], startTime: "08:00", endTime: "17:00" });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewSchedule({ days: [], startTime: "08:00", endTime: "17:00" });
  };

  return (
    <div className="bg-gray-100 min-h-screen">
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
              {" "}
              Set Employee Schedule
            </span>
          </div>

          {/* MAIN CONTENT */}
          <div className="p-8 max-w-7xl mx-auto">
            {selectedEmployee ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleBackClick}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg shadow-sm hover:bg-blue-50 transition-colors duration-200"
                  >
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Back
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Schedule for{" "}
                    <span className="text-blue-600 capitalize">
                      {selectedEmployee.employee_firstname}
                    </span>
                  </h2>
                  <button
                    onClick={printScheduleAsPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors duration-200"
                  >
                    Print as PDF
                  </button>
                </div>

                {schedules.length > 0 ? (
                  <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="card-title text-lg">Current Schedule</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                          <thead>
                            <tr>
                              <th>Days</th>
                              <th>Start Time</th>
                              <th>End Time</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {schedules.map((schedule) => (
                              <tr key={schedule._id}>
                                <td>{schedule.days.join(", ")}</td>
                                <td>{schedule.startTime}</td>
                                <td>{schedule.endTime}</td>
                                <td className="space-x-2">
                                  <button
                                    onClick={() => handleEditClick(schedule)}
                                    className="btn btn-sm btn-primary"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteSchedule(schedule._id)
                                    }
                                    className="btn btn-sm btn-error"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card bg-base-100 shadow-xl">
                    <div className="card-body text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="text-gray-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-16 w-16 mx-auto mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <h3 className="text-xl font-semibold mb-2">
                            No Schedule Found
                          </h3>
                          <p className="text-gray-600 mb-4">
                            This employee doesn't have any schedule yet.
                          </p>
                        </div>
                        <button onClick={openModal} className="btn btn-primary">
                          Create New Schedule
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Modal */}
                {isModalOpen && (
                  <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                      <div
                        className="fixed inset-0 transition-opacity"
                        aria-hidden="true"
                      >
                        <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                      </div>

                      <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                        <form
                          onSubmit={handleScheduleSubmit}
                          className="bg-white"
                        >
                          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                              {editingSchedule
                                ? "Edit Schedule"
                                : "Create New Schedule"}
                            </h3>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Select Working Days
                                </label>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                  {[
                                    "Monday",
                                    "Tuesday",
                                    "Wednesday",
                                    "Thursday",
                                    "Friday",
                                    "Saturday",
                                    "Sunday",
                                  ].map((day) => (
                                    <label
                                      key={day}
                                      className="inline-flex items-center"
                                    >
                                      <input
                                        type="checkbox"
                                        name="days"
                                        value={day}
                                        checked={newSchedule.days.includes(day)}
                                        onChange={handleScheduleChange}
                                        className="checkbox checkbox-primary"
                                      />
                                      <span className="ml-2">{day}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Time
                                  </label>
                                  <input
                                    type="time"
                                    name="startTime"
                                    value={newSchedule.startTime}
                                    disabled
                                    className="input input-bordered w-full"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Time
                                  </label>
                                  <input
                                    type="time"
                                    name="endTime"
                                    value={newSchedule.endTime}
                                    disabled
                                    className="input input-bordered w-full"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                              type="submit"
                              className="btn btn-primary w-full sm:w-auto sm:ml-3"
                            >
                              {editingSchedule
                                ? "Update Schedule"
                                : "Create Schedule"}
                            </button>
                            <button
                              type="button"
                              onClick={closeModal}
                              className="mt-3 sm:mt-0 btn btn-ghost w-full sm:w-auto"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="relative">
                    <select
                      className="appearance-none bg-white px-4 py-2 pr-8 border rounded-lg shadow-sm 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                      <option value="all">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
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
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="min-w-full overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => sortData("employee_id")}
                          >
                            ID <SortIndicator column="employee_id" />
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => sortData("employee_firstname")}
                          >
                            Name <SortIndicator column="employee_firstname" />
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => sortData("employee_email")}
                          >
                            Email <SortIndicator column="employee_email" />
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => sortData("employee_department")}
                          >
                            Department{" "}
                            <SortIndicator column="employee_department" />
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-4 text-center">
                              <div className="flex justify-center items-center space-x-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                <span>Loading...</span>
                              </div>
                            </td>
                          </tr>
                        ) : filteredEmployees.length === 0 ? (
                          <tr>
                            <td
                              colSpan="4"
                              className="px-6 py-4 text-center text-gray-500"
                            >
                              No employees found
                            </td>
                          </tr>
                        ) : (
                          getSortedData().map((employee, index) => (
                            <tr
                              key={employee.employee_id || `employee-${index}`}
                              className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                              onClick={() => handleRowClick(employee)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {employee.employee_id || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                {employee.employee_firstname || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {employee.employee_email || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {employee.employee_department || "N/A"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* END OF MAIN CONTENT */}
        </div>
      </div>
    </div>
  );
};

export default EmployeeSchedule;
