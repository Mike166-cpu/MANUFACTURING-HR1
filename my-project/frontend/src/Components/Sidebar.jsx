import React, { useState } from "react";
import { LuPackage } from "react-icons/lu";
import { RiArchiveDrawerLine, RiPagesLine } from "react-icons/ri";
import { ImDrawer } from "react-icons/im";
import { useLocation, useNavigate } from "react-router-dom";
import { MdListAlt } from "react-icons/md";
import { TbReport } from "react-icons/tb";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import { FaUsers } from "react-icons/fa";
import { RxDashboard } from "react-icons/rx";
import logo from "../../src/assets/logo-2.png";
import { TbChalkboard } from "react-icons/tb";
import { AiOutlineClose } from "react-icons/ai";
import { IoMdPersonAdd } from "react-icons/io";
import { IoDocumentsOutline } from "react-icons/io5";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activePage, setActivePage] = React.useState(location.pathname);
  const [initials, setInitials] = useState("");

  React.useEffect(() => {
    setActivePage(location.pathname);
  }, [location.pathname]);

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

  return (
    <div
      className={`fixed left-0 top-0 w-72 h-full z-50 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-700`}
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
          {/* Employee Records Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3 px-3">
              EMPLOYEE RECORDS
            </h3>
            <div
              className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={toggleSubmenu}
            >
              <div className="flex items-center">
                <ImDrawer className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-sm ml-3 text-gray-700 dark:text-gray-300">
                  Employee Records
                </span>
              </div>
              {isSubmenuOpen ? (
                <FaChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <FaChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </div>

            {/* Submenu items with modern styling */}
            {isSubmenuOpen && (
              <div className="mt-2 ml-4 space-y-1">
                <div
                  className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                    activePage === "/employeeInfo"
                      ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                  onClick={() => handleNavigation("/employeeInfo")}
                >
                  <FaUsers className="w-4 h-4" />
                  <span className="text-sm font-medium ml-3">
                    Account Management
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Similar styling pattern for other sections */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3 px-3">
              HR COMPLIANCE
            </h3>
            {/* COMPLIANCE LIST */}
            <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                activePage === "/compliance"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/compliance")}
            >
              <MdListAlt className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">
                Company Policy List
              </span>
            </div>

            {/* LEAVE MANAGEMENT */}
            <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                activePage === "/leave-management"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/leave-management")}
            >
              <TbReport className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">Leave Management</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3 px-3">
              ONBOARDING & OFFBOARDING
            </h3>
            {/* <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                activePage === "/onboarding"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/onboarding")}
            >
              <TbChalkboard className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">Onboard New Hire</span>
            </div> */}
            {/* <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                activePage === "/addemployee"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/addemployee")}
            >
              <IoMdPersonAdd className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">
                Create Employee Account
              </span>
            </div> */}
            {/* <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                activePage === "/offboarding"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/offboarding")}
            >
              <LuPackage className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">Offboarding</span>
            </div> */}

            {/* CREATE EMPLOYEE WORK SCHEDULE */}
            <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                activePage === "/employee-schedule"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/employee-schedule")}
            >
              <RiArchiveDrawerLine className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">
                Employee Schedule
              </span>
            </div>

            {/* RESIGNATION REQUST */}
            <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                activePage === "/"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/")}
            >
              <RiArchiveDrawerLine className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">
                Resignation Request (wala pa to)
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3 px-3">
              ATTENDANCE & TIME TRACKING
            </h3>
            <div
              className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                activePage === "/attendancetime"
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleNavigation("/attendancetime")}
            >
              <RiArchiveDrawerLine className="w-5 h-5" />
              <span className="font-medium text-sm ml-3">
                Attendance & Time Tracking
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
