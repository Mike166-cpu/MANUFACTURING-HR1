import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import EmployeeNavbar from "../../Components/EmployeeNavbar";
import axios from "axios";

const FileIncident = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar state

  const authToken = localStorage.getItem("employeeToken");
  if (!authToken) {
    return <Navigate to="/employeelogin" replace />;
  }

  const [incidentData, setIncidentData] = useState({
    date: "",
    description: "",
    status: "Pending",
  });

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleChange = (e) => {
    setIncidentData({
      ...incidentData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/api/incidentreport",
        incidentData
      );

      if (response.status === 201) {
        alert("Incident Report Submitted Successfully!");
        setIncidentData({ date: "", description: "", status: "Pending" }); // Reset form
      }
    } catch (error) {
      console.error("Error submitting the incident report:", error);
      alert("Failed to submit the report.");
    }
  };

  return (
    <div>
      <EmployeeNavbar
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <div
        className={`transition-all duration-300 ease-in-out flex-grow p-4 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
            Incident Report Form
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={incidentData.date}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Incident Description
              </label>
              <textarea
                name="description"
                value={incidentData.description}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition duration-200"
            >
              Submit Incident Report
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FileIncident;
