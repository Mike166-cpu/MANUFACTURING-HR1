import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";

const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [initials, setInitials] = useState("");
  const navigate = useNavigate();

  // On component mount, get firstName and lastName from localStorage
  useEffect(() => {
    const firstName = localStorage.getItem("firstName");
    const lastName = localStorage.getItem("lastName");

    console.log("First Name:", firstName); // Log first name
    console.log("Last Name:", lastName); // Log last name

    if (firstName && lastName) {
      const initials = `${firstName[0]}${lastName[0]}`;
      setInitials(initials.toUpperCase());
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    navigate("/login", { replace: true });
  };

  // Toggle the bell dropdown
  const toggleBellDropdown = () => {
    setIsBellOpen((prev) => !prev);
  };

  return (
    <div
      className={`navbar bg-base-100 sticky top-0 z-10 transition-all duration-300 shadow-md ${
        isSidebarOpen ? "ml-64" : "ml-0"
      }`}
    >
      {/* Hamburger Menu for toggling sidebar */}
      <div className="flex-none">
        <button className="btn btn-ghost btn-circle" onClick={toggleSidebar}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      </div>

      {/* Profile and Notification Icons */}
      <div className="flex-none gap-2 ml-auto">
        {/* Profile Avatar with Initials */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
          >
            <div className="w-10 h-10 rounded-full bg-[#FF76CE] flex items-center justify-center text-white text-lg font-normal p-[4px]">
              {initials}
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
          >
            <li>
              <a className="justify-between">Profile</a>
            </li>
            <li>
              <a>Settings</a>
            </li>
            <li>
              <a onClick={handleLogout} className="text-red-600">
                Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
