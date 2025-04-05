import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import axios from "axios";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import moment from "moment";
import Swal from "sweetalert2";
import Breadcrumbs from "../../Components/BreadCrumb";

const socket = io("http://localhost:7685");
socket.on("connect", () => console.log("Connected to WebSocket"));
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

const obRequest = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const adminToken = localStorage.getItem("adminToken");
  console.log("TOKEN:", adminToken);
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

  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      try {
        const decodedToken = jwtDecode(adminToken);
        setUserRole(decodedToken.role.toLowerCase());
      } catch (error) {
        console.error("Invalid token:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (userRole && userRole !== "admin" && userRole !== "superadmin") {
      navigate("/unauthorized");
    }
  }, [userRole, navigate]);

  //FETCH OB REQUEST
  const [obRequests, setObRequests] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${APIBASED_URL}/api/timetrack/get-request`
        );
        setObRequests(res.data);
      } catch (err) {
        console.error("Error fetching OB requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();

    // WebSocket listeners
    socket.on("obRequestCreated", (newEntry) => {
      setObRequests((prevRequests) => [newEntry, ...prevRequests]);
    });

    socket.on("obRequestUpdated", (updatedEntry) => {
      setObRequests((prevRequests) =>
        prevRequests.map((req) =>
          req._id === updatedEntry._id ? updatedEntry : req
        )
      );
    });

    return () => {
      socket.off("obRequestCreated");
      socket.off("obRequestUpdated");
    };
  }, []);

  const handleReview = async (id, status) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${LOCAL}/api/timetrack/request-review`,
        {
          requestId: id,
          status,
        }
      );

      if (response.status === 200) {
        Swal.fire({
          title: "Success!",
          text: `OB request ${status}`,
          icon: "success",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "OK",
        })
        .then(() => {
          setLoading(false);
        });
      } else {
        Swal.fire({
          title: "Error!",
          text: "Failed to update request",
          icon: "error",
          confirmButtonColor: "#d33",
          confirmButtonText: "Try Again",
        }).then(() => {
          setLoading(false); 
        });
      }
    } catch (error) {
      console.error("Error updating request:", error);
      Swal.fire({
        title: "Error!",
        text: "An error occurred while processing the request.",
        icon: "error",
        confirmButtonColor: "#d33",
        confirmButtonText: "Try Again",
      });
    } finally {
      setTimeout(() => setLoading(false), 500);
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

  const filteredRequests = obRequests.filter((req) => {
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    const matchesSearch =
      (req.employee_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (req.purpose?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const [selectedRequest, setSelectedRequest] = useState(null);

  return (
    <div className="flex min-h-screen bg-base-200">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
        } relative`}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        {/* Sidebar Overlay for Mobile */}
        {isSidebarOpen && isMobileView && (
          <div
            className="fixed inset-0 bg-gray-200 opacity-50 z-10"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <div className="bg-white p-5">
          <Breadcrumbs />
          <h1 className="px-5 text-lg font-bold">OB Request </h1>
        </div>

        <div className="p-6 min-h-screen">
          <div className="mb-6">
            {/* Search & Filter Section */}
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Search..."
                className="input input-bordered w-full max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="select select-bordered w-full max-w-xs"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="table bg-white">
              <thead className="bg-gray-50">
                <tr className="text-gray-500">
                  <th>Select</th>
                  <th>Employee</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  // Loading skeleton
                  [...Array(10)].map((_, index) => (
                    <tr key={index}>
                      <td>
                        <div className="animate-pulse h-4 w-4 bg-gray-200"></div>
                      </td>
                      <td>
                        <div className="animate-pulse h-4 bg-gray-200  w-32"></div>
                      </td>
                      <td>
                        <div className="animate-pulse h-4 bg-gray-200 w-40"></div>
                      </td>
                      <td>
                        <div className="animate-pulse h-6 bg-gray-200 w-20"></div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <div className="animate-pulse h-8 bg-gray-200 w-24"></div>
                          <div className="animate-pulse h-8 bg-gray-200 w-24"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : paginatedRequests.length > 0 ? (
                  paginatedRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-base-200">
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(req._id)}
                          onChange={() => toggleRowSelection(req._id)}
                        />
                      </td>
                      <td>
                        {req.employee_name}
                      </td>
                      <td>{req.purpose}</td>
                      <td>
                        <span
                          className={`badge ${
                            req.status === "approved"
                              ? "badge-success"
                              : req.status === "rejected"
                              ? "badge-error"
                              : "badge-warning"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="btn btn-info btn-sm"
                          >
                            View Details
                          </button>
                          {(userRole === "admin" ||
                            userRole === "superadmin") &&
                            req.status === "pending" && (
                              <button
                                onClick={() =>
                                  handleReview(req._id, "approved")
                                }
                                className="btn btn-success btn-sm"
                              >
                                Approve
                              </button>
                            )}
                          {userRole === "superadmin" &&
                            req.status === "pending" && (
                              <button
                                onClick={() =>
                                  handleReview(req._id, "rejected")
                                }
                                className="btn btn-error btn-sm"
                              >
                                Reject
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  // No results message when the table is empty
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-gray-500">
                      No results found
                    </td>
                  </tr>
                )}
              </tbody>
              {!loading && filteredRequests.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="5">
                      <div className="px-6 py-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-normal text-gray-600">
                            Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                            {Math.min(
                              currentPage * rowsPerPage,
                              filteredRequests.length
                            )}{" "}
                            of {filteredRequests.length} entries
                          </span>
                          <div className="join">
                            {Array.from(
                              {
                                length: Math.ceil(
                                  filteredRequests.length / rowsPerPage
                                ),
                              },
                              (_, i) => (
                                <button
                                  key={i + 1}
                                  onClick={() => handlePageChange(i + 1)}
                                  className={`join-item btn btn-sm ${
                                    currentPage === i + 1 ? "btn-active" : ""
                                  }`}
                                >
                                  {i + 1}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Modal */}
        {selectedRequest && (
          <dialog id="details-modal" className="modal modal-open">
            <div className="modal-box">
              <h3 className="text-lg font-bold">OB Request Details</h3>

              {/* Image Preview */}
              {selectedRequest.file_url && (
                <div className="flex justify-center mt-4">
                  <img
                    src={selectedRequest.file_url}
                    alt="Uploaded File"
                    className="w-48 h-48 rounded shadow-lg object-cover"
                  />
                </div>
              )}

              <div className="mt-4 space-y-2">
                <p>
                  <strong>Employee ID:</strong> {selectedRequest.employee_id}
                </p>
                <p>
                  <strong>Name:</strong> {selectedRequest.employee_name}
                </p>
                <p>
                  <strong>Position:</strong> {selectedRequest.position}
                </p>
                <p>
                  <strong>Purpose:</strong> {selectedRequest.purpose}
                </p>
                <p>
                  <strong>Shift</strong> {selectedRequest.shift_name}
                </p>
                <p>
                  <strong>Status:</strong>
                  <span className="badge badge-outline ml-2">
                    {selectedRequest.status}
                  </span>
                </p>

                <hr className="my-2" />

                <p>
                  <strong>Time In:</strong>{" "}
                  {moment(selectedRequest.time_in).format(
                    "MMMM D, YYYY h:mm A"
                  )}
                </p>
                <p>
                  <strong>Time Out:</strong>{" "}
                  {moment(selectedRequest.time_out).format(
                    "MMMM D, YYYY h:mm A"
                  )}
                </p>
                <p>
                  <strong>Total Hours:</strong>{" "}
                  {Math.floor(selectedRequest.total_hours / 3600)} Hours
                </p>
                <p>
                  <strong>Overtime Hours:</strong>{" "}
                  {Math.floor(selectedRequest.overtime_hours / 3600)} Hours
                </p>

                <hr className="my-2" />

                {selectedRequest.remarks && (
                  <p>
                    <strong>Remarks:</strong> {selectedRequest.remarks}
                  </p>
                )}

                {/* File Download Button */}
                {selectedRequest.file_url && (
                  <div className="mt-4">
                    <a
                      href={selectedRequest.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-primary"
                    >
                      View Image
                    </a>
                  </div>
                )}
              </div>

              <div className="modal-action">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </dialog>
        )}
      </div>
    </div>
  );
};

export default obRequest;
