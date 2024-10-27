import React, { useState, useEffect, useRef } from "react";
import idleLogout from "../hooks/idleLogout";
import { Link, useNavigate } from "react-router-dom";
import { IoHomeOutline } from "react-icons/io5";
import { FaRegUserCircle } from "react-icons/fa";
import { FaRegBell } from "react-icons/fa";
import { FaRegUser } from "react-icons/fa";
import { VscFeedback } from "react-icons/vsc";
import logo from "../../src/assets/logo-2.png";
import { TbFileReport } from "react-icons/tb";
import { TfiTime } from "react-icons/tfi";
import { MdOutlinePolicy } from "react-icons/md";




const EmployeeSidebar = ({ onSidebarToggle, isSidebarOpen }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const dropdownRef = useRef(null);

  idleLogout(1800000);

  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
  };

  useEffect(() => {
    // Simulating fetching notifications
    const dummyNotifications = [
      { id: 1, message: "You have a new message." },
      { id: 2, message: "Your incident report has been filed." },
      { id: 3, message: "New policy updates available." },
    ];
    setNotifications(dummyNotifications);
  }, []);

  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString();

      const options = { day: "numeric", month: "long", year: "numeric" };
      const formattedDate = now.toLocaleDateString("en-GB", options);

      setCurrentTime(formattedTime);
      setCurrentDate(formattedDate);
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("employeeToken");
    navigate("/employeelogin");
  };

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

  const getInitials = (firstName) => {
    const firstInitial = firstName.charAt(0).toUpperCase();
    return `${firstInitial}`;
  };

  return (
    <div>
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-base-500 shadow-lg transform overflow-y-auto ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-20`}
      >
        <div className="pt-4">
          <div className="pl-3 pb-2">
            <div className="flex justify-between items-center pr-2">
              {/* Logo on the left */}
              <img
                src={logo}
                alt="jjm logo"
                className="w-10 h-10 rounded-full border-2"
              />

              {/* Icons on the right */}
              <div className="flex items-center">
                <FaRegBell
                  className="w-5 h-5 text-black cursor-pointer"
                  onClick={toggleNotifications}
                />

                {isNotificationsOpen && (
                  <div className="dropdown dropdown-end">
                    <ul className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <li key={notification.id}>
                            <span>{notification.message}</span>
                          </li>
                        ))
                      ) : (
                        <li>No notifications</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="dropdown dropdown-end" ref={dropdownRef}>
                  <div
                    tabIndex={0}
                    role="button"
                    className="btn btn-ghost btn-circle avatar"
                    onClick={toggleDropdown}
                  >
                    <div className="rounded-full">
                      <FaRegUserCircle className="w-5 h-5 text-black" />
                    </div>
                  </div>
                  {isDropdownOpen && (
                    <ul
                      tabIndex={0}
                      className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
                    >
                      <li>
                        <Link to="/userProfile" className="justify-between">
                          Profile
                        </Link>
                      </li>
                      <li>
                        <button onClick={handleLogout}>Logout</button>
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Picture */}
          <hr />
          <div className="flex flex-row items-center mb-4 justify-start pl-6 pt-2 space-x-4">
            {/* Profile Picture (Initials) */}
            <div className="w-10 h-10 rounded-full bg-[#FF76CE] flex items-center justify-center text-white text-2xl font-normal p-[4px]">
              {getInitials(employeeFirstName)}
            </div>

            {/* Employee Name and Email */}
            {employeeEmail && (
              <div className="text-start mt-2">
                <span className="text-md font-semibold text-black tracking-tight">
                  {employeeFirstName} {employeeLastName}
                </span>
                <br />
                <span className="text-[#94A3b8] font-normal text-xs">
                  {employeeEmail}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="h-[0.8px] bg-gray-200 w-full my-4"></div>
        <div>
          <ul className="menu p-3 text-black ">
            <span className="font-medium text-xs text-gray-400">DASHBOARD</span>
            <li className="p-1">
              <Link
                to="/employeedashboard"
                className="text-[13px] font-semibold p-2 hover:shadow-md hover:bg-gray-100 "
              >
                <IoHomeOutline className="w-5 h-5" />
                Home
              </Link>
            </li>
            <li className="p-1">
              <Link
                to="/userProfile"
                className="text-[13px] font-semibold p-2 hover:bg-gray-200 hover:shadow-md"
              >
                <FaRegUser className="w-5 h-5" />
                Profile
              </Link>
            </li>
          </ul>
        </div>

        {/*COMPLIANCE SECTION*/}
        <div>
          <ul className="menu p-3 text-black ">
            <span className="font-medium text-xs text-gray-400 tracking-wide">
              HR COMPLIANCE
            </span>
            <li className="p-1">
              <Link
                to="/fileincident"
                className="text-[13px] font-semibold p-2 hover:bg-gray-200 hover:shadow-md"
              >
                <TbFileReport className="w-5 h-5" />
                Report Incident
              </Link>
            </li>
            <li className="p-1">
              <Link
                to="/companypolicy"
                className="text-[13px] font-semibold p-2 hover:bg-gray-200 hover:shadow-md"
              >
                <MdOutlinePolicy className="w-5 h-5" />
                Company Policy{" "}
                <span className="bg-yellow-400 px-2 text-xs rounded-lg">
                  REQ.
                </span>
              </Link>
            </li>
          </ul>
        </div>

        {/*ATTENDANCE*/}
        <div>
          <ul className="menu p-3 text-black ">
            <span className="font-medium text-xs text-gray-400 tracking-wide">
              ATTENDANCE TIME TRACKING
            </span>
            <li className="p-1">
              <Link
                to="/timeTracking"
                className="text-[13px] font-semibold p-2 hover:bg-gray-200 hover:shadow-md"
              >
                <TfiTime className="w-5 h-5" />
                Time in / Time out
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <ul className="menu p-3 text-black ">
            <span className="font-medium text-xs text-gray-400 tracking-wide">
              ONBOARDING
            </span>
            <li className="p-1">
              <Link
                to="/feedback"
                className="text-[13px] font-semibold p-2 hover:bg-gray-200 hover:shadow-md"
              >
                <VscFeedback className="w-5 h-5" />
                Onboarding Feedback
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSidebar;
