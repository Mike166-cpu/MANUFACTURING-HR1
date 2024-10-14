import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { FaRegUserCircle } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { MdLogout } from "react-icons/md";


const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const [initials, setInitials] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const firstName = localStorage.getItem("firstName");
    const lastName = localStorage.getItem("lastName");

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

  return (
    <div
      className={`navbar bg-white sticky top-0 z-10 transition-all duration-300 shadow-md ${
        isSidebarOpen ? "ml-80" : "ml-0"
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
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search..."
            className="input input-bordered w-full max-w-xs"
          />
          <button className="btn btn-primary">Search</button>
        </div>
      </div>

      <div className="flex-none gap-2 ml-auto">
        <div className="relative">
          <button className="btn btn-ghost btn-circle">
            <FontAwesomeIcon icon={faBell} className="text-gray-600 text-lg" />
          </button>
        </div>

        <div className="dropdown dropdown-end mr-5">
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
              <a>
                {" "}
                <FaRegUserCircle size={"18px"} />
                Profile
              </a>
            </li>
            <li>
              <a>
                {" "}
                <FiSettings size={"18px"} />
                Settings
              </a>
            </li>
            <li>
              <a onClick={handleLogout} className="text-red-600">
              <MdLogout size={"18px"}/>
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
