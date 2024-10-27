import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import axios from "axios";

const FileIncident = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userReports, setUserReports] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";

  const authToken = sessionStorage.getItem("employeeToken");
  const employeeUsername = localStorage.getItem("employeeUsername");
  if (!authToken) {
    return <Navigate to="/employeelogin" replace />;
  }

  const [incidentData, setIncidentData] = useState({
    date: "",
    description: "",
    location: "",
    reportType: "",
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

    const employeeUsername = localStorage.getItem("employeeUsername");

    try {
      const response = await axios.post(`${APIBase_URL}/api/incidentreport`, {
        ...incidentData,
        employeeUsername,
      });

      if (response.status === 201) {
        alert("Incident Report Submitted Successfully!");
        setIncidentData({
          date: "",
          description: "",
          location: "",
          reportType: "",
          status: "Pending",
        });
        fetchReports();
      }
    } catch (error) {
      console.error("Error submitting the incident report:", error);
      alert("Failed to submit the report.");
    }
  };

  const fetchReports = async () => {
    const employeeUsername = localStorage.getItem("employeeUsername");

    try {
      const response = await axios.get(
        `${APIBase_URL}/api/incidentreport/${employeeUsername}`
      );
      setUserReports(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  useEffect(() => {
    document.title = "File Report";
    fetchReports();
  }, []);

  const archiveReport = async (id) => {
    try {
      const response = await axios.put(
        `${APIBase_URL}/api/incidentreport/archive/${id}`
      );
      alert(response.data.message);
      fetchReports();
    } catch (error) {
      console.error("Error archiving report:", error);
      alert("Failed to archive the report.");
    }
  };

  const filteredReports = userReports.filter((report) =>
    showArchived ? report.archived : !report.archived
  );

  const getBreadcrumb = () => {
    return (
      <>
        <span className="hover:underline cursor-pointer">HR Compliance</span>{" "}
        &gt;{" "}
        <span className="font-bold">
          {showArchived ? "Archive" : "Active Reports"}
        </span>
      </>
    );
  };

  return (
    <div className="flex min-h-screen">
      <EmployeeSidebar
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <div
        className={`flex-grow transition-all duration-300 ${
          isSidebarOpen ? "ml-72" : "ml-0"
        }`}
      >
        <EmployeeNav
          onSidebarToggle={handleSidebarToggle}
          isSidebarOpen={isSidebarOpen}
        />

        <div className="p-5">
          <div className="bg-white p-5 border rounded-lg">
            <h2 className="text-2xl font-bold text-start text-gray-800">
              Incident Report Form
              <div className="font-normal text-sm text-blue-700">
                {getBreadcrumb()}
              </div>
            </h2>
          </div>
        </div>

        <div className="p-6 pt-2 flex flex-col lg:flex-row gap-4">
          {/*FORM*/}
          <div className="container w-full border-2 lg:w-2/3 mx-auto p-6 bg-white rounded-lg shadow-lg mb-4 lg:mb-0">
            <form onSubmit={handleSubmit} className="space-y-4 w-full">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Type of Incident
                </label>
                <select
                  name="reportType"
                  value={incidentData.reportType}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="" disabled>
                    Select a type
                  </option>
                  <option value="Workplace Safety">Workplace Safety</option>
                  <option value="Confidentiality and Data Protection">
                    Confidentiality and Data Protection
                  </option>
                  <option value="Dress Code and Personal Appearance">
                    Dress Code and Personal Appearance
                  </option>
                  <option value="Substance Abuse">Substance Abuse</option>
                  <option value="Equal Opportunity Employment">
                    Equal Opportunity Employment
                  </option>
                  <option value="Others">Others</option>
                </select>
              </div>
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
                  rows="2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={incidentData.location}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-auto p-2 bg-blue-600 text-sm text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Submit Incident Report
              </button>
            </form>
          </div>

          {/*REPORT SECTION LIST*/}
          <div className="bg-white border-2 p-4 w-full lg:w-1/3 rounded-lg shadow-lg text-sm">
            <div className="flex pb-5 gap-5 justify-start text-sm ">
              <button
                onClick={() => setShowArchived(false)}
                className={`w-auto rounded text-xs ${
                  !showArchived ? "text-blue-800 underline" : "text-black"
                }`}
              >
                Active Reports
              </button>
              <button
                onClick={() => setShowArchived(true)}
                className={`w-auto rounded text-xs ${
                  showArchived ? "text-blue-800 underline" : "text-black"
                }`}
              >
                Archived Reports
              </button>
            </div>

            <h2 className="text-sm font-bold text-gray-800 mb-4">
              {showArchived ? "Archived Reports" : "Your Reports"}
            </h2>
            <div className="overflow-y-auto max-h-96">
              {filteredReports.length > 0 ? (
                <ul>
                  {filteredReports.map((report, index) => (
                    <li key={index} className="mb-2">
                      <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
                        <p>
                          <strong>Date:</strong>{" "}
                          {new Date(report.date).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Description:</strong> {report.description}
                        </p>
                        <p>
                          <strong>Location:</strong> {report.location}
                        </p>
                        <p>
                          <strong>Type of Incident:</strong> {report.reportType}
                        </p>
                        <p>
                          <strong>Status:</strong> {report.status}
                        </p>
                        {!showArchived && (
                          <button
                            onClick={() => archiveReport(report._id)}
                            className="mt-2 bg-yellow-600 text-white py-1 px-2 rounded"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No reports submitted yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileIncident;
