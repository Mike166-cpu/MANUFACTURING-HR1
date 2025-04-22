import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  IoHomeOutline,
  IoBookOutline,
  IoCloudUploadOutline,
} from "react-icons/io5";
import { CiFileOn, CiCalendar } from "react-icons/ci";
import { FaRegUser } from "react-icons/fa";
import { FaPenToSquare } from "react-icons/fa6";
import { TbFileReport } from "react-icons/tb";
import { TfiTime } from "react-icons/tfi";
import { MdOutlinePolicy } from "react-icons/md";
import { FiLogOut } from "react-icons/fi";
import { AiOutlineClose } from "react-icons/ai";
import { VscFeedback } from "react-icons/vsc";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import logo from "../../src/assets/logo-2.png";
import { FaRegCalendarAlt } from "react-icons/fa";
import { MdOutlineSettings } from "react-icons/md";


const EmployeeSidebar = ({ onSidebarToggle, isSidebarOpen }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const employeeId = localStorage.getItem("employeeId");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const dropdownRef = useRef(null);
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";

  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
  };

  useEffect(() => {
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

  const handleLogout = async () => {
    try {
      await axios.post(`${APIBASED_URL}/api/auth/logout`);
      localStorage.removeItem("employeeToken");
      toast.success("Logged out successfully!");
      navigate("/employeelogin");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Error logging out!");
    }
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
    const name = localStorage.getItem("fullName");
    const lastName = localStorage.getItem("employeeLastName");
    if (email) {
      setEmployeeEmail(email);
    }
    if (name) {
      setEmployeeFirstName(name);
    }
  
  }, []);

  const getInitials = (fullname) => {
    if (!fullname || typeof fullname !== "string") {
      return "?"; // Default if fullname is missing
    }
  
    const nameParts = fullname.split(" "); // Split the fullname into words
    const firstInitial = nameParts[0]?.charAt(0).toUpperCase() || "";
    const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1]?.charAt(0).toUpperCase() : "";
  
    return firstInitial + lastInitial; // Combine initials (e.g., John Doe → JD)
  };

  const [profilePicture, setProfilePicture] = useState("");

  const NavItem = ({ to, icon: Icon, label, badge }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200
          ${
            isActive
              ? "bg-blue-500 border text-white"
              : "text-slate-600 hover:bg-gray-100"
          }`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{label}</span>
        {badge && (
          <span className="ml-auto text-xs px-2 py-1 rounded-md bg-yellow-100 text-yellow-800">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const MenuSection = ({ title, children }) => (
    <div className="px-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );

  //FETCH PFP
  const LOCAL = "http://localhost:7685";
  const [profile, setProfile] = useState({});

  const fetchUser = async () => {
    try {
      const employeeId = localStorage.getItem("employeeId");
     

      const response = await axios.get(
        `${APIBASED_URL}/api/employeeData/${employeeId}`
      );
      const employeeData = response.data;
      const updatedProfile = {
        ...employeeData,
        initials: getInitials(employeeData.fullname), // Compute initials
      };
  

      setProfile(response.data);
    } catch (error) {
      console.error("Error fetching employee:", error.response?.data || error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div
      className={`fixed inset-y-0 left-0 w-[280px] sm:w-72 bg-white dark:bg-gray-800 shadow-lg transform 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        transition-transform duration-300 ease-in-out z-30 flex flex-col`}
    >
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="p-3 sm:p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src={logo}
              alt="JJM Logo"
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg"
            />
            <h1 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200">
              JJM MANUFACTURING
            </h1>
          </div>
          <button
            onClick={onSidebarToggle}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
          >
            <AiOutlineClose className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="p-3 sm:p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-3 sm:gap-4">
          {profile.profilePicture ? (
            <img
              src={profile.profilePicture}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-700 flex items-center justify-center text-purple-600 dark:text-purple-100 text-lg font-medium">
              {getInitials(profile.fullname)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate capitalize">
              {profile.fullname}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {profile.email}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              ID: {employeeId}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 space-y-2 hide-scrollbar text-sm sm:text-base">
        {/* HOME SECTION */}
        <MenuSection>
          <NavItem to="/employeedashboard" icon={IoHomeOutline} label="Home" />
          <NavItem to="/userProfile" icon={FaRegUser} label="Profile" />
          <NavItem to="/my-calendar" icon={FaRegCalendarAlt} label="Calendar" />
          <NavItem to="/settings" icon={MdOutlineSettings} label="Settings" />
        </MenuSection>

        <div className="py-3">
          <span className="text-xs bg-text-gray-500 font-bold opacity-50 px-5">
            PAGES
          </span>
        </div>

        {/* HR COMPLIANCE SECTION */}
        <MenuSection>
          {/* <NavItem
            to="/user-handbook"
            icon={MdOutlinePolicy}
            label="User Handbook"
          /> */}
          <NavItem
            to="/request-form"
            icon={FaPenToSquare}
            label="Manual Time Entries"
          />
        </MenuSection>

        {/* ATTENDANCE AND TIME TRACKING SECTION */}
        <MenuSection>
          <NavItem to="/timetracking" icon={CiCalendar} label="Time Tracking" />
          <NavItem to="/file-leave" icon={CiFileOn} label="File Leave" />
        </MenuSection>

        {/* ONBOARDING SECTION */}
        <MenuSection>
          <NavItem
            to="/work-schedule"
            icon={MdOutlinePolicy}
            label="Work Schedule"
          />
          <NavItem
            to="/upload-requirements"
            icon={IoCloudUploadOutline}
            label="Submit Requirements"
          />
        </MenuSection>

        {/* OFFBOARDING SECTION */}
        <MenuSection>
          <NavItem
            to="/resignation-form"
            icon={VscFeedback}
            label="Resignation Form"
          />
        </MenuSection>
        <div className="p-3 sm:p-4 border-t dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-red-700 rounded-lg transition-colors duration-200"
          >
            <FiLogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSidebar;
