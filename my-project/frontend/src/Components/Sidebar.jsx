import React from "react";
import { LuLayoutDashboard, LuPackage, LuBox } from "react-icons/lu";
import { RiArchiveDrawerLine, RiPagesLine } from "react-icons/ri";
import { BsChatLeft } from "react-icons/bs";
import { IoDesktopSharp } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";

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
    toggleSidebar(); // Close sidebar after navigation
  };

  return (
    <div
      className={`fixed left-0 top-0 w-64 bg-white h-full shadow-lg z-50 transform ${
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
              activePage === "/dashboard" ? "bg-gray-200 text-black" : "hover:bg-gray-200"
            }`}
            onClick={() => handleNavigation("/dashboard")}
          >
            <IoDesktopSharp size="1.4rem" />
            <span className="font-semibold text-[0.875rem] pl-[5px]">Dashboard</span>
          </div>
        </div>

        <ul className="mt-4 space-y-4">
          <li>
            <span className="text-gray-400 text-sm font-semibold">Apps</span>

            <div
              className={`flex items-center p-2 rounded-md transition-all duration-200 ${
                activePage === "/employeerecords" ? "bg-gray-300 text-black" : "hover:bg-gray-200"
              }`}
              onClick={() => handleNavigation("/employeerecords")}
            >
              <LuPackage size="1.4rem" />
              <span className="font-semibold text-[0.875rem] pl-[5px]">Employee Records Management</span>
            </div>

            <div
              className={`flex items-center p-2 rounded-md transition-all duration-200 ${
                activePage === "/compliance" ? "bg-gray-300 text-black" : "hover:bg-gray-200"
              }`}
              onClick={() => handleNavigation("/compliance")}
            >
              <RiArchiveDrawerLine size="1.4rem" />
              <span className="font-semibold text-[0.875rem] pl-[5px]">HR Compliance</span>
            </div>

            <div
              className="flex items-center p-2 hover:bg-gray-200 rounded-md"
              onClick={() => handleNavigation("/onboarding")}
            >
              <BsChatLeft size="1.4rem" />
              <span className="font-semibold text-[0.875rem] pl-[5px]">Onboarding</span>
            </div>

            <div
              className="flex items-center p-2 hover:bg-gray-200 rounded-md"
              onClick={() => handleNavigation("/offboarding")}
            >
              <RiPagesLine size="1.4rem" />
              <span className="font-semibold text-[0.875rem] pl-[5px]">Offboarding</span>
            </div>

            <div
              className="flex items-center p-2 hover:bg-gray-200 rounded-md"
              onClick={() => handleNavigation("/attendance")}
            >
              <LuBox size="1.4rem" />
              <span className="font-semibold text-[0.875rem] pl-[5px]">Attendance and Time Tracking</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
