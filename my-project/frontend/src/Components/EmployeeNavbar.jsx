import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CiMenuBurger } from "react-icons/ci";
import { TfiDashboard } from "react-icons/tfi";
import { FaRegUserCircle } from "react-icons/fa";
import { FaRegBell } from "react-icons/fa";
import { FaRegUser } from "react-icons/fa6";
import { TbReportAnalytics } from "react-icons/tb";
import { MdOutlinePolicy } from "react-icons/md";

const EmployeeNavbar = ({ onSidebarToggle, isSidebarOpen }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeFirstName, setEmployeeFirstName] = useState(""); // State for first name
  const [employeeLastName, setEmployeeLastName] = useState(""); // State for last name
  const dropdownRef = useRef(null);

  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString(); // Format time as HH:MM:SS AM/PM
      setCurrentTime(formattedTime);
    };

    updateTime(); // Initial call to set the time immediately
    const intervalId = setInterval(updateTime, 1000); // Update time every second

    return () => clearInterval(intervalId); // Cleanup the interval on component unmount
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev); // Toggle dropdown state
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/employeelogin");
  };

  // Close dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch employee details from local storage when component mounts
  useEffect(() => {
    const email = localStorage.getItem("employeeEmail");
    const firstName = localStorage.getItem("employeeFirstName");
    const lastName = localStorage.getItem("employeeLastName");
    if (email) {
      setEmployeeEmail(email);
    }
    if (firstName) {
      setEmployeeFirstName(firstName);
    }
    if (lastName) {
      setEmployeeLastName(lastName);
    }
  }, []);

  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-blue-900 shadow-lg transform overflow-y-auto ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-20`}
      >
        <div className="pt-4">
          <div className="flex justify-end items-center gap-x-4">
            <FaRegBell className="w-6 h-6 text-white" />
            <div className="dropdown dropdown-end" ref={dropdownRef}>
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
                onClick={toggleDropdown}
              >
                <div className="rounded-full">
                  <FaRegUserCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              {isDropdownOpen && (
                <ul
                  tabIndex={0}
                  className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
                >
                  <li>
                    <Link to="/profile" className="justify-between">
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link to="/settings">Settings</Link>
                  </li>
                  <li>
                    <button onClick={handleLogout}>Logout</button>
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-4 justify-center pt-10 pb-5">
            <div
              className="rounded-full overflow-hidden justify-center"
              style={{
                width: "110px",
                height: "110px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#334155",
              }}
            >
              <span className="text-5xl font-bold text-white">
                {getInitials(employeeFirstName, employeeLastName)}
              </span>
            </div>
            {employeeEmail && (
              <span className="text-center mt-2 text-sm font-semibold text-white tracking-tight">
                {employeeFirstName} {employeeLastName} <br />
                <span className="text-[#94A3b8]">{employeeEmail}</span>
              </span>
            )}
          </div>
        </div>

        <div className="h-[0.8px] bg-gray-500 w-full my-4"></div>
        <div>
          <ul className="menu p-3 text-white ">
            <span className="font-medium text-xs text-gray-400">
              EMPLOYEE DASHBOARD
            </span>
            <li className="p-1">
              <Link
                to="/employeedashboard"
                className="text-[13px] font-semibold p-2 hover:bg-blue-600"
              >
                <TfiDashboard className="w-5 h-5" />
                Dashboard
              </Link>
            </li>
            <li className="p-1">
              <Link
                to="/employeedashboard"
                className="text-[13px] font-semibold p-2 hover:bg-blue-600"
              >
                <FaRegUser className="w-5 h-5" />
                Profile
              </Link>
            </li>
          </ul>
        </div>

        {/*COMPLIANCE SECTION*/}
        <div>
          <ul className="menu p-3 text-white ">
            <span className="font-medium text-xs text-gray-400 tracking-wide">
              HR COMPLIANCE
            </span>
            <li className="p-1">
              <Link
                to="/fileincident"
                className="text-[13px] font-semibold p-2 hover:bg-blue-600"
              >
                <TbReportAnalytics className="w-5 h-5" />
                Report Incident
              </Link>
            </li>
            <li className="p-1">
              <Link
                to="/companypolicy"
                className="text-[13px] font-semibold p-2 hover:bg-blue-600"
              >
                <TbReportAnalytics className="w-5 h-5" />
                Company Policy
              </Link>
            </li>
          </ul>
        </div>

        {/*ATTENDANCE*/}
        <div>
          <ul className="menu p-3 text-white ">
            <span className="font-medium text-xs text-gray-400 tracking-wide">
              ATTENDANCE TIME TRACKING
            </span>
            <li className="p-1">
              <Link
                to="/timeTracking"
                className="text-[13px] font-semibold p-2 hover:bg-blue-600"
              >
                <TbReportAnalytics className="w-5 h-5" />
                Time in / Time out
              </Link>
            </li>
            <li className="p-1">
              <Link
                to="/companypolicy"
                className="text-[13px] font-semibold p-2 hover:bg-blue-600"
              >
                <TbReportAnalytics className="w-5 h-5" />
                Company Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/*NAVBAR*/}
      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* Navbar */}
        <div className="navbar bg-base-100 shadow-md">
          <div className="flex-1">
            {/* Hamburger Menu Icon */}
            <button
              onClick={onSidebarToggle}
              className="btn drawer-button bg-white text-black border border-gray-300"
            >
              <CiMenuBurger />
            </button>
          </div>
          <div className="flex-none gap-2">
            <span className="text-md font-normal">{currentTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeNavbar;
