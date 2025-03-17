import React from "react";
import PropTypes from "prop-types";

const SkeletonLoader = ({ type, count = 1, className = "" }) => {
  const getSkeletonType = () => {
    switch (type) {
      case "table-row":
        return (
          <tr className="animate-pulse">
            <td className="px-4 py-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </td>
            <td className="px-4 py-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </td>
            <td className="px-4 py-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </td>
            <td className="px-4 py-3">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </td>
          </tr>
        );

      case "card":
        return (
          <div className="card bg-base-100 shadow-xl animate-pulse">
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="flex items-center space-x-3 animate-pulse">
            <div className="avatar">
              <div className="w-12 h-12 rounded-full bg-gray-200"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        );

      case "stats":
        return (
          <div className="stats shadow animate-pulse">
            <div className="stat">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        );

      case "sidebar":
        return (
          <div className="w-72 h-screen bg-base-100 shadow-xl animate-pulse">
            {/* Logo area */}
            <div className="p-4 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
            {/* Menu items */}
            <div className="p-4 space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded bg-gray-200"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              ))}
            </div>
          </div>
        );

      case "navbar":
        return (
          <div className="navbar bg-base-100 shadow-lg animate-pulse">
            <div className="flex-1 px-4 space-x-4">
              {/* Toggle button */}
              <div className="w-8 h-8 rounded bg-gray-200"></div>
              {/* Search bar */}
              <div className="hidden md:block w-64 h-8 rounded bg-gray-200"></div>
            </div>
            <div className="flex-none gap-4 px-4">
              {/* Notification icon */}
              <div className="w-8 h-8 rounded bg-gray-200"></div>
              {/* Profile */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                <div className="hidden md:block">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-16 mt-1"></div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
        );
    }
  };

  return (
    <div className={className}>
      {[...Array(count)].map((_, index) => (
        <div key={index} className="mb-4">
          {getSkeletonType()}
        </div>
      ))}
    </div>
  );
};

SkeletonLoader.propTypes = {
  type: PropTypes.oneOf(["table-row", "card", "profile", "stats", "sidebar", "navbar", "default"]),
  count: PropTypes.number,
  className: PropTypes.string,
};

export default SkeletonLoader;
