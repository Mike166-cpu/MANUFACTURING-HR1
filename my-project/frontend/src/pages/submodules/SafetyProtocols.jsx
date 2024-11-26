import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";

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

const SafetyProtocols = () => {
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [employeeDepartment, setEmployeeDepartment] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const authToken = sessionStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employee_department") || "Unknown";

    if (!authToken) {
      Swal.fire({
        title: "Not Logged In",
        text: "You are not logged in. Redirecting to Login Page",
        icon: "warning",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/employeelogin");
      });
    } else {
      setEmployeeFirstName(firstName);
      setEmployeeLastName(lastName);
      setEmployeeDepartment(department);
    }
  }, [navigate]);

  const handleSidebarToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleResize = () => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
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
    <div>
      <div className="flex">
        <EmployeeSidebar
          onSidebarToggle={handleSidebarToggle}
          isSidebarOpen={isSidebarOpen}
        />
        <div
          className={`flex-grow transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"} relative`}
        >
          <EmployeeNav
            onSidebarToggle={handleSidebarToggle}
            isSidebarOpen={isSidebarOpen}
          />

          {/* Mobile overlay */}
          {isSidebarOpen && isMobileView && (
            <div
              className="fixed inset-0 bg-black opacity-50 z-10"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
          )}

          {/* MAIN CONTENT */}
          <div className="min-h-screen px-4 py-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800">Employee Handbook</h2>

              {/* Employee Handbook Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow-lg">
                  <div className="card-body">
                    <h3 className="text-xl font-semibold">Introduction</h3>
                    <p>
                      Welcome to the company! This section provides an overview of the
                      company's history, mission, and values.
                    </p>
                  </div>
                </div>

                <div className="card bg-base-100 shadow-lg">
                  <div className="card-body">
                    <h3 className="text-xl font-semibold">Workplace Safety</h3>
                    <p>
                      Our safety protocols are designed to ensure a safe and healthy
                      environment for all employees. Please review the guidelines carefully.
                    </p>
                  </div>
                </div>

                <div className="card bg-base-100 shadow-lg">
                  <div className="card-body">
                    <h3 className="text-xl font-semibold">Employee Benefits</h3>
                    <p>
                      This section outlines the benefits available to employees, including
                      health insurance, retirement plans, and paid time off.
                    </p>
                  </div>
                </div>

                <div className="card bg-base-100 shadow-lg">
                  <div className="card-body">
                    <h3 className="text-xl font-semibold">Code of Conduct</h3>
                    <p>
                      Review the company's code of conduct to understand the expectations
                      for professional behavior.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* END OF MAIN CONTENT */}
        </div>
      </div>
    </div>
  );
};

export default SafetyProtocols;
