import React, { useState } from "react";
import { LuLayoutDashboard, LuPackage, LuBox } from "react-icons/lu";
import { RiArchiveDrawerLine, RiPagesLine } from "react-icons/ri";
import { BsChatLeft } from "react-icons/bs";
import { ImDrawer } from "react-icons/im";
import { IoDesktopSharp } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import { MdKeyboardArrowRight } from "react-icons/md";

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
    toggleSidebar();
  };

  const [isAccordionOpen, setIsAccordionOpen] = useState(false); // Renamed state

  const toggleAccordion = () => {
    setIsAccordionOpen(!isAccordionOpen);
  };

  return (
    <div
      className={`fixed left-0 top-0 w-80 bg-white h-full shadow-lg z-50 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out`}
    >
      <div className="p-4 bg-base-500 h-full overflow-y-auto">
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
              className={`flex items-center p-2 rounded-md transition-all duration-200 ${
                activePage === "/employeerecords"
                  ? "bg-gray-300 text-black"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => handleNavigation("/employeerecords")}
            >
              <ImDrawer size="1.4rem" />
              <span className="font-semibold text-[0.875rem] pl-[5px]">
                Employee Records
              </span>
            </div>
            <hr className="p-1 opacity-0" />

            {/*HR COMPLIANCE SECTION */}
            <div
              className={`flex items-center p-2 rounded-md transition-all duration-200 ${
                activePage === "/compliance"
                  ? "bg-gray-300 text-black"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => handleNavigation("/compliance")}
            >
              <RiPagesLine size="1.4rem" />
              <span className="font-semibold text-[0.875rem] pl-[5px]">
                HR Compliance
              </span>
            </div>
            <hr className="p-1 opacity-0" />

            {/*ONBOARDING SECTION */}
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
