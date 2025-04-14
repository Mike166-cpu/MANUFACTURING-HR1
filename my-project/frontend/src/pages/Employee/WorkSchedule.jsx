import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Swal from "sweetalert2";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
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
  const LOCAL = "http://localhost:7685";

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
          `${APIBase_URL}/api/schedule/findByEmployeeId/${employeeId}`
        );
        console.log("Schedule data received:", response.data);
        setSchedules(
          Array.isArray(response.data) ? response.data : [response.data]
        );
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

        <div className="p-5 shadow-sm">
          <Breadcrumbs />
          <div className="px-5">
            {" "}
            <h1 className="text-2xl font-bold text-gray-800">Work Schedule</h1>
            <p className="text-gray-600">Manage and view your working hours</p>
          </div>
        </div>

        <div className="transition-all duration-300 ease-in-out p-6 bg-slate-100 min-h-screen">
          <div className="mb-8"></div>

          {/* Schedule Table */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6"></div>
            {schedules.length > 0 && schedules[0].days ? (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <p className="flex items-center">
                        <span className="font-medium text-gray-600 w-32">
                          Shift Type:
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {schedules[0].shiftname || "Regular"}
                        </span>
                      </p>
                      <p className="flex items-center">
                        <span className="font-medium text-gray-600 w-32">
                          Working Hours:
                        </span>
                        <span className="text-gray-800">
                          {new Date(
                            `1970-01-01T${schedules[0].startTime}`
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                          {" - "}
                          {new Date(
                            `1970-01-01T${schedules[0].endTime}`
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </p>
                      {schedules[0].breakStart && (
                        <p className="flex items-center">
                          <span className="font-medium text-gray-600 w-32">
                            Break Time:
                          </span>
                          <span className="text-gray-800">
                            {new Date(`2000-01-01T${schedules[0].breakStart}`).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })} - {new Date(`2000-01-01T${schedules[0].breakEnd}`).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

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
                      {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday",
                      ].map((day) => {
                        const isWorkDay = schedules[0].days.includes(day);
                        return (
                          <tr
                            key={day}
                            className="hover:bg-gray-50 transition-colors duration-200"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {day}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  isWorkDay
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {isWorkDay ? "Work Day" : "Off Day"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {isWorkDay ? (
                                new Date(`2000-01-01T${schedules[0].startTime}`).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })
                              ) : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {isWorkDay ? (
                                new Date(`2000-01-01T${schedules[0].endTime}`).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })
                              ) : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {isWorkDay && schedules[0].breakStart && schedules[0].breakEnd ? (
                                `${new Date(`2000-01-01T${schedules[0].breakStart}`).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })} - ${new Date(`2000-01-01T${schedules[0].breakStart}`).getHours() + 1}:${new Date(`2000-01-01T${schedules[0].breakStart}`).getMinutes().toString().padStart(2, '0')} ${new Date(`2000-01-01T${schedules[0].breakStart}`).getHours() < 11 ? 'AM' : 'PM'}`
                              ) : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No schedule found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  No work schedule has been assigned yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkSchedule;
