import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import Swal from "sweetalert2";

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setMatches(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
};

const IncidentReportTable = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");

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
        const response = await axios.get(`${APIBase_URL}/api/incidentreport`);
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
      await axios.patch(`${APIBase_URL}/api/incidentreport/${id}`, {
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
      await axios.patch(`${APIBase_URL}/api/incidentreport/${id}`, {
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

  const handleResize = () => {
    setIsSidebarOpen(window.innerWidth >= 768);
  };

  useEffect(() => {
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
        }`}
      >
        <Navbar toggleSidebar={toggleSidebar} />
        {isSidebarOpen && isMobileView && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-10"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <div className="flex-1 p-5 bg-base-500">
          <div className="border p-5 rounded-lg">
            <h2 className="text-2xl font-bold">
              Workplace Incident Reports
              <Breadcrumbs items={breadcrumbItems} />
            </h2>
          </div>
          <div
            className="overflow-x-auto overflow-y-auto mt-5"
            style={{ maxHeight: "500px" }}
          >
            {" "}
            {/* Added overflow-x-auto for horizontal scrolling */}
            <table className="table w-full border">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Date</th>
                  <th className="p-2">Incident Description</th>
                  <th className="p-2">Location</th>
                  <th className="p-2">Type of Incident</th>
                  <th className="p-2">Submitted By</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident._id} className="border-b">
                    <td className="p-2">
                      {new Date(incident.date).toLocaleDateString()}
                    </td>
                    <td className="p-2">{incident.description}</td>
                    <td className="p-2">{incident.location}</td>
                    <td className="p-2">{incident.reportType}</td>
                    <td className="p-2">
                      {incident.employeeUsername || "N/A"}
                    </td>
                    <td className="p-2">
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
                    <td className="p-2">
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
    </div>
  );
};

export default IncidentReportTable;
