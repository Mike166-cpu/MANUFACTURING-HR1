import { useEffect, useState } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { FaMoon, FaSun } from "react-icons/fa";

const Portal = () => {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "JJM Manufacturing - Portal";
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const admin = () => {
    navigate("/login");
  };

  const employee = () => {
    navigate("/employeelogin");
  };

  return (
    <div
      className={`relative flex flex-col justify-between min-h-screen ${
        darkMode ? "bg-gray-800" : "bg-green-200 bg-opacity-15"
      }`}
    >
      {/* Dark Mode Toggle Button */}
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 border-b-gray-700 bg-gray-300 dark:bg-gray-700 p-2 rounded-lg shadow-xl z-20"
      >
        {darkMode ? (
          <FaSun className="h-5 w-5 text-yellow-400" />
        ) : (
          <FaMoon className="h-5 w-5 text-gray-800" />
        )}
      </button>

      {/* Main Content */}
      <div className="flex flex-col justify-center items-center flex-grow p-4 sm:p-8">
        <h1 className="text-3xl sm:text-4xl lg:text-4xl font-bold mb-8 text-black dark:text-white text-center z-10">
          Welcome to the JJM Manufacturing Portal
        </h1>

        {/* Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl z-10">
          {/* Admin Login Card */}
          <div
            onClick={admin}
            className="card bg-base-100 dark:bg-gray-700 shadow-xl hover:shadow-2xl transition-shadow duration-300 p-6 cursor-pointer relative overflow-hidden animate-fadeInUp delay-100"
          >
            <img
              src="https://img.freepik.com/free-vector/multitasking-concept-with-man-desk-illustrated_23-2148392549.jpg?ga=GA1.1.991752240.1714294431&semt=ais_hybrid-rr-similar"
              alt="Admin multitasking"
              className="absolute inset-0 object-cover opacity-20 w-full h-full bottom-0 right-0"
            />
            <div className="card-body text-center relative z-10">
              <h2 className="card-title text-xl sm:text-2xl justify-center dark:text-white">
                Login as Admin
              </h2>
              <div className="card-actions justify-center">
                <button className="btn w-auto h-5 text-xs bg-slate-200 text-black dark:bg-gray-600 dark:text-white">
                  Continue as Admin
                </button>
              </div>
            </div>
          </div>

          {/* Employee Login Card */}
          <div
            onClick={employee}
            className="card bg-base-100 dark:bg-gray-700 shadow-xl hover:shadow-2xl transition-shadow duration-300 p-6 cursor-pointer relative overflow-hidden animate-fadeInUp delay-200"
          >
            <img
              src="https://img.freepik.com/free-vector/young-man-having-online-interview_52683-44359.jpg?ga=GA1.1.991752240.1714294431&semt=ais_hybrid-rr-similar"
              alt="Employee interview"
              className="absolute inset-0 object-cover opacity-20 w-full h-full bottom-0 right-0"
            />
            <div className="card-body text-center relative z-10">
              <h2 className="card-title text-xl sm:text-2xl justify-center dark:text-white">
                Login as Employee
              </h2>
              <div className="card-actions justify-center">
                <button className="btn w-auto h-5 text-xs bg-slate-200 text-black dark:bg-gray-600 dark:text-white">
                  Continue as Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Footer */}
      <footer className="w-full text-sm text-gray-500 py-4 text-center mt-auto">
        <p>
          &copy; {new Date().getFullYear()} JJM Manufacturing. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
};

export default Portal;
