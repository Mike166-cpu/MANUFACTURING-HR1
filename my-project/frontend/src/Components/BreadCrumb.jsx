import React from "react";
import { Link, useLocation } from "react-router-dom";
import { IoHome } from "react-icons/io5";
import { FiChevronRight } from "react-icons/fi";

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <nav className="px-4 py-3 bg-gradient-to-r from-white to-gray-50 rounded-lg shadow-sm">
      <ul className="flex items-center">
        <li>
          <Link
            to="/employeedashboard"
            className="text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium flex items-center space-x-2 px-2"
          >
            <IoHome className="text-lg" /> {/* Icon size adjustment */}
            <span>Home</span>
          </Link>
        </li>

        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;

          return (
            <li key={to} className="flex items-center space-x-2 px-2">
              {/* Chevron icon for breadcrumb separator */}
              {index > 0 && <FiChevronRight className="text-gray-400" />}

              {isLast ? (
                <span className="text-blue-600 font-semibold capitalize flex items-center space-x-1">
                  <FiChevronRight className="text-lg hidden" />
                  {/* Hide duplicate icon */}
                  <span>{value}</span>
                </span>
              ) : (
                <Link
                  to={to}
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200 capitalize font-medium flex items-center space-x-1"
                >
                  <span>{value}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Breadcrumb;
