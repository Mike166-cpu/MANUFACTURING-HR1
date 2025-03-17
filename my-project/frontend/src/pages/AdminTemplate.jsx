import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import axios from "axios";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const Local = "http://localhost:7685";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const adminToken = localStorage.getItem("adminToken");
  const gatewayToken = localStorage.getItem("gatewayToken");

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

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  //FETCH OB REQUEST
  const [obRequests, setObRequests] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:7685/api/timetrack/get-request?status=pending")
      .then((res) => setObRequests(res.data))
      .catch((err) => console.error("Error fetching OB requests:", err));
  }, []);

  const handleReview = async (id, status) => {
    try {
      const response = await axios.post(
        "http://localhost:7685/api/timetrack/request-review",
        {
          requestId: id,
          status,
        }
      );

      if (response.status === 200) {
        setObRequests(obRequests.filter((req) => req._id !== id));
        alert(`OB request ${status}`);
      } else {
        alert("Failed to update request");
      }
    } catch (error) {
      console.error("Error updating request:", error);
    }
  };

  return (
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

        <div className="p-6 bg-gray-50 min-h-screen">
          <h2>Pending OB Requests</h2>
          <table border="1">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Purpose</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {obRequests.map((req) => (
                <tr key={req._id}>
                  <td>
                    {req.employee_firstname} {req.employee_lastname}
                  </td>
                  <td>{new Date(req.time_in).toLocaleString()}</td>
                  <td>{new Date(req.time_out).toLocaleString()}</td>
                  <td>{req.purpose}</td>
                  <td>
                    <button onClick={() => handleReview(req._id, "approved")}>
                      Approve
                    </button>
                    <button onClick={() => handleReview(req._id, "rejected")}>
                      Reject
                    </button>
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

export default Dashboard;
