import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Swal from "sweetalert2";
import "react-calendar/dist/Calendar.css";
import axios from "axios";

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

const WorkSchedule = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [employeeDepartment, setEmployeeDepartment] = useState("");
  const [timeRecords, setTimeRecords] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const navigate = useNavigate();

  const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:5000";

  useEffect(() => {
    document.title = "Work Schedule";
    const authToken = sessionStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employeeDepartment") || "Unknown";
    const employeeId = localStorage.getItem("employeeId");

    console.log("First Name:", firstName, "Employee Id:", employeeId);
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

    const fetchSchedules = async () => {
      try {
        const response = await axios.get(`${APIBase_URL}/api/schedule/employee/${employeeId}`);
        setSchedules(response.data || []);
      } catch (error) {
        console.error("Error fetching schedules:", error);
      }
    };

    if (employeeId) {
      fetchSchedules();
    }
  }, [navigate]);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

 

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

  return (
    <div className="flex">
      <EmployeeSidebar
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
        } relative bg-gray-50`}
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

        <div className="transition-all duration-300 ease-in-out p-6">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Work Schedule</h1>
            <p className="text-gray-600">Manage and view your working hours</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Working Days</h3>
                  <p className="text-xl font-semibold text-gray-800">{schedules.length > 0 && schedules[0].days ? schedules[0].days.length : 0} days</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Department</h3>
                  <p className="text-xl font-semibold text-gray-800">{employeeDepartment}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Employee Name</h3>
                  <p className="text-xl font-semibold text-gray-800">{`${employeeFirstName} ${employeeLastName}`}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Schedule Details</h2>
              {schedules.length > 0 && schedules[0].days ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {schedules.map((schedule) =>
                        schedule.days.map((day, index) => (
                          <tr key={`${schedule._id}-${index}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{day}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.startTime}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.endTime}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No schedule found</h3>
                  <p className="mt-1 text-sm text-gray-500">No work schedule has been assigned yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkSchedule;
