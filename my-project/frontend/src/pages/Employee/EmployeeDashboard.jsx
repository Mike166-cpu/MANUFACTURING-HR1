import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Swal from "sweetalert2";
import Breadcrumb from "../../Components/BreadCrumb";
import Calendar from "react-calendar";
import axios from "axios";
import { formatDuration, calculateDuration } from "../../utils/timeUtils";
import { Tooltip } from "react-tooltip";
import "react-calendar/dist/Calendar.css";
import { TbCurrencyTaka } from "react-icons/tb";

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
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date());
  const [holidays, setHolidays] = useState({});

  useEffect(() => {
    // Fetch holidays from Nager API
    const fetchHolidays = async () => {
      try {
        const response = await axios.get(
          `https://date.nager.at/api/v3/PublicHolidays/${currentYear}/PH`
        );
        const holidayData = response.data.reduce((acc, holiday) => {
          acc[holiday.date] = holiday.localName; 
          return acc;
        }, {});
        setHolidays(holidayData);
      } catch (error) {
        console.error("Error fetching holidays:", error);
      }
    };

    fetchHolidays();
  }, [currentYear]);

  useEffect(() => {
    document.title = "Dashboard - Home";
    const authToken = localStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employeeDepartment") || "Unknown";
    const position = localStorage.getItem("employeePosition");
    const employeeUsername = localStorage.getItem("employeeUsername");
    const role = localStorage.getItem("employeeRole");
    const employeeId = localStorage.getItem("employeeId");
    console.log("Employee Id:", employeeId);
    console.log("Position:", position);
    console.log("Role:", role);

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

        {/* MAIN CONTENT */}
        <div className="transition-all duration-300 bg-gray-100 ease-in-out flex-grow p-5 min-h-screen">
          <div className="flex flex-col items-center p-5">
          <h2 className="text-2xl font-bold mb-4">📅 {currentYear} Holiday Calendar</h2>

            <Calendar
              onChange={setDate}
              value={date}
              tileContent={({ date }) => {
                const dateStr = date.toISOString().split("T")[0];
                return holidays[dateStr] ? (
                  <span
                    data-tooltip-id={`holiday-${dateStr}`}
                    data-tooltip-content={holidays[dateStr]}
                    className="text-red-500"
                  >
                    🎉
                    <Tooltip id={`holiday-${dateStr}`} />
                  </span>
                ) : null;
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
