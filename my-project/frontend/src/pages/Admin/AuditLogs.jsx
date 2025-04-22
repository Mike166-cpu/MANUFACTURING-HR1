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

  useEffect(() => {
    document.title = "Audit Logs | JJM HRMS";
    fetchAuditRequests();
  }, []);

  const [form, setForm] = useState({ title: "", description: "" });

  const handleCreate = async () => {
    if (!form.title || !form.description) {
      return Swal.fire(
        "Missing Fields",
        "Please fill in all fields.",
        "warning"
      );
    }

    try {
      const res = await axios.post(
        `${APIBASED_URL}/api/policies/create`,
        form
      );
      Swal.fire("Success", res.data.message, "success");
      setForm({ title: "", description: "" });
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to create policy",
        "error"
      );
    }
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

            <div className="p-6 bg-gray-100 min-h-screen"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
