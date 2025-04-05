import React, { useEffect, useState } from "react";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import BreadCrumbs from "../../Components/BreadCrumb";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiSearch,
  FiFilter,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiArrowLeft,
  FiUser,
  FiCoffee,
  FiAlertCircle,
} from "react-icons/fi";
import { formatDuration, calculateDuration } from "../../utils/timeUtils";
import Swal from "sweetalert2";
import { IoFilter } from "react-icons/io5";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { IoMdDownload } from "react-icons/io";


const AttendanceTime = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [allTimeTrackingSessions, setAllTimeTrackingSessions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [monthFilter, setMonthFilter] = useState("1");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);

  const userRole = localStorage.getItem("role") || "";
  console.log(userRole);

  const navigate = useNavigate();
  const LOCAL = "http://localhost:7685";
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";

  useEffect(() => {
    document.title = "Attendance and Time Tracking";
    const token = localStorage.getItem("adminToken");
    if (!token) navigate("/login");

    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          `${LOCAL}/api/onboarding/employee`
        );
        setEmployees(response.data);
        console.log("Fetched employees:", response.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    const fetchAllTimeTrackingSessions = async () => {
      try {
        const response = await axios.get(
          `${LOCAL}/api/timetrack/admin/all-sessions`
        );
        console.log("Raw sessions data:", response.data);
        console.log("Entry types distribution:", 
          response.data.reduce((acc, session) => {
            acc[session.entry_type] = (acc[session.entry_type] || 0) + 1;
            return acc;
          }, {})
        );
        setAllTimeTrackingSessions(response.data);
      } catch (error) {
        console.error("Error fetching all time tracking sessions:", error);
      }
    };

    fetchEmployees();
    fetchAllTimeTrackingSessions();
  }, [navigate]);

  const approveSession = async (sessionId) => {
    try {
      await axios.put(
        `${LOCAL}/api/timetrack/admin/update-status/${sessionId}`,
        {
          status: "approved",
          remarks: "Approved by admin",
        }
      );

      // Update local state
      setAllTimeTrackingSessions((prevSessions) =>
        prevSessions.map((session) =>
          session._id === sessionId
            ? { ...session, status: "approved" }
            : session
        )
      );

      Swal.fire({
        title: "Success",
        text: "Session approved successfully",
        icon: "success",
      });
    } catch (error) {
      console.error("Error approving session:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to approve session",
        icon: "error",
      });
    }
  };

  const rejectSession = async (sessionId) => {
    try {
      const { value: rejectionReason } = await Swal.fire({
        title: "Enter rejection reason",
        input: "text",
        inputLabel: "Rejection Reason",
        inputPlaceholder: "Enter your reason for rejection",
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return "You need to provide a reason for rejection!";
          }
        },
      });

      if (rejectionReason) {
        await axios.put(
          `${LOCAL}/api/timetrack/admin/update-status/${sessionId}`,
          {
            status: "rejected",
            remarks: rejectionReason,
          }
        );

        // Update local state
        setAllTimeTrackingSessions((prevSessions) =>
          prevSessions.map((session) =>
            session._id === sessionId
              ? { ...session, status: "rejected" }
              : session
          )
        );

        Swal.fire({
          title: "Success",
          text: "Session rejected successfully",
          icon: "success",
        });
      }
    } catch (error) {
      console.error("Error rejecting session:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to reject session",
        icon: "error",
      });
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = allTimeTrackingSessions.slice(startIndex, endIndex);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const LoadingSkeleton = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-3 bg-gray-200 rounded w-16 mt-2"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-8 bg-gray-200 rounded w-28"></div>
      </td>
    </tr>
  );

  // Toggle row selection
  const handleCheckboxChange = (id) => {
    setSelectedRows((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((rowId) => rowId !== id)
        : [...prevSelected, id]
    );
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState("");

  const handleGenerateReport = async () => {
    if (selectedReportType === "pdf") {
      generatePDFReport();
    } else if (selectedReportType === "excel") {
      if (allTimeTrackingSessions.length === 0) {
        await fetchAllTimeTrackingSessions();
      }
      exportToExcel();
    }
    setIsModalOpen(false);
  };

  const generatePDFReport = () => {
    if (allTimeTrackingSessions.length === 0) {
      console.warn("No data available for PDF export.");
      return;
    }

    const doc = new jsPDF();

    // Load Company Logo (Replace with your image URL or Base64)
    const companyLogo = `${window.location.origin}/logo-2.png`;

    // Set Header
    doc.addImage(companyLogo, "PNG", 10, 10, 30, 30); // Adjust logo size & position
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Your Company Name", 45, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("1234 Street Name, City, Country", 45, 27);
    doc.text("Phone: (123) 456-7890 | Email: info@company.com", 45, 34);

    // Add a line separator
    doc.setLineWidth(0.5);
    doc.line(10, 40, 200, 40);

    // Set Report Title
    doc.setFontSize(16);
    doc.text("Time Tracking Report", 80, 50);

    // Table Headers
    const headers = [
      [
        "Name",
        "Date",
        "Time In",
        "Time Out",
        "Work Duration",
        "Overtime",
        "Status",
      ],
    ];

    // Format Table Data
    const data = allTimeTrackingSessions.map((session) => [
      `${session.employee_firstname} ${session.employee_lastname}`,
      new Date(session.time_in).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      new Date(session.time_in).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      session.time_out
        ? new Date(session.time_out).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "N/A",
      session.total_hours
        ? `${Math.floor(session.total_hours / 3600)}h ${Math.floor(
            (session.total_hours % 3600) / 60
          )}m`
        : "-",
      session.overtime_duration
        ? `${Math.floor(session.overtime_duration / 3600)}h ${Math.floor(
            (session.overtime_duration % 3600) / 60
          )}m`
        : "0h 0m",
      session.status || "Pending",
    ]);

    // Generate Table
    doc.autoTable({
      startY: 60, // Position below header
      head: headers,
      body: data,
      theme: "striped",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [22, 160, 133], textColor: 255, fontSize: 12 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    // Save PDF
    doc.save("time_tracking_report.pdf");
  };

  const exportToExcel = () => {
    if (allTimeTrackingSessions.length === 0) {
      console.warn("No data available for export.");
      return;
    }

    // Map fetched data to a structured format
    const data = allTimeTrackingSessions.map((session) => ({
      Name: `${session.employee_firstname} ${session.employee_lastname}`,
      Date: new Date(session.time_in).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      "Time In": new Date(session.time_in).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      "Time Out": session.time_out
        ? new Date(session.time_out).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "N/A",
      "Work Duration": session.total_hours
        ? `${Math.floor(session.total_hours / 3600)}h ${Math.floor(
            (session.total_hours % 3600) / 60
          )}m`
        : "-",
      Overtime: session.overtime_duration
        ? `${Math.floor(session.overtime_duration / 3600)}h ${Math.floor(
            (session.overtime_duration % 3600) / 60
          )}m`
        : "0h 0m",
      Status: session.status || "Pending",
    }));

    // Convert JSON to Worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Time Tracking");

    // Save Excel File
    XLSX.writeFile(workbook, "time_tracking_report.xlsx");
  };

  return (
    <div className="flex">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
        } relative bg-base-200`}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        {/* BREADCRUMBS */}
        <div className="bg-base-100 pb-4 px-5">
          <BreadCrumbs />
          <span className="px-4 font-bold text-2xl">
            {" "}
            Time Tracking Records
          </span>
        </div>

        {/* MAIN CONTENT */}
        <div className="p-6 min-h-screen">
          <div className="mb-6 flex flex-col gap-4">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center justify-between py-4 gap-4">
              {/* Filters Group */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-primary" />
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="select select-bordered select-md"
                  >
                    <option value="1">Last Month</option>
                    <option value="2">Last 2 Months</option>
                    <option value="3">Last 3 Months</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <FiFilter className="text-primary" />
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="select select-bordered select-md"
                  >
                    <option value="all">All Departments</option>
                    <option value="IT">IT Department</option>
                    <option value="HR">HR Department</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <IoFilter className="text-primary" />
                  <select
                    className="select select-bordered select-md"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Button at the End, Aligned */}
              <button
                className="btn btn-success text-white font-medium"
                onClick={() => setIsModalOpen(true)}
              >
                Generate Report
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
              <table className="table w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th>Select</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Schedule</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Time Records</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSessions.map((session) => (
                    <tr key={session._id} className="hover:bg-gray-50 border-t">
                      <td className="px-4">
                        <label>
                          <input
                            type="checkbox"
                            onChange={() => handleCheckboxChange(session._id)}
                            checked={selectedRows.includes(session._id)}
                          />
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm capitalize">{session.employee_fullname}</span>
                          <span className="text-xs text-gray-500">{session.entry_type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{session.shift_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <FiClock className="text-gray-400 w-4 h-4" />
                            <span className="text-sm">
                              {session.time_in ? new Date(session.time_in).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit'
                              }) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiClock className="text-gray-400 w-4 h-4" />
                            <span className="text-sm">
                              {session.time_out ? new Date(session.time_out).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">
                            Work: {session.total_hours ? formatDuration(session.total_hours) : '-'}
                          </span>
                          <span className="text-xs text-gray-500">
                            OT: {session.overtime_duration ? formatDuration(session.overtime_duration) : '0h 0m'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          !session.time_out ? 'bg-blue-100 text-blue-800' :
                          session.status === 'approved' ? 'bg-green-100 text-green-800' :
                          session.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {!session.time_out ? 'Active' : 
                           session.status === 'approved' ? 'Approved' :
                           session.status === 'rejected' ? 'Rejected' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {session.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveSession(session._id)}
                              className="btn btn-success btn-xs"
                              title="Approve"
                            >
                              <FiCheckCircle className="w-4 h-4" />
                            </button>
                            {userRole === 'Superadmin' && (
                              <button
                                onClick={() => rejectSession(session._id)}
                                className="btn btn-error btn-xs"
                                title="Reject"
                              >
                                <FiAlertCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-6 py-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, allTimeTrackingSessions.length)} of{" "}
                    {allTimeTrackingSessions.length} entries
                  </span>
                  <div className="join">
                    {Array.from(
                      {
                        length: Math.ceil(
                          allTimeTrackingSessions.length / itemsPerPage
                        ),
                      },
                      (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => paginate(i + 1)}
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

              {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                  <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                    <h2 className="text-lg font-bold mb-4">Generate Report</h2>

                    {/* Dropdown for Report Selection */}
                    <select
                      className="select select-bordered w-full mb-4"
                      value={selectedReportType}
                      onChange={(e) => setSelectedReportType(e.target.value)}
                    >
                      <option value="">Select Report Type</option>
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                    </select>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2">
                      <button
                        className="btn btn-error text-white btn-sm"
                        onClick={() => setIsModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-success text-white btn-sm"
                        disabled={!selectedReportType}
                        onClick={handleGenerateReport}
                      >
                        <IoMdDownload />
                        Download
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

export default AttendanceTime;
