import React, { useState, useEffect, useRef } from "react";
import { GoSidebarCollapse } from "react-icons/go";
import { FaBell } from "react-icons/fa";
import { io } from "socket.io-client";

const socket = io("http://localhost:7685");

const EmployeeNav = ({ onSidebarToggle }) => {
  const [currentTime, setCurrentTime] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const employeeId = localStorage.getItem("employeeId");

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

  return (
    <div className="flex-grow transition-all duration-300 ease-in-out">
      <div className="navbar bg-white shadow-md w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button onClick={onSidebarToggle} className="btn text-lg text-black">
            <GoSidebarCollapse className="font-bold" />
          </button>
          <span className="text-lg text-gray-700">{currentTime}</span>
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
            <div className="absolute top-full right-0 mt-2 w-80 bg-white shadow-xl rounded-xl overflow-hidden z-50 border border-gray-200 animate-fade-in">
              <div className="flex items-center justify-between p-4 border-b bg-blue-50">
                <span className="font-semibold text-gray-700">
                  Notifications
                </span>
                <button
                  onClick={clearNotifications}
                  className="text-xs text-gray-500 hover:text-gray-700 transition"
                >
                  Clear All
                </button>
              </div>
              <ul className="max-h-64 overflow-y-auto divide-y divide-gray-200">
                {notifications.length > 0 ? (
                  notifications.map((notif, index) => (
                    <li
                      key={index}
                      className={`flex p-3 hover:bg-gray-100 transition ${notif.read ? 'bg-gray-200' : ''}`}
                    >
                      <a
                        className="text-sm text-gray-700 hover:text-blue-600 transition w-full"
                      >
                        {notif.message}
                      </a>
                    </li>
                  ))
                ) : (
                  <li className="p-4 text-center text-gray-500">
                    No new notifications
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeNav;
