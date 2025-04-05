import React from "react";

const LeaveNavigationHeader = ({
  filterStatus,
  setFilterStatus,
  searchQuery,
  setSearchQuery,
  setIsLeaveBalanceModalOpen,
}) => {
  return (
    <div className="bg-white shadow rounded-md p-4 mb-6">
      <nav className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filterStatus === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setFilterStatus("all")}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filterStatus === "pending"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setFilterStatus("pending")}
          >
            Pending
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filterStatus === "approved"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setFilterStatus("approved")}
          >
            Approved
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filterStatus === "rejected"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setFilterStatus("rejected")}
          >
            Rejected
          </button>
        </div>
        <div className="flex space-x-4 items-center">
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search leaves..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setIsLeaveBalanceModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 whitespace-nowrap"
          >
            Set Leave Balance
          </button>
        </div>
      </nav>
    </div>
  );
};

export default LeaveNavigationHeader;
