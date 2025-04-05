import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import axios from "axios";
import BreadCrumbs from "../../Components/BreadCrumb";
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

const AuditLogs = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const adminToken = localStorage.getItem("adminToken");
  const gatewayToken = localStorage.getItem("gatewayToken");
  const role = localStorage.getItem("role");

  const handleResize = () => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  //MAIN FUNCTION
  const [auditRequests, setAuditRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newAudit, setNewAudit] = useState({
    department: "",
    description: "",
    task: [],
  });
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  //Fetch Audit
  const fetchAuditRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${APIBASED_URL}/api/hr/audit-request`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      setAuditRequests(response.data);
      setFilteredData(response.data);
    console.log(response.data);
    } catch (error) {
      console.error("Failed to fetch audit requests", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Audit Logs | JJM HRMS";
    fetchAuditRequests();
  }, []);

  const handleCreateAudit = async () => {
    if (!newAudit || Object.values(newAudit).some((value) => !value)) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Please fill in all required fields before submitting.",
      });
      return;
    }

    try {
      const response = await axios.post(
        `${APIBASED_URL}/api/hr/audit-request`,
        newAudit
      );

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Audit request created successfully.",
      });

      setModalVisible(false);
      fetchAuditRequests();
    } catch (error) {
      console.error("Failed to create audit request", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to create audit request. Please try again.",
      });
    }
  };

  const handleFilter = (value) => {
    setFilterDepartment(value);
    setFilteredData(
      auditRequests.filter((req) =>
        req.department.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  return (
    <div>
      <div>
        <div className="flex min-h-screen">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div
            className={`flex-grow transition-all duration-300 ease-in-out ${
              isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
            } relative`}
          >
            <Navbar toggleSidebar={toggleSidebar} />
            {isSidebarOpen && isMobileView && (
              <div
                className="fixed inset-0 bg-black opacity-50 z-10"
                onClick={() => setIsSidebarOpen(false)}
              ></div>
            )}

            {/* BREADCRUMBS */}
            <div className="bg-white pb-4 px-5">
              <BreadCrumbs />
              <span className="px-4 font-bold text-2xl"> Audit Logs</span>
            </div>

            <div className="p-6 bg-gray-100 min-h-screen">
              <div className="p-6 bg-white shadow rounded-lg">
                <div className="flex justify-between mb-4">
                  <input
                    type="text"
                    placeholder="Filter by department"
                    value={filterDepartment}
                    onChange={(e) => handleFilter(e.target.value)}
                    className="border p-2 rounded w-full max-w-sm"
                  />
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                    onClick={() => setModalVisible(true)}
                  >
                    Create Audit Request
                  </button>
                </div>
                {loading ? (
                  <p>Loading...</p>
                ) : (
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2">Department</th>
                        <th className="border p-2">Description</th>
                        <th className="border p-2">Tasks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length > 0 ? (
                        filteredData.map((req) => (
                          <tr key={req._id} className="border">
                            <td className="border p-2">{req.department}</td>
                            <td className="border p-2">{req.description}</td>
                            <td className="border p-2">
                              {req.task.join(", ")}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="3"
                            className="border p-4 text-center text-gray-500"
                          >
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            {modalVisible && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                  <h2 className="text-lg font-semibold mb-4">
                    Create Audit Request
                  </h2>
                  <input
                    type="text"
                    placeholder="Department"
                    value={newAudit.department}
                    onChange={(e) =>
                      setNewAudit({
                        ...newAudit,
                        department: e.target.value,
                      })
                    }
                    className="border p-2 rounded w-full mb-2"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newAudit.description}
                    onChange={(e) =>
                      setNewAudit({
                        ...newAudit,
                        description: e.target.value,
                      })
                    }
                    className="border p-2 rounded w-full mb-2"
                  />
                  <input
                    type="text"
                    placeholder="Tasks (comma separated)"
                    value={newAudit.task.join(", ")}
                    onChange={(e) =>
                      setNewAudit({
                        ...newAudit,
                        task: e.target.value.split(","),
                      })
                    }
                    className="border p-2 rounded w-full mb-2"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      className="bg-gray-500 text-white px-4 py-2 rounded"
                      onClick={() => setModalVisible(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded"
                      onClick={handleCreateAudit}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
