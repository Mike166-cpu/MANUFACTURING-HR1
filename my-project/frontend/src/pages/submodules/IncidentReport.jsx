import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import Swal from "sweetalert2";

const IncidentReportTable = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard";

    const token = localStorage.getItem("adminToken");
    if (!token) {
      Swal.fire({
        title: "Not Logged In",
        text: "You are not logged in. Redirecting to login page...",
        icon: "warning",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/login");
      });
    }
  }, [navigate]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [incidents, setIncidents] = useState([]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/incidentreport"
        );
        console.log("Fetched incidents:", response.data);
        setIncidents(response.data);
      } catch (error) {
        console.error("Error fetching incident reports:", error);
      }
    };

    fetchIncidents();
  }, []);

  const handleResolve = async (id) => {
    try {
      console.log("Resolving incident:", id);
      const response = await axios.patch(
        `http://localhost:5000/api/incidentreport/${id}`,
        {
          status: "Resolved",
        }
      );
      console.log("Resolve response:", response.data);
      setIncidents(
        incidents.map((incident) =>
          incident._id === id ? { ...incident, status: "Resolved" } : incident
        )
      );
    } catch (error) {
      console.error("Error resolving incident:", error);
    }
  };

  const handleUnresolve = async (id) => {
    try {
      console.log("Marking incident as pending:", id);
      const response = await axios.patch(
        `http://localhost:5000/api/incidentreport/${id}`,
        {
          status: "Pending",
        }
      );
      console.log("Unresolve response:", response.data);
      setIncidents(
        incidents.map((incident) =>
          incident._id === id ? { ...incident, status: "Pending" } : incident
        )
      );
    } catch (error) {
      console.error("Error marking incident as pending:", error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main content area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "ml-80" : "ml-0"
        }`}
      >
        {/* Navbar */}
        <Navbar toggleSidebar={toggleSidebar} className="sticky top-0 z-10" />

        {/* Main content with scrolling */}
        <div className="flex-1 overflow-y-auto p-5 bg-base-500">
          <div className="">
            <h2 className="text-3xl font-bold mb-4">
              Workplace Incident Report
            </h2>
          </div>

          {/* Incident Report Table */}
          <table className="table w-full bg-gray-100">
            <thead>
              <tr>
                <th>Date</th>
                <th>Incident Description</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr key={incident._id}>
                  <td>{new Date(incident.date).toLocaleDateString()}</td>
                  <td>{incident.description}</td>
                  <td>
                    <span
                      className={`badge ${
                        incident.status === "Resolved"
                          ? "badge-success"
                          : "badge-warning"
                      }`}
                    >
                      {incident.status}
                    </span>
                  </td>
                  <td>
                    {incident.status === "Resolved" ? (
                      <button
                        className="btn btn-error btn-sm"
                        onClick={() => handleUnresolve(incident._id)}
                      >
                        Mark as Pending
                      </button>
                    ) : (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleResolve(incident._id)}
                      >
                        Mark as Resolved
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IncidentReportTable;
