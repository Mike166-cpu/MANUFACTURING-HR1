// EMPLPOYEE PROFILE PAGE

import React, { useState, useEffect } from "react";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Breadcrumbs from "../../Components/BreadCrumb";
import Swal from "sweetalert2";

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setMatches(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
};

const Profile = () => {
  useEffect(() => {
    document.title = "Profile";
  });

  const employeeId = localStorage.getItem("employeeId");
  const employeeUsername = localStorage.getItem("employeeUsername");
  const employeeFirstName = localStorage.getItem("employeeFirstName");
  const employeeLastName = localStorage.getItem("employeeLastName");
  const employeeEmail = localStorage.getItem("employeeEmail");

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobileView = useMediaQuery("(max-width: 768px)");

  const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAl = "http://localhost:7685";

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const handleResize = () => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
      setIsSidebarOpen(true);
    }
  };

  useEffect(() => {
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="flex md:flex-row">
      <EmployeeSidebar
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
        } relative`}
      >
        <EmployeeNav
          onSidebarToggle={handleSidebarToggle}
          isSidebarOpen={isSidebarOpen}
        />

        {isSidebarOpen && isMobileView && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-10"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <div className="p-5 shadow-sm">
          <Breadcrumbs />
          <h1 className="px-5 font-bold text-xl">Profile</h1>
        </div>

        {/* MAIN CONTENT */}
        <div className="min-h-screen bg-base-200 p-4 md:p-6">

        </div>
      </div>
    </div>
  );
};

export default Profile;
