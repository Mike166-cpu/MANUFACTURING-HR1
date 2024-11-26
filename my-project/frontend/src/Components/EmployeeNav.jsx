import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { GoSidebarCollapse } from "react-icons/go";


const EmployeeNav = ({ onSidebarToggle, isSidebarOpen, currentTime, currentDate }) => {
  const [searchQuery, setSearchQuery] = useState("");  
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);  
  const [highlightedIndex, setHighlightedIndex] = useState(-1);  
  const navigate = useNavigate();  
  const [timeoutId, setTimeoutId] = useState(null);

  const routes = [
    { name: "Dashboard", path: "/employeedashboard" },
    { name: "File Incident", path: "/fileincident" },
    { name: "Company Policy", path: "/companypolicy" },
    { name: "Time Tracking", path: "/timeTracking" },
    { name: "Feedback", path: "/feedback" },
    { name: "User Profile", path: "/userProfile" },
    { name: "Onboarding Feedback", path: "/feedback" },
  ];

  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    setTimeoutId(setTimeout(() => {
      if (query.length > 0) {
        const suggestions = routes.filter(route =>
          route.name.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredSuggestions(suggestions);
      } else {
        setFilteredSuggestions([]); 
      }
      setHighlightedIndex(-1); 
    }, 300));
  };

  const handleSuggestionClick = (path) => {
    setSearchQuery("");  
    setFilteredSuggestions([]);  
    setHighlightedIndex(-1); 
    navigate(path);  
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilteredSuggestions([]);
    setHighlightedIndex(-1); 
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setHighlightedIndex((prevIndex) =>
        Math.min(prevIndex + 1, filteredSuggestions.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0) {
        handleSuggestionClick(filteredSuggestions[highlightedIndex].path);
      }
    } else if (e.key === "Escape") {
      clearSearch();
    }
  };

  useEffect(() => {
    return () => clearTimeout(timeoutId);
  }, [timeoutId]);

  return (
    <div className={`flex-grow transition-all duration-300 ease-in-out`}>
      <div className="navbar bg-base-100 shadow-md w-full flex flex-wrap items-center justify-between">
        <div className="flex-1 flex items-center gap-3">
          {/* Sidebar Menu Icon */}
          <button onClick={onSidebarToggle} className="btn drawer-button text-lg text-black dark:text-white">
            <GoSidebarCollapse className="font-bold"/> {/* Updated to use FiMenu */}
          </button>

          <div className="relative w-full max-w-xs">  
            <label className="input input-bordered flex items-center">
              <input
                type="text"
                className="grow border-b rounded-t-md"
                placeholder="Search"
                value={searchQuery}
                onChange={handleInputChange}  
                onKeyDown={handleKeyDown}  
                aria-label="Search"
              />
              <button onClick={clearSearch} className="ml-2 text-gray-500">
                &times; 
              </button>
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
              <ul className="absolute left-0 w-full bg-white border border-gray-300 rounded-b-md shadow-md max-h-48 overflow-y-auto z-10 mt-[-1px]">
                {filteredSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className={`cursor-pointer p-2 ${highlightedIndex === index ? "bg-gray-200" : ""}`}
                    onClick={() => handleSuggestionClick(suggestion.path)}
                    role="option"
                    aria-label={suggestion.name}
                  >
                    {suggestion.name.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => (
                      <span key={i} className={part.toLowerCase() === searchQuery.toLowerCase() ? "font-bold" : ""}>
                        {part}
                      </span>
                    ))}
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
