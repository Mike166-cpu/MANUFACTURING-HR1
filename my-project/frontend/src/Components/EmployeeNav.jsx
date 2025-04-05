import React, { useState, useEffect, useRef } from "react";
import { GoSidebarCollapse } from "react-icons/go";
import { FaBell } from "react-icons/fa";
import { IoSearchOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:7685");

const EmployeeNav = ({ onSidebarToggle }) => {
  const [currentTime, setCurrentTime] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const employeeId = localStorage.getItem("employeeId");
  const navigate = useNavigate();

  // Navigation options for search
  const navOptions = [
    { path: "/employeedashboard", label: "Dashboard" },
    { path: "/user-handbook", label: "Company Handbook" },
    { path: "/timeTracking", label: "Time Tracking" },
    { path: "/userProfile", label: "Profile" },
    { path: "/work-schedule", label: "Work Schedule" },
    { path: "/file-leave", label: "File Leave" },
    { path: "/request-form", label: "Request Form" },
    { path: "/resignation-form", label: "Resignation Form" },
    { path: "/upload-requirements", label: "Upload Requirements" }
  ];

  // Function to load notifications from localStorage
  const loadNotifications = () => {
    const storedNotifications = localStorage.getItem("notifications");
    return storedNotifications ? JSON.parse(storedNotifications) : [];
  };

  useEffect(() => {
    // Load stored notifications and filter for employee dashboard only
    const storedNotifications = JSON.parse(localStorage.getItem("notifications")) || [];
    const filteredNotifications = storedNotifications.filter(n => n.dashboard === 'employee');
    setNotifications(filteredNotifications);

    socket.on(`notification-${employeeId}`, (data) => {
      if (data.dashboard === 'employee') {
        setNotifications((prev) => {
          const notificationExists = prev.some(
            (n) => n.request_id === data.request_id
          );

          if (notificationExists) return prev;

          // Get existing notifications from localStorage
          const existingNotifications = JSON.parse(localStorage.getItem("notifications")) || [];
          // Filter out employee notifications and add the new one
          const otherNotifications = existingNotifications.filter(n => n.dashboard !== 'employee');
          const updatedNotifications = [data, ...prev];
          
          // Save combined notifications
          localStorage.setItem("notifications", JSON.stringify([...otherNotifications, ...updatedNotifications]));
          return updatedNotifications;
        });
      }
    });

    return () => {
      socket.removeAllListeners(`notification-${employeeId}`);
    };
  }, [employeeId]);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear notifications
  const clearNotifications = () => {
    setNotifications([]);
    const allNotifications = JSON.parse(localStorage.getItem("notifications")) || [];
    const adminNotifications = allNotifications.filter(n => n.dashboard !== 'employee');
    localStorage.setItem("notifications", JSON.stringify(adminNotifications));
  };

  const handleToggleNotifications = () => {
    setShowNotifications((prev) => !prev);

    if (!showNotifications) {
      // Mark all notifications as read
      const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
      setNotifications(updatedNotifications);
      const allNotifications = JSON.parse(localStorage.getItem("notifications")) || [];
      const otherNotifications = allNotifications.filter(n => n.dashboard !== 'employee');
      localStorage.setItem("notifications", JSON.stringify([...otherNotifications, ...updatedNotifications]));
    }
  };

  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSearchResults(e.target.value.length > 0);
  };

  // Filter navigation options based on search query
  const filteredNavOptions = navOptions.filter(option => 
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Navigate to selected page
  const handleNavigation = (path) => {
    navigate(path);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  return (
    <div className="flex-grow transition-all duration-300 ease-in-out">
      <div className="navbar bg-white border-b-2 w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button onClick={onSidebarToggle} className="btn text-lg text-black">
            <GoSidebarCollapse className="font-bold" />
          </button>
          <span className="text-lg text-gray-700">{currentTime}</span>
        </div>

        {/* Search Bar - DaisyUI */}
        <div className="flex-1 flex justify-center relative" ref={searchRef}>
          <div className="form-control w-full max-w-md">
            <div className="relative flex items-center w-full">
              <input 
                type="text" 
                placeholder="Search pages..." 
                className="input input-bordered w-full pr-12 focus:outline-none"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSearchResults(searchQuery.length > 0)}
              />
              <button className="btn btn-primary h-full absolute right-0 rounded-l-none">
                <IoSearchOutline className="text-xl" />
              </button>
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full mt-2 w-full max-w-md bg-white shadow-xl rounded-xl overflow-hidden z-50 border border-gray-200">
              <ul className="menu bg-base-100 w-full p-2 rounded-box">
                {filteredNavOptions.length > 0 ? (
                  filteredNavOptions.map((option, index) => (
                    <li key={index}>
                      <a 
                        onClick={() => handleNavigation(option.path)}
                        className="hover:bg-base-200 transition-colors"
                      >
                        {option.label}
                      </a>
                    </li>
                  ))
                ) : (
                  <li className="p-4 text-center text-gray-500">
                    No results found
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Notification Icon */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="relative p-2 text-gray-700 hover:text-blue-600 transition"
            onClick={handleToggleNotifications}
          >
            <FaBell className="text-2xl" />
            {notifications.length > 0 && notifications.some(notif => !notif.read) && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                {notifications.filter(notif => !notif.read).length}
              </span>
            )}
          </button>

          {/* Notification Dropdown (Directly Below the Button) */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-96 bg-white shadow-2xl rounded-xl overflow-hidden z-50 border border-gray-200 animate-fadeIn">
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex items-center gap-2">
                  <FaBell className="text-blue-600" />
                  <span className="font-semibold text-gray-700">
                    Notifications ({notifications.length})
                  </span>
                </div>
                <button
                  onClick={clearNotifications}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 border border-gray-300 hover:border-red-300"
                >
                  Clear All
                </button>
              </div>
              <div className="max-h-[480px] overflow-y-auto divide-y divide-gray-100 bg-gray-50">
                {notifications.length > 0 ? (
                  notifications.map((notif, index) => (
                    <div
                      key={index}
                      className={`group p-4 hover:bg-white transition-all duration-200 cursor-pointer
                        ${!notif.read ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'bg-transparent'}
                      `}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-medium ${!notif.read ? 'text-blue-600' : 'text-gray-700'}`}>
                          {notif.type || 'Update'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(notif.timestamp || Date.now()).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                        {notif.message}
                      </p>
                      {!notif.read && (
                        <div className="mt-2 flex justify-end">
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            New
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-gray-500">
                    <FaBell className="text-4xl mb-2 text-gray-300" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeNav;