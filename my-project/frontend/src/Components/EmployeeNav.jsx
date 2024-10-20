import React, { useState } from "react";
import { CiMenuBurger } from "react-icons/ci";
import { useNavigate } from "react-router-dom"; // For navigation

const EmployeeNav = ({ onSidebarToggle, isSidebarOpen, currentTime, currentDate }) => {
  const [searchQuery, setSearchQuery] = useState("");  // State for search input
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);  // Suggestions based on input
  const navigate = useNavigate();  // Hook for programmatic navigation

  // Available routes to search
  const routes = [
    { name: "Dashboard", path: "/employeedashboard" },
    { name: "File Incident", path: "/fileincident" },
    { name: "Company Policy", path: "/companypolicy" },
    { name: "Time Tracking", path: "/timeTracking" },
    { name: "Profile", path: "/profile" },
    { name: "Feedback", path: "/feedback" },
    { name: "User Profile", path: "/userProfile" },
    { name: "Onboarding Feedback", path: "/feedback" },
  ];

  // Handle input change and filter suggestions
  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Filter suggestions based on input
    if (query.length > 0) {
      const suggestions = routes.filter(route =>
        route.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSuggestions(suggestions);
    } else {
      setFilteredSuggestions([]); // Clear suggestions if no input
    }
  };

  // Handle search by clicking a suggestion
  const handleSuggestionClick = (path) => {
    setSearchQuery("");  // Clear the input
    setFilteredSuggestions([]);  // Clear suggestions
    navigate(path);  // Navigate to the selected route
  };

  return (
    <div className={`flex-grow transition-all duration-300 ease-in-out`}>
      <div className="navbar bg-base-100 shadow-md w-full flex flex-wrap items-center justify-between">
        <div className="flex-1 flex items-center gap-3">
          {/* Hamburger Menu Icon */}
          <button onClick={onSidebarToggle} className="btn drawer-button text-lg text-black">
            <CiMenuBurger />
          </button>

          {/* Search Input */}
          <div className="relative w-full max-w-xs">  {/* Relative container for proper positioning */}
            <label className="input input-bordered flex items-center">
              <input
                type="text"
                className="grow"
                placeholder="Search"
                value={searchQuery}
                onChange={handleInputChange}  // Update state with search input
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 opacity-70"
              >
                <path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" />
              </svg>
            </label>

            {/* Suggestions Dropdown */}
            {filteredSuggestions.length > 0 && (
              <ul className="absolute left-0 w-full bg-white border border-gray-300 mt-2 rounded-md shadow-md max-h-48 overflow-y-auto z-10">
                {filteredSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="cursor-pointer p-2 hover:bg-gray-200"
                    onClick={() => handleSuggestionClick(suggestion.path)}
                  >
                    {suggestion.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeNav;
