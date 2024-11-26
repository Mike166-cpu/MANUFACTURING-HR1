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
import { FiLogOut } from "react-icons/fi";
import { AiOutlineClose } from "react-icons/ai";
import { IoBookOutline } from "react-icons/io5";
import { IoCloudUploadOutline } from "react-icons/io5";

const EmployeeSidebar = ({ onSidebarToggle, isSidebarOpen }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const employeeId = localStorage.getItem("employeeId");
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

  const [profilePicture, setProfilePicture] = useState("");
  const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";

  useEffect(() => {
    if (employeeId) {
      fetch(
        `${APIBase_URL}/api/profile-picture?employeeId=${employeeId}`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.profilePicture) {
            setProfilePicture(data.profilePicture);
          }
        })
        .catch((error) =>
          console.error("Error fetching profile picture:", error)
        );
    }
  }, [employeeId]);
  return (
    <div>
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-lg transform overflow-y-auto ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-20 `}
      >
        <div className="pt-4">
          <div className="pl-3 pb-2 text-black">
            <div className="flex gap-4 items-center pr-2">
              {/* Logo on the left */}
              <img
                src={logo}
                alt="jjm logo"
                className="w-10 h-10 rounded-full border-2"
              />
              <h1 className="font-bold text-sm">JJM MANUFACTURING</h1>
              <button
                onClick={onSidebarToggle}
                className="text-gray-600 hover:text-gray-800 focus:outline-none md:hidden"
              >
                <AiOutlineClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Profile Picture */}
          <hr />
          <div className="flex flex-row items-center mb-4 justify-start pl-6 pt-2 space-x-4">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2" // Adjust size as needed
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#FF76CE] flex items-center justify-center text-white text-2xl font-normal p-[4px]">
                {getInitials(employeeFirstName)}
              </div>
            )}

            {employeeEmail && (
              <div className="text-start mt-2">
                <span className="text-md font-semibold text-black dark:text-white tracking-tight capitalize">
                  {employeeFirstName} {employeeLastName}
                </span>
                <br />
                <span className="text-[#94A3b8] font-normal text-xs">
                  {employeeEmail}
                </span>
                <br />
                <span className="text-[#94A3b8] font-normal text-xs">
                  Employee Id: {employeeId}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="h-[0.8px] bg-gray-200 w-full my-4"></div>
        <div>
          <ul className="menu p-3 text-black dark:text-white ">
            <span className="font-medium text-xs text-gray-400">DASHBOARD</span>
            <li className="p-1">
              <Link
                to="/employeedashboard"
                className="text-[13px] font-semibold p-2 dark:text-black hover:shadow-md hover:bg-gray-100 dark:hover:text-black "
              >
                <IoHomeOutline className="w-5 h-5" />
                Home
              </Link>
            </li>
            <li className="p-1">
              <Link
                to="/userProfile"
                className="text-[13px] font-semibold p-2 dark:text-black  hover:bg-gray-200 hover:shadow-md dark:hover:text-black"
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
                className="text-[13px] font-semibold p-2  hover:bg-gray-200 hover:shadow-md dark:text-black dark:hover:text-black"
              >
                <TbFileReport className="w-5 h-5" />
                Report Incident
              </Link>
            </li>
            <li className="p-1">
              <Link
                to="/companypolicy"
                className="text-[13px] font-semibold p-2 hover:bg-gray-200 hover:shadow-md  dark:text-black dark:hover:text-black"
              >
                <MdOutlinePolicy className="w-5 h-5" />
                Company Policy{" "}
                <span className="bg-yellow-400 dark:border-black px-2 text-xs rounded-lg text-black dark:text-black">
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
                className="text-[13px] font-semibold p-2 hover:bg-gray-200 hover:shadow-md dark:text-black dark:hover:text-black"
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
                className="text-[13px] font-semibold p-2 hover:bg-gray-200 hover:shadow-md dark:text-black dark:hover:text-black"
              >
                <VscFeedback className="w-5 h-5" />
                Onboarding Feedback
              </Link>
            </li>
{/* 
            <li className="p-1">
              <Link
                to="/safety-protocols"
                className="text-[13px] font-semibold p-2 hover:bg-gray-200 hover:shadow-md dark:text-white dark:hover:text-black"
              >
                <IoBookOutline className="w-5 h-5" />
                Safety Protocols
              </Link>
            </li> */}

            <li className="p-1">
              <Link
                to="/upload-documents"
                className="text-[13px] font-semibold p-2 hover:bg-gray-200 hover:shadow-md dark:text-black dark:hover:text-black"
              >
                <IoCloudUploadOutline className="w-5 h-5" />
                Upload Documents
              </Link>
            </li>
          </ul>
        </div>

        <div className="h-[0.8px] bg-gray-200 w-full my-4"></div>
        <div>
          <ul className="menu p-3 text-black ">
            <span className="font-medium text-xs text-gray-400 tracking-wide">
              ACCOUNT
            </span>
            <li className="p-1">
              <button
                onClick={handleLogout}
                className="text-[13px] font-semibold p-2 hover:bg-gray-200 hover:shadow-md dark:text-black dark:hover:text-black flex items-center"
              >
                <FiLogOut className="w-5 h-5 mr-1" />
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSidebar;
