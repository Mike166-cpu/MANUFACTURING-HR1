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

    const token = sessionStorage.getItem("adminToken");
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

  const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await axios.get(
          `${APIBase_URL}/api/incidentreport`
        );
        console.log("Fetched incidents:", response.data); // Check the console to see if employeeUsername is included
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
      await axios.patch(`${APIBase_URL}api/incidentreport/${id}`, {
        status: "Resolved",
      });
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
      await axios.patch(`${APIBase_URL}api/incidentreport/${id}`, {
        status: "Pending",
      });
      setIncidents(
        incidents.map((incident) =>
          incident._id === id ? { ...incident, status: "Pending" } : incident
        )
      );
    } catch (error) {
      console.error("Error marking incident as pending:", error);
    }
  };

  const Breadcrumbs = ({ items }) => {
    return (
      <nav>
        <ol className="list-reset flex">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              <span className="text-blue-800 text-sm font-normal">
                {item.label}
              </span>
              {index < items.length - 1 && <span className="mx-2">{">"}</span>}
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  const breadcrumbItems = [
    { label: "HR Compliance" },
    { label: "Incident Report", className: "font-bold" },
  ];

  return (
    <div className="flex h-screen">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "ml-80" : "ml-0"
        }`}
      >
        <Navbar toggleSidebar={toggleSidebar} className="sticky top-0 z-10" />

        <div className="flex-1 overflow-y-auto p-5 bg-base-500">
          <div className="border p-5 rounded-lg">
            <h2 className="text-2xl font-bold">
              Workplace Incident Reports
              <Breadcrumbs items={breadcrumbItems} />
            </h2>
          </div>
          <table className="table w-full border mt-5">
            <thead>
              <tr>
                <th>Date</th>
                <th>Incident Description</th>
                <th>Location</th>
                <th>Type of Incident</th> <th>Submitted By</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr key={incident._id}>
                  <td>{new Date(incident.date).toLocaleDateString()}</td>
                  <td>{incident.description}</td>
                  <td>{incident.location}</td>
                  <td>{incident.reportType}</td>{" "}
                  <td>{incident.employeeUsername || "N/A"}</td>
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
