import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import { useNavigate } from "react-router-dom";

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

const AttendanceTime = () => {
  const isMobileView = useMediaQuery("(max-width: 768px)");
  useEffect(() => {
    document.title = "Attendance and Time Tracking";
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navigate = useNavigate();
  useEffect(() => {
    const token = sessionStorage.getItem("adminToken");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const [timeRecords, setTimeRecords] = useState([]);

  const APIBased_URL = "https://backend-hr1.jjm-manufacturing.com";

  useEffect(() => {
    const fetchAllTimeTrackingRecords = async () => {
      try {
        const response = await fetch(
          `${APIBased_URL}/api/employee/time-tracking`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch all time tracking records");
        }
        const data = await response.json();
        setTimeRecords(data);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message,
        });
      }
    };

    fetchAllTimeTrackingRecords();
  }, []);

  const formatTime = (time) => {
    const date = new Date(time);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatTotalHours = (seconds) => {
    const hours = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${hours}:${minutes}:${secs}`;
  };

  const groupRecordsByDate = (records) => {
    const groupedRecords = {};
    records.forEach((record) => {
      const date = new Date(record.time_in);
      const dateString = date.toLocaleDateString();
      if (!groupedRecords[dateString]) {
        groupedRecords[dateString] = [];
      }
      groupedRecords[dateString].push(record);
    });
    return groupedRecords;
  };

  const groupedRecords = groupRecordsByDate(timeRecords);

  const sortedDates = Object.keys(groupedRecords).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  const formatDateForDisplay = (date) => {
    const today = new Date();
    const recordDate = new Date(date);

    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    const formattedDate = recordDate.toLocaleDateString(undefined, options);

    if (recordDate.toDateString() === today.toDateString()) {
      return "Today";
    }

    return formattedDate;
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

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex">
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

        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Admin Records</h2>

          {sortedDates.length > 0 ? (
            sortedDates.map((date, index) => (
              <div key={index} className="mb-6">
                <h3 className="text-sm font-normal p-2 mb-2 bg-gray-100 border rounded-lg">
                  {formatDateForDisplay(date)}
                </h3>
                <table className="min-w-full bg-white border border-gray-300 mb-4 text-left">
                  <thead>
                    <tr>
                      <th className="border-b font-normal border-gray-300 px-4 py-2 text-sm">
                        Employee Name
                      </th>
                      <th className="border-b font-normal border-gray-300 px-4 py-2 text-sm">
                        Time In
                      </th>
                      <th className="border-b font-normal border-gray-300 px-4 py-2 text-sm">
                        Time Out
                      </th>
                      <th className="border-b font-normal border-gray-300 px-4 py-2 text-sm">
                        Total Hours
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedRecords[date]
                      .sort((a, b) => new Date(b.time_in) - new Date(a.time_in))
                      .map((record, index) => (
                        <tr key={index} className="text-sm">
                          <td className="border-b border-gray-300 px-4 py-2">
                            {record.employee_firstname}{" "}
                            {record.employee_lastname}
                          </td>
                          <td className="border-b border-gray-300 px-4 py-2">
                            {formatTime(record.time_in)}
                          </td>
                          <td className="border-b border-gray-300 px-4 py-2">
                            {record.time_out
                              ? formatTime(record.time_out)
                              : "N/A"}
                          </td>
                          <td className="border-b border-gray-300 px-4 py-2">
                            {record.total_hours
                              ? formatTotalHours(record.total_hours)
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <p className="text-center">No records found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceTime;
