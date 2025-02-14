import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegUserCircle } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { MdLogout } from "react-icons/md";
import { IoNotificationsOutline } from "react-icons/io5";
import useIdleLogout from "../hooks/useIdleLogout";
import { io } from "socket.io-client";
import { GiHamburgerMenu } from "react-icons/gi";

const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const [initials, setInitials] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [incidentReports, setIncidentReports] = useState([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(
    JSON.parse(localStorage.getItem("hasNewNotifications")) || false // Retrieve initial value from localStorage
  );
  const navigate = useNavigate();
  const firstName = localStorage.getItem("firstName");
  const lastName = localStorage.getItem("lastName");
  const userRole = localStorage.getItem("role");

  //useIdleLogout(1800000);

  useEffect(() => {
    const firstName = localStorage.getItem("firstName");
    const lastName = localStorage.getItem("lastName");
    const userRole = localStorage.getItem("role");

    if (firstName && lastName) {
      const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
      setInitials(initials);
    }
  }, []);

  const APIBased_URL = "https://backend-hr1.jjm-manufacturing.com";

  // useEffect(() => {
  //   const socket = io("https://backend-hr1.jjm-manufacturing.com");

  //   const fetchIncidentReports = async () => {
  //     try {
  //       const response = await fetch(`${APIBased_URL}/api/incidentreport`);
  //       const data = await response.json();
  //       setIncidentReports(data);
  //     } catch (error) {
  //       console.error("Error fetching incident reports:", error);
  //     }
  //   };

  //   fetchIncidentReports();

  //   socket.on("newIncidentReport", (data) => {
  //     setIncidentReports((prevReports) => [data.report, ...prevReports]);
  //     setHasNewNotifications(true);
  //     localStorage.setItem("hasNewNotifications", JSON.stringify(true));
  //   });

  //   return () => {
  //     socket.off("newIncidentReport");
  //   };
  // }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("hasNewNotifications");
    navigate("/login", { replace: true });
  };

  const handleToggleNotifications = () => {
    setShowNotifications((prev) => !prev);

    if (!showNotifications) {
      setHasNewNotifications(false);
      localStorage.setItem("hasNewNotifications", JSON.stringify(false));
    }
  };

  return (
    <div
      className={`navbar bg-white sticky dark:bg-gray-800 dark:text-white top-0 z-10 transition-all duration-300 shadow-md ${
        isSidebarOpen ? "md:ml-72" : "ml-0"
      }`}
    >
      <div className="flex-none">
        <button className="btn btn-circle text-black" onClick={toggleSidebar}>
          <GiHamburgerMenu size={24} />
        </button>
      </div>

      <div className="flex-none ml-auto flex items-center gap-2">
        <div className="dropdown dropdown-end">
          <button
            onClick={handleToggleNotifications}
            className="btn btn-ghost btn-circle"
          >
            <div className="indicator">
              <IoNotificationsOutline size={24} />
              {hasNewNotifications && (
                <span className="badge badge-sm indicator-item bg-red-600 rounded-full"></span>
              )}
            </div>
          </button>
          {showNotifications && (
            <ul
              className="menu dropdown-content bg-base-100 dark:bg-gray-800 rounded-lg shadow-lg z-[1] mt-3 w-64 p-2"
              style={{ width: "300px" }}
            >
              <li className="p-3 font-medium text-xl text-gray-800 dark:text-white">
                Incident Reports
              </li>
              <hr />
              {incidentReports.length === 0 ? (
                <li className="text-sm text-gray-500">No new reports</li>
              ) : (
                <div className="flex flex-col h-48 overflow-auto w-full">
                  {incidentReports.slice(0, 5).map((report, index) => {
                    const createdAt = new Date(report.date);
                    return (
                      <li
                        key={index}
                        className="flex items-start bg-white dark:bg-gray-700"
                      >
                        <div className="flex-1 hover:bg-transparent">
                          <span className="text-md font-md text-gray-800 dark:text-white">
                            {report.employeeUsername}: Filed a report
                          </span>
                        </div>
                        <div className="flex-1 hover:bg-transparent">
                          <span className="text-xs font-md text-gray-400 dark:text-white -mt-4">
                            {report.reportType}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </div>
              )}
            </ul>
          )}
        </div>

        <div className="dropdown dropdown-end relative">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar relative"
          >
            <div className="w-10 h-10 rounded-full bg-[#FF76CE] flex items-center justify-center text-white text-lg font-normal p-[4px]">
              {initials}
            </div>
            {/* Green dot */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 rounded-full"></span>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
          >
            <li>
              <a onClick={handleLogout} className="text-red-600">
                <MdLogout size={"18px"} />
                Logout
              </a>
            </li>
          </ul>
        </div>

        <div>
          <span className="text-xs font-medium">
            {firstName} <br />
            <span className="block text-gray-400 capitalize">{userRole}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
