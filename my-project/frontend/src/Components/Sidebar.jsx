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
      className={`fixed left-0 top-0 w-80  h-full shadow-lg z-50 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }  transition-transform duration-300 ease-in-out bg-gradient-to-r from-white/100 to-transparent backdrop-blur-lg`}
    >
      <div className="p-4 bg-base-500 h-full overflow-y-auto custom-scrollbar">
        <div className="mt-1 space-y-4">
          <div className="flex items-start justify-start">
            <img
              src={logo}
              alt="jjm logo"
              className="w-12 h-12 rounded-full border-2"
            />
            <h1 className="font-extrabold text-l pl-3 pt-3">Admin Dashboard</h1>
          </div>
          <hr />
          <div
            className={`flex items-center p-2 rounded-md transition-all duration-200 ${
              activePage === "/dashboard"
                ? "bg-gray-200 text-black shadow-md" : "hover:bg-gray-200 hover:shadow-md"
            }`}
            onClick={() => handleNavigation("/dashboard")}
          >
            <RxDashboard size="1.4rem" />
            <span className="font-semibold text-[15px] pl-[5px]">
              Home
            </span>
          </div>
        </div>

        <ul className="mt-4 space-y-4">
          <li>
            <span className="text-gray-400 text-[11px] font-medium">MODULES</span>

            {/*EMPLOYEE RECORDS MANAGEMENT */}
            <div
              className="flex items-center p-2 rounded-md transition-all duration-200 hover:bg-gray-300 "
              onClick={toggleSubmenu}
            >
              <ImDrawer size="1.4rem" />
              <span className="font-semibold text-[0.875rem] pl-[7px] pt-2">
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
                    <FaUsers className="ml-5" size="1.4rem" />
                    <span className="ml-3 font-medium">Employee List</span>
                  </div>
                </div>
              </div>
            )}

            {/*HR COMPLIANCE SECTION */}

            <div className="mt-3">
              <span className="text-[11px] font-medium text-gray-400">
                COMPANY POLICIES
              </span>
            </div>
            <div
              className="flex items-center p-2 rounded-md transition-all duration-200 hover:bg-gray-300 "
              onClick={toggleCompliance}
            >
              <RiPagesLine size="1.4rem" />
              <span className="font-semibold text-[0.875rem] pl-[5px]">
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
                    <MdListAlt size="1.4rem" className="ml-5" />
                    <span className="font-semibold text-[0.875rem] ml-1">
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
                    <TbReport size="1.4rem" className="ml-5" />
                    <span className="font-semibold text-[0.875rem] ml-1">
                      Incident Report
                    </span>
                  </div>
                  <hr className="p-1 opacity-0" />
                </div>
              </div>
            )}

            {/*ONBOARDING SECTION */}
            <div className="mt-3">
              <span className="text-[11px] font-medium text-gray-400">
                ONBOARDING & OFFBOARDING PROCESS
              </span>
            </div>
            <div
              className={`flex items-center p-2 rounded-md transition-all duration-200 ${
                activePage === "/onboarding"
                  ? "bg-gray-300 text-black"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => handleNavigation("/onboarding")}
            >
              <TbChalkboard size="1.4rem" />
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
            <div className="mt-3">
              <span className="text-[11px] font-medium text-gray-400">
                ATTENDANCE AND TIME TRACKING
              </span>
            </div>
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
