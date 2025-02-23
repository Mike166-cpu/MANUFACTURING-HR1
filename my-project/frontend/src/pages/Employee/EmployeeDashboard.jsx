import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Swal from "sweetalert2";
import Breadcrumb from "../../Components/BreadCrumb";
import { RotatingLines } from "react-loader-spinner";
import Calendar from "react-calendar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faUserCheck } from "@fortawesome/free-solid-svg-icons";
import "react-calendar/dist/Calendar.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

const EmployeeDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [employeeDepartment, setEmployeeDepartment] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard - Home";
    const authToken = localStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employeeDepartment") || "Unknown";
    const employeeId = localStorage.getItem("employeeId");

    console.log("First Name:", firstName, "Employee Id:", employeeId);
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
    setIsSidebarOpen(!isSidebarOpen);
  };

  const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:5000";

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
    <div className="flex">
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

        <div
          className={`transition-all duration-300 ease-in-out flex-grow relative ${
            isSidebarOpen ? "md:opacity-0 sm:opacity-50" : "sm:opacity-100"
          }`}
        ></div>

        {/*MAIN CONTENT*/}
        <div className="transition-all duration-300 ease-in-out flex-grow p-5">
          <div className="rounded-lg border shadow-sm py-5 px-5">
            <div>
              <Breadcrumb />
            </div>
            <h1 className="font-bold text-lg capitalize dark:text-white">
              <span className="font-normal">Welcome back,</span>{" "}
              {employeeFirstName
                ? employeeFirstName
                : "First name not available"}
              !
            </h1>
            <Link
              to="/test-timer"
              className="text-blue text-sm underline-500 hover:underline hover:text-blue-600"
            >
              Start your time tracking now.
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 pt-5">
            {/* Total Hours Card */}

            {/* Attendance Count Card */}
            <div className="card w-full bg-green-500 text-white shadow-lg rounded-lg"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 pt-5">
            {/* Chart */}

            {/* Calendar */}
            <div className="card w-full items-center bg-white border rounded-lg p-6 h-80 text-xs">
              {/* Fixed height */}
              <h1 className="text-xl font-medium pb-2 text-center">Calendar</h1>
              <Calendar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
