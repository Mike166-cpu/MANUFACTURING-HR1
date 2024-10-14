import { useEffect, useState } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";

const Portal = () => {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "JJM MANUFACTURING - Portal";
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
        className="absolute top-4 right-4 bg-gray-200 dark:bg-gray-700 p-2 rounded-full shadow-lg z-20"
      >
        {darkMode ? (
          // Moon Icon for Dark Mode
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 2a8 8 0 00-.647 15.993A8 8 0 0010 2z" />
            <path d="M12.576 14.823A8 8 0 019.174 18c-.017 0-.033-.004-.05-.004a9.979 9.979 0 01-.036-1.577A8.012 8.012 0 0012 10c.52 0 1.027.054 1.514.154A7.982 7.982 0 0112.576 14.823zM10 4a6 6 0 000 12 6 6 0 000-12z" />
          </svg>
        ) : (
          // Sun Icon for Light Mode
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-800"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 6a4 4 0 100 8 4 4 0 000-8zm2 10h-4v-2h4v2zm3-3.464l-1.414 1.414-1.414-1.414 1.414-1.414L15 12.536zM12.536 5l1.414 1.414-1.414 1.414L11 6.414 12.536 5zm1.414-1.414l1.414-1.414 1.414 1.414-1.414 1.414L14 3.086zm-8.485 8.485L3.086 15l-1.414-1.414 1.414-1.414L5 12.536zM4.586 5l1.414 1.414-1.414 1.414L3.172 6.414 4.586 5z" />
          </svg>
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
