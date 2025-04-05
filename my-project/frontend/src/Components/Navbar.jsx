import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdLogout } from "react-icons/md";
import { IoNotificationsOutline } from "react-icons/io5";
import { io } from "socket.io-client";
import { GiHamburgerMenu } from "react-icons/gi";

const socket = io("http://localhost:7685");


const Navbar = ({ toggleSidebar, isSidebarOpen, employee_id }) => {
  const [initials, setInitials] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const firstName = localStorage.getItem("firstName");
  const lastName = localStorage.getItem("lastName");
  const userRole = localStorage.getItem("role");

  const [notifications, setNotifications] = useState(() => {
    const savedNotifications = localStorage.getItem("notifications");
    if (savedNotifications) {
      // Filter to only show admin notifications
      const parsedNotifications = JSON.parse(savedNotifications);
      return parsedNotifications.filter(notif => notif.dashboard === 'admin');
    }
    return [];
  });

  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  useEffect(() => {
    const firstName = localStorage.getItem("firstName");
    const lastName = localStorage.getItem("lastName");
    const userRole = localStorage.getItem("role");

    if (firstName && lastName) {
      const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
      setInitials(initials);
    }
  }, []);

  const APIBased_URL = "https://backend-hr1.jjm-manufacturing.com";

  useEffect(() => {
    const handleAdminNotification = (notif) => {
      // Only process notifications meant for admin dashboard
      if (notif.dashboard === 'admin') {
        console.log("New admin notification received:", notif);
        setNotifications((prev) => {
          const updatedNotifications = [notif, ...prev].filter(n => n.dashboard === 'admin');
          localStorage.setItem(
            "notifications",
            JSON.stringify(updatedNotifications)
          );
          return updatedNotifications;
        });
      }
    };

    // Add event listener
    socket.on("notification-admin", handleAdminNotification);

    // Remove event listener when component unmounts
    return () => {
      socket.off("notification-admin", handleAdminNotification);
    };
  }, []);


  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("hasNewNotifications");
    localStorage.removeItem("notifications");
    navigate("/login", { replace: true });
  };

  const handleToggleNotifications = () => {
    setShowNotifications((prev) => !prev);

    if (!showNotifications) {
      setHasNewNotifications(false);
      localStorage.setItem("hasNewNotifications", JSON.stringify(false));
      // Mark all notifications as read
      const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
      setNotifications(updatedNotifications);
      localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.setItem("notifications", JSON.stringify([]));
    setShowNotifications(false);
  };


  return (
    <div
      className={`navbar bg-white sticky dark:bg-gray-800 dark:text-white top-0 z-10 transition-all duration-300 shadow-md ${
        isSidebarOpen ? "md:ml-72" : "ml-0"
      }`}
    >
      {/* Sidebar Toggle */}
      <div className="flex-none">
        <button className="btn btn-circle text-black" onClick={toggleSidebar}>
          <GiHamburgerMenu size={24} />
        </button>
      </div>

      {/* Right Side Navigation */}
      <div className="flex-none ml-auto flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <div className="relative">
            <button
              onClick={handleToggleNotifications}
              className="relative btn btn-ghost btn-circle"
            >
              <IoNotificationsOutline size={24} />
              {notifications.length > 0 && notifications.some(notif => !notif.read) && (
                <span className="badge badge-error badge-xs absolute -top-1 -right-1">
                  {notifications.filter(notif => !notif.read).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-base-100 shadow-lg rounded-lg border border-gray-200 z-50">
                <div className="flex justify-between items-center px-4 py-3 border-b">
                  <span className="font-semibold">Notifications</span>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-sm text-error hover:text-red-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <ul className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif, index) => (
                      <li
                        key={index}
                        className={`p-3 hover:bg-gray-100 transition-all border-b flex flex-col ${notif.read ? 'bg-gray-200' : ''}`}
                      >
                        <span>{notif.message}</span>
                        <span className="text-sm text-gray-500">
                          Employee: {notif.employee_id}
                        </span>
                        {notif.link && (
                          <a
                            href={notif.link}
                            className="text-primary underline mt-1 text-sm"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Request
                          </a>
                        )}
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

        {/* User Profile */}
        <div className="dropdown dropdown-end relative">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar relative"
          >
            <div className="w-10 h-10 rounded-full bg-[#FF76CE] flex items-center justify-center text-white text-lg font-normal p-[4px]">
              {initials}
            </div>
            {/* Green dot */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 rounded-full"></span>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
          >
            <li>
              <a onClick={handleLogout} className="text-red-600">
                <MdLogout size={"18px"} />
                Logout
              </a>
            </li>
          </ul>
        </div>

        {/* User Info */}
        <div>
          <span className="text-xs font-medium">
            {firstName} <br />
            <span className="block text-gray-400 capitalize">{userRole}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
