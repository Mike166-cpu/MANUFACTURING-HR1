import React, { useState } from "react";
import { RiArchiveDrawerLine, RiPagesLine } from "react-icons/ri";
import { useLocation, useNavigate } from "react-router-dom";
import { TbReport } from "react-icons/tb";
import { RxDashboard } from "react-icons/rx";
import logo from "../../src/assets/logo-2.png";
import { AiOutlineClose } from "react-icons/ai";
import { IoFolderOutline } from "react-icons/io5";
import { AiOutlineSchedule } from "react-icons/ai";
import { RiLogoutBoxRLine } from "react-icons/ri";
import { TbCalendarTime } from "react-icons/tb";
import { AiOutlineAudit } from "react-icons/ai";
import { FaChalkboardTeacher } from "react-icons/fa";
import { MdOutlinePolicy } from "react-icons/md";
import { IoIosTrendingUp } from "react-icons/io";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activePage, setActivePage] = React.useState(location.pathname);
  const [initials, setInitials] = useState("");
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    setActivePage(location.pathname);
  }, [location.pathname]);

  React.useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigation = (path) => {
    setActivePage(path);
    navigate(path);
  };

  const [isSubmenuOpen, setSubmenuOpen] = useState(false);
  const [isComplianceOpen, setCompliance] = useState(false);

  const toggleSubmenu = () => {
    setSubmenuOpen((prev) => !prev);
  };

  const toggleCompliance = () => {
    setCompliance((prev) => !prev);
  };

  const role = localStorage.getItem("role")?.trim();

  // console.log(role);

  return (
    <div
      className={`fixed left-0 top-0 w-72 h-full z-50 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out bg-white dark:from-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-700`}
    >
      <div className="p-6 h-full overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <img
            src={logo}
            alt="jjm logo"
            className="w-10 h-10 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
          />
          <div className="flex-1">
            <h1 className="font-bold text-gray-800 dark:text-white text-lg">
              Admin
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Dashboard
            </p>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors md:hidden"
          >
            <AiOutlineClose className="w-4 h-4" />
          </button>
        </div>

        {/* Home Button */}
        <div
          className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
            activePage === "/dashboard"
              ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
          onClick={() => handleNavigation("/dashboard")}
        >
          <RxDashboard className="w-5 h-5" />
          <span className="font-medium text-sm ml-3">Home</span>
        </div>

        {/* Main Navigation */}
        <div className="mt-8 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3 px-3">
              ONBOARDING
            </h3>

            {/* ONBOARD EMPLOYEE */}
            <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                activePage === "/onboard-employee"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/onboard-employee")}
            >
              <FaChalkboardTeacher className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">Onboard Employee</span>
            </div>

            {/* EMployee Promotion */}
          </div>

          {/* Employee Records Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3 px-3">
              EMPLOYEE RECORDS MANAGEMENT
            </h3>
            <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                activePage === "/employee-info"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/employee-info")}
            >
              <TbCalendarTime className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">Employee Records</span>
            </div>

            <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                activePage === "/promotion"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/promotion")}
            >
              <IoIosTrendingUp className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">Promote Employee</span>
            </div>

            {/* SEND REQUEST DOCUMENT TO EMPLOYEE */}
            <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                activePage === "/request-documents"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/request-documents")}
            >
              <RiArchiveDrawerLine className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">Request Document</span>
            </div>
          </div>

          {/* TIME TRACKING */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3 px-3">
              ATTENDANCE & TIME TRACKING
            </h3>
            <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                activePage === "/attendancetime"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/attendancetime")}
            >
              <TbCalendarTime className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">
                Attendance & Time Tracking
              </span>
            </div>

            {/* CREATE EMPLOYEE WORK SCHEDULE */}
            <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer${
                activePage === "/employee-schedule"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/employee-schedule")}
            >
              <AiOutlineSchedule className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">
                Employee Schedule
              </span>
            </div>
          </div>

          {/* HR Compliance Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3 px-3">
              HR COMPLIANCE
            </h3>

            {/* LEAVE MANAGEMENT */}
            <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                activePage === "/leave-management"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/leave-management")}
            >
              <IoFolderOutline className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">Leave Management</span>
            </div>

            {/* OB REQUEST  */}
            <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                activePage === "/ob-request"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/ob-request")}
            >
              <TbReport className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">OB Request</span>
            </div>

            {/* POLICIES 
            <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                activePage === "/policy"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/policy")}
            >
              <MdOutlinePolicy className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">Company Policy</span>
            </div> */}

            {/* USER LOGS  */}
            {role?.toLowerCase() === "superadmin" && (
              <div
                className={`flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  activePage === "/user-logs"
                    ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => handleNavigation("/user-logs")}
              >
                <AiOutlineAudit className="w-5 h-5" />
                <span className="font-medium text-sm ml-3">User Logs</span>
              </div>
            )}
          </div>

          {/* OFF BOARDING */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3 px-3">
              OFFBOARDING
            </h3>
            {/* RESIGNATION REQUST */}
            <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                activePage === "/resignation-request"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/resignation-request")}
            >
              <RiLogoutBoxRLine className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">
                Resignation Request
              </span>
            </div>
          </div>
        </div>

        {role?.toLowerCase() === "superadmin" && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3 px-3">
              USER LOGS
            </h3>
            <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                activePage === "/logs"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/logs")}
            >
              <AiOutlineAudit className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">Audit Logs</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
