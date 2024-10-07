import React, { useState } from "react";
import { LuLayoutDashboard, LuPackage, LuBox } from "react-icons/lu";
import { RiArchiveDrawerLine, RiPagesLine } from "react-icons/ri";
import { BsChatLeft } from "react-icons/bs";
import { ImDrawer } from "react-icons/im";
import { IoDesktopSharp } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import { MdListAlt } from "react-icons/md";
import Divider from "@mui/material/Divider";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import { FaUsers } from "react-icons/fa";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activePage, setActivePage] = React.useState(location.pathname);

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
      className={`fixed left-0 top-0 w-80 bg-white h-full shadow-lg z-50 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out`}
    >
      <div className="p-4 bg-base-500 h-full overflow-y-auto custom-scrollbar">
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-center">
            <LuLayoutDashboard size="2.5rem" />
            <h1 className="font-extrabold text-xl pt-1 pl-3">Dashboard</h1>
          </div>
          <div
            className={`flex items-center p-2 rounded-md transition-all duration-200 ${
              activePage === "/dashboard"
                ? "bg-gray-200 text-black"
                : "hover:bg-gray-200"
            }`}
            onClick={() => handleNavigation("/dashboard")}
          >
            <IoDesktopSharp size="1.4rem" />
            <span className="font-semibold text-[0.875rem] pl-[5px]">
              Dashboard
            </span>
          </div>
        </div>

        <ul className="mt-4 space-y-4">
          <li>
            <span className="text-gray-400 text-sm font-semibold">Modules</span>

            {/*EMPLOYEE RECORDS MANAGEMENT */}
            <div
              className="flex items-center p-2 rounded-md transition-all duration-200 hover:bg-gray-300 "
              onClick={toggleSubmenu}
            >
              <ImDrawer size="1.4rem" />
              <span className="font-bold text-[0.875rem] pl-[5px]">
                Employee Records
              </span>
              {isSubmenuOpen ? (
                <FaChevronDown className="ml-auto" />
              ) : (
                <FaChevronRight className="ml-auto" />
              )}
            </div>
            <hr className="p-1 opacity-0" />

            {isSubmenuOpen && (
              <div className="pl-4]">
                <div className="w-full text-sm text-start ">
                  <div
                    className={`flex items-center p-2 rounded-md transition-all duration-200 ${
                      activePage === "/employeeInfo"
                        ? "bg-gray-300 text-black"
                        : "hover:bg-gray-200"
                    }`}
                    onClick={() => handleNavigation("/employeeInfo")}
                  >
                    <FaUsers size="1.4rem" />
                    <span className="ml-2 font-medium">
                      Employee List
                    </span>
                  </div>
                  <hr className="p-1 opacity-0" />
                  <div className="submenu-item w-full p-2 hover:bg-gray-300 cursor-pointer rounded-md">
                    Add Employee
                  </div>
                </div>
                <hr className="p-1 opacity-0" />
              </div>
            )}

            {/*HR COMPLIANCE SECTION */}
            <Divider />
            <div>
              <span className="text-sm font-medium text-gray-400">
                Company Policy
              </span>
            </div>
            <div
              className="flex items-center p-2 rounded-md transition-all duration-200 hover:bg-gray-300 "
              onClick={toggleCompliance}
            >
              <RiPagesLine size="1.4rem" />
              <span className="font-bold text-[0.875rem] pl-[5px]">
                HR Compliance
              </span>
              {isComplianceOpen ? (
                <FaChevronDown className="ml-auto" />
              ) : (
                <FaChevronRight className="ml-auto" />
              )}
            </div>
            <hr className="p-1 opacity-0" />

            {isComplianceOpen && (
              <div className="pl-4]">
                <div className="w-full text-sm text-start ">
                  <div
                    className={`flex items-center p-2 rounded-md transition-all duration-200 ${
                      activePage === "/compliance"
                        ? "bg-gray-300 text-black"
                        : "hover:bg-gray-200"
                    }`}
                    onClick={() => handleNavigation("/compliance")}
                  >
                    <MdListAlt size="1.4rem" />
                    <span className="font-semibold text-[0.875rem] pl-[5px]">
                      Compliance List
                    </span>
                  </div>
                  <hr className="p-1 opacity-0" />
                  <div
                    className={`flex items-center p-2 rounded-md transition-all duration-200 ${
                      activePage === "/incidentreport"
                        ? "bg-gray-300 text-black"
                        : "hover:bg-gray-200"
                    }`}
                    onClick={() => handleNavigation("/incidentreport")}
                  >
                    <MdListAlt size="1.4rem" />
                    <span className="font-semibold text-[0.875rem] pl-[5px]">
                      Incident Report
                    </span>
                  </div>
                  <hr className="p-1 opacity-0" />
                </div>
              </div>
            )}

            {/*ONBOARDING SECTION */}
            <Divider />
            <div
              className={`flex items-center p-2 rounded-md transition-all duration-200 ${
                activePage === "/onboarding"
                  ? "bg-gray-300 text-black"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => handleNavigation("/onboarding")}
            >
              <LuBox size="1.4rem" />
              <span className="font-semibold text-[0.875rem] pl-[5px]">
                Onboarding
              </span>
            </div>
            <hr className="p-1 opacity-0" />

            {/*OFFBOARDING SECTION */}
            <div
              className={`flex items-center p-2 rounded-md transition-all duration-200 ${
                activePage === "/offboarding"
                  ? "bg-gray-300 text-black"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => handleNavigation("/offboarding")}
            >
              <LuPackage size="1.4rem" />
              <span className="font-semibold text-[0.875rem] pl-[5px]">
                Offboarding
              </span>
            </div>
            <hr className="p-1 opacity-0" />

            {/*Attendance and time tracking*/}
            <div
              className={`flex items-center p-2 rounded-md transition-all duration-200 ${
                activePage === "/atattendancetimete"
                  ? "bg-gray-300 text-black"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => handleNavigation("/attendancetime")}
            >
              <RiArchiveDrawerLine size="1.4rem" />
              <span className="font-semibold text-[0.875rem] pl-[5px]">
                Attendance and Time tracking
              </span>
            </div>
            <hr className="p-1 opacity-0" />
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
