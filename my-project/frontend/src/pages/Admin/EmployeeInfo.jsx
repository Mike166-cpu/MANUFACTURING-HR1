import React, { useEffect, useState } from "react";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import BreadCrumbs from "../../Components/BreadCrumb";
import { HiOutlineArrowNarrowLeft } from "react-icons/hi";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { CiFilter } from "react-icons/ci";
import ExportModal from "../ExportModal";
import { FaDownload } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { VscSettings } from "react-icons/vsc";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

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

const EmployeeInfo = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");

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

  const Breadcrumbs = ({ items }) => {
    return (
      <nav>
        <ol className="list-reset flex">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              <span className="text-blue-800 text-sm font-md">
                {item.label}
              </span>
              {index < items.length - 1 && <span className="mx-2">{">"}</span>}
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  const breadcrumbItems = [{ label: "Employee Records" }, { label: "List" }];

  useEffect(() => {
    document.title = "Employee Records Management";
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [updatedEmployee, setUpdatedEmployee] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 10;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";
  const Local = "http://localhost:7685";

  // FETCH EMPLOYEE
  const fetchEmployees = async () => {
    const gatewayToken = localStorage.getItem("gatewayToken");
    try {
      const response = await axios.get(`${APIBase_URL}/api/hr/employee-data`, {
        headers: { Authorization: `Bearer ${gatewayToken}` },
      });

      console.log("Fetched employees:", response.data);
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employee data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleRowClick = (employee) => {
    setSelectedEmployee(employee);
    setUpdatedEmployee(employee);
    setShowDetails(true);
    setIsEditing(false);
  };

  const handleBackToList = () => {
    setShowDetails(false);
    setSelectedEmployee(null);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedEmployee((prev) => ({ ...prev, [name]: value }));
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      (employee.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.position || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (employee.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.address || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (employee.role || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.gender || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterDepartment === "" || employee.position === filterDepartment;

    return matchesSearch && matchesFilter;
  });

  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(
    indexOfFirstEmployee,
    indexOfLastEmployee
  );
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportClick = () => {
    setIsModalOpen(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    const gatewayToken = localStorage.getItem("gatewayToken");
    try {
      const response = await axios.get(`${APIBase_URL}/api/hr/employee-data`, {
        headers: { Authorization: `Bearer ${gatewayToken}` },
      });

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const allEmployees = response.data;

      if (!Array.isArray(allEmployees) || allEmployees.length === 0) {
        throw new Error("No employees found or invalid data format");
      }

      const data = allEmployees.map((employee) => ({
        Name: employee.name,
        Email: employee.email,
        Position: employee.position,
        Address: employee.address,
        Phone: employee.mobile,
        Gender: employee.gender,
      }));

      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("Employee Account List", 14, 16);

      doc.setFontSize(12);

      const headers = [
        "Employee Name",
        "Email",
        "Position",
        "Address",
        "Phone",
        "Gender",
      ];

      doc.autoTable({
        startY: 30,
        head: [headers],
        body: data.map((employee) => [
          employee.Name,
          employee.Email,
          employee.Position,
          employee.Address,
          employee.Phone,
          employee.Gender,
        ]),
        theme: "striped",
        didDrawPage: (data) => {
          doc.setFontSize(12);
          doc.text("Employee Data - 2024", 14, 10);

          const footerText = `Page ${doc.internal.getNumberOfPages()}`;
          const pageHeight = doc.internal.pageSize.height;
          doc.text(footerText, 14, pageHeight - 10);
        },
      });

      doc.save("Employee-Data-2024.pdf");
    } catch (error) {
      console.error("Error exporting data:", error);
    } finally {
      setIsExporting(false);
      setIsModalOpen(false);
    }
  };

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

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="p-3 border-b">
        <div className="h-4 bg-gray-300 rounded w-24"></div>
      </td>
      <td className="p-3 border-b">
        <div className="h-4 bg-gray-300 rounded w-40"></div>
      </td>
      <td className="p-3 border-b">
        <div className="h-4 bg-gray-300 rounded w-32"></div>
      </td>
      <td className="p-3 border-b">
        <div className="h-4 bg-gray-300 rounded w-20"></div>
      </td>
    </tr>
  );
  

  return (
    <div className=" flex overflow-auto">
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
          <span className="px-4 font-bold text-2xl"> Employee Information</span>
        </div>

        {/* MAIN CONTENT */}
        <div className="min-h-screen p-5 bg-gray-100 flex-1 overflow-y-auto bg-base-500">
          <ToastContainer />

          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 mb-4 px-5">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 justify-start w-full sm:w-2/3">
              {/* Search Input */}
              <input
                type="text"
                placeholder="Search employees"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm p-3 border border-gray-300 rounded-lg w-full sm:w-64 md:w-80 placeholder-black"
              />

              {/* Filter Dropdown */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="no-arrow pl-3 pr-8 p-3 border border-gray-300 rounded-lg w-full sm:w-40 text-sm"
                >
                  <option value="">All Positions</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Reseller">Reseller</option>
                  <option value="Finance">Finance</option>
                  <option value="Administrative">Administrative</option>
                </select>
                <div className="absolute right-2 top-2">
                  <VscSettings className="w-5 h-6" />
                </div>
              </div>
            </div>

            {/* Export and Add Employee Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 items-center sm:ml-4 w-full sm:w-auto">
              {/* Export Button */}
              <button
                className="text-sm flex pt-2 bg-green-700 text-white rounded-lg transition duration-200 ease-in-out text-md h-10 px-4 w-full sm:w-auto"
                onClick={handleExportClick}
              >
                <FaDownload className="mt-1 mr-2" /> Export
              </button>
              <ExportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleExport}
              />
            </div>
          </div>

          <div className="h-full bg-base-500 px-5">
            {loading ? (
              <div className="overflow-auto rounded-lg bg-white pb-10">
                <table className="table-auto w-full pb-5 text-sm">
                  <thead className="bg-white text-gray-500 border-b">
                    <tr>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Position</th>
                      <th className="p-3 text-left">Employee Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(10)].map((_, index) => (
                      <SkeletonRow key={index} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : showDetails ? (
              <div className="mt-6 p-8 border border-gray-200 rounded-lg shadow-xl bg-white">
                <div className="flex justify-between items-center mb-4 pl-5 pt-5">
                  <button
                    className="flex items-center text-blue-800 hover:underline"
                    onClick={handleBackToList}
                  >
                    <HiOutlineArrowNarrowLeft className="mr-2" /> Back
                  </button>

                  <div className="flex space-x-2">
                    <button
                      className="flex items-center text-blue-800 hover:underline"
                      onClick={handleEdit}
                    >
                      <FaEdit className="mr-2" />
                      Edit
                    </button>
                  </div>
                </div>

                <hr className="pb-5" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={selectedEmployee.name}
                      readOnly
                      className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Email
                    </label>
                    <input
                      type="text"
                      value={selectedEmployee.email}
                      readOnly
                      className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Mobile
                    </label>
                    <input
                      type="text"
                      value={selectedEmployee.mobile}
                      readOnly
                      className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      value={selectedEmployee.position}
                      readOnly
                      className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Status
                    </label>
                    <input
                      type="text"
                      value={selectedEmployee.employeeStatus}
                      readOnly
                      className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Gender
                    </label>
                    <input
                      type="text"
                      value={selectedEmployee.gender}
                      readOnly
                      className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={selectedEmployee.address}
                      readOnly
                      className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Joining Date
                    </label>
                    <input
                      type="text"
                      value={new Date(
                        selectedEmployee.joiningDate
                      ).toLocaleDateString()}
                      readOnly
                      className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-auto rounded-lg bg-white pb-10">
                <table className="table-auto w-full pb-5 text-sm">
                  <thead className="bg-white text-gray-500 border-b">
                    <tr>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Position</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEmployees.map((employee, index) => (
                      <tr
                        key={employee._id}
                        className="hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => handleRowClick(employee)}
                      >
                        <td className="p-3 border-b capitalize">
                          {employee.firstName} {employee.lastName}
                        </td>
                        <td className="p-3 border-b">{employee.email}</td>
                        <td className="p-3 border-b">{employee.role}</td>
                        <td className="p-3 border-b">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded 
                              ${
                                employee.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : ""
                              }${
                              employee.status === "terminated"
                                ? "bg-red-100 text-red-700"
                                : ""
                            }${
                              employee.status === "inactive"
                                ? "bg-gray-100 text-gray-700"
                                : ""
                            }`}
                          >
                            {employee.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* ### Added: Pagination Controls ### */}
                <div className="flex justify-center mt-4">
                  <nav className="inline-flex -space-x-px">
                    {/* Previous Button */}
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 ${
                        currentPage === 1 ? "cursor-not-allowed opacity-50" : ""
                      }`}
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1
                    ).map((number) => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`px-3 py-2 leading-tight border border-gray-300 ${
                          currentPage === number
                            ? "text-blue-600 bg-blue-50"
                            : "text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700"
                        }`}
                      >
                        {number}
                      </button>
                    ))}

                    {/* Next Button */}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 ${
                        currentPage === totalPages
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      }`}
                    >
                      Next
                    </button>
                  </nav>
                </div>
                {filteredEmployees.length === 0 && (
                  <p className="text-center text-gray-600 mt-4">
                    No employees found matching your criteria.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeInfo;
