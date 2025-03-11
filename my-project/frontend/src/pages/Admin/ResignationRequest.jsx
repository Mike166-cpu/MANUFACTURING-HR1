import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import BreadCrumbs from "../../Components/BreadCrumb";
import { HiEye, HiCheckCircle, HiXCircle } from "react-icons/hi"; // Import icons
import { FaUsers, FaClock, FaExclamationTriangle } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";

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

const ResignationRequest = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const colors = [
    "text-red-500",
    "text-blue-500",
    "text-green-500",
    "text-yellow-500",
    "text-purple-500",
  ];

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.clear();
    Swal.fire({
      title: "Session Expired",
      text: "Your session has expired. Please log in again.",
      icon: "warning",
      confirmButtonText: "OK",
    }).then(() => {
      navigate("/login");
    });
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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

  //FETCH ALL RESIGNATION
  const [resignations, setResignations] = useState([]);
  const [selectedResignation, setSelectedResignation] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());

  useEffect(() => {
    fetchResignations();
  }, []);

  const fetchResignations = async () => {
    try {
      const response = await fetch(`${APIBASED_URL}/api/resignation/`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to fetch resignations");
      }

      setResignations(data);
    } catch (error) {
      console.error("Error fetching resignations:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    const confirmAction = await Swal.fire({
      title: `Are you sure you want to ${status.toLowerCase()} this resignation?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${status}`,
      cancelButtonText: "Cancel",
    });

    if (!confirmAction.isConfirmed) return;

    try {
      const response = await fetch(
        `${APIBASED_URL}/api/resignation/update-status/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok)
        throw new Error(`Failed to ${status.toLowerCase()} resignation`);

      Swal.fire({
        title: `Resignation ${status.toLowerCase()}!`,
        icon: "success",
        confirmButtonText: "OK",
      });

      fetchResignations(); // Refresh table after action
    } catch (error) {
      Swal.fire({
        title: "Action Failed",
        text: `Error updating resignation status: ${error.message}`,
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const toggleRowSelection = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
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

        {/* BREADCRUMBS */}
        <div className="bg-white pb-4 px-5">
          <BreadCrumbs />
          <span className="px-4 font-bold text-2xl">
            Manage Resignation Request
          </span>
        </div>

        <div className="p-6 bg-gray-100 min-h-screen">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="p-5 w-full">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Resignation Requests
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-4 w-16">
                          <div className="flex justify-center">
                            {/* Remove checkbox from here */}
                          </div>
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-600">
                          Employee Name
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-600">
                          Department
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-600">
                          Last Working Day
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-600">
                          Status
                        </th>
                        <th className="p-4 text-center text-sm font-semibold text-gray-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {resignations.map((resignation, index) => (
                        <tr
                          key={resignation._id}
                          className={`border-b transition-colors hover:bg-gray-50 ${
                            selectedRows.has(resignation._id)
                              ? "bg-blue-50"
                              : ""
                          }`}
                        >
                          <td className="p-4 w-16">
                            <div className="flex justify-center items-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                                checked={selectedRows.has(resignation._id)}
                                onChange={() =>
                                  toggleRowSelection(resignation._id)
                                }
                              />
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-700">
                            {resignation.employeeName}
                          </td>
                          <td className="p-4 text-sm text-gray-700">
                            {resignation.department}
                          </td>
                          <td className="p-3 text-sm text-gray-700">
                            {new Date(
                              new Date(resignation.lastWorkingDay).setDate(
                                new Date(resignation.lastWorkingDay).getDate() +
                                  1
                              )
                            ).toLocaleDateString("en-US", {
                              weekday: "long", 
                              month: "short", 
                              day: "numeric", 
                              year: "numeric", 
                            })}
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                resignation.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : resignation.status === "Approved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {resignation.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedResignation(resignation);
                                  setModalOpen(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                              >
                                <HiEye size={20} />
                              </button>
                              <button
                                onClick={() =>
                                  updateStatus(resignation._id, "Approved")
                                }
                                className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                              >
                                <HiCheckCircle size={20} />
                              </button>
                              <button
                                onClick={() =>
                                  updateStatus(resignation._id, "Rejected")
                                }
                                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <HiXCircle size={20} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* View Resignation Details Modal */}
              {modalOpen && selectedResignation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-5 z-50">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-md transform transition-all">
                    <div className="p-6 border-b">
                      <h3 className="text-xl font-semibold text-gray-800">
                        Resignation Details
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">
                          Employee
                        </label>
                        <p className="text-gray-800">
                          {selectedResignation.employeeName}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">
                          Department
                        </label>
                        <p className="text-gray-800">
                          {selectedResignation.department}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">
                          Last Working Day
                        </label>
                        <p className="text-gray-800">
                          {new Date(
                            selectedResignation.lastWorkingDay
                          ).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">
                          Reason
                        </label>
                        <p className="text-gray-800">
                          {selectedResignation.reason}
                        </p>
                      </div>
                      {selectedResignation.message && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500">
                            Message
                          </label>
                          <p className="text-gray-800">
                            {selectedResignation.message}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="p-6 border-t bg-gray-50 flex justify-end">
                      <button
                        onClick={() => setModalOpen(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResignationRequest;
