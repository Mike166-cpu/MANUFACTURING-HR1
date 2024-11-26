import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import { HiOutlineArrowNarrowLeft } from "react-icons/hi";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { CiFilter } from "react-icons/ci";
import ExportModal from "./ExportModal";
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
  const LOCAL_URL = "http://localhost:5000";

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${APIBase_URL}/api/employee`);
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

  const handleUpdate = async () => {
    try {
      const response = await axios.put(
        `${APIBase_URL}/api/employee/${selectedEmployee._id}`,
        updatedEmployee
      );
      toast.success("Employee updated successfully!", {
        position: "top-right",
      });
      fetchEmployees();
      handleBackToList();
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("Failed to update employee.");
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this employee?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${APIBase_URL}/api/employee/${id}`
          );
          toast.success("Employee deleted successfully!", {
            position: "top-right",
          });
          fetchEmployees();
          handleBackToList();
        } catch (error) {
          console.error("Error deleting employee:", error);
          Swal.fire("Error", "Failed to delete employee.", "error");
        }
      }
    });
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      (employee.employee_firstname || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (employee.employee_lastname || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (employee.employee_username || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (employee.employee_email || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (employee.employee_phone || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (employee.employee_department || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (employee.employee_id || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesFilter = filterDepartment
      ? employee.employee_department === filterDepartment
      : true;

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
    try {
      const response = await axios.get(`${APIBase_URL}/api/employee`);

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const allEmployees = response.data;

      if (!Array.isArray(allEmployees) || allEmployees.length === 0) {
        throw new Error("No employees found or invalid data format");
      }

      const data = allEmployees.map((employee) => ({
        EmployeeID: employee.employee_id,
        FirstName: employee.employee_firstname,
        LastName: employee.employee_lastname,
        Username: employee.employee_username,
        Email: employee.employee_email,
        Department: employee.employee_department,
      }));

      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("Employee Account List", 14, 16);

      doc.setFontSize(12);

      const headers = [
        "Employee ID",
        "First Name",
        "Last Name",
        "Username",
        "Email",
        "Department",
      ];

      doc.autoTable({
        startY: 30,
        head: [headers],
        body: data.map((employee) => [
          employee.EmployeeID,
          employee.FirstName,
          employee.LastName,
          employee.Username,
          employee.Email,
          employee.Department,
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

        <div className="min-h-screen p-5 bg-gray-100 flex-1 overflow-y-auto bg-base-500">
          <div className="flex border-2 m-5 rounded-lg bg-white">
            <h2 className="text-2xl font-bold mb-4 pl-5 pt-5 pb-2">
              <Breadcrumbs items={breadcrumbItems} />
              Employee List
            </h2>
          </div>

          <ToastContainer />

          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 mb-4 px-5">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 justify-start w-full sm:w-2/3">
              {/* Search Input */}
              <input
                type="text"
                placeholder="Search employees, department, id"
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
                  <option value="">Filter</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Logistics">Logistics</option>
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

              {/* Add Employee Button */}
              <Link
                to="/addemployee"
                className="text-sm flex pt-2 bg-blue-700 text-white rounded-lg transition duration-200 ease-in-out text-md h-10 px-4 w-full sm:w-auto"
              >
                Add Employee
              </Link>
            </div>
          </div>

          <div className="h-full bg-base-500 px-5">
            {loading ? (
              <p className="text-center text-lg text-gray-600">
                Loading employees...
              </p>
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

                    <button
                      className="flex items-center text-blue-800 hover:underline"
                      onClick={() => handleDelete(selectedEmployee._id)} // Pass the ID correctly
                    >
                      <FaTrash className="mr-2" /> Delete
                    </button>
                  </div>
                </div>

                <hr className="pb-5" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Employee ID
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="employee_id"
                        value={updatedEmployee.employee_id}
                        onChange={handleChange}
                        className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                      />
                    ) : (
                      <input
                        type="text"
                        value={selectedEmployee.employee_id}
                        readOnly
                        className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                      />
                    )}
                  </div>
                  {/*FIRST NAME*/}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      First Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="employee_firstname"
                        value={updatedEmployee.employee_firstname}
                        onChange={handleChange}
                        className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                      />
                    ) : (
                      <input
                        type="text"
                        value={selectedEmployee.employee_firstname}
                        readOnly
                        className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                      />
                    )}
                  </div>
                  {/*LAST NAME*/}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Last Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="employee_lastname"
                        value={updatedEmployee.employee_lastname}
                        onChange={handleChange}
                        className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                      />
                    ) : (
                      <input
                        type="text"
                        value={selectedEmployee.employee_lastname}
                        readOnly
                        className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                      />
                    )}
                  </div>

                  {/*SUFFIX*/}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Suffix
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="employee_suffix"
                        value={updatedEmployee.employee_suffix}
                        onChange={handleChange}
                        className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                      />
                    ) : (
                      <input
                        type="text"
                        value={selectedEmployee.employee_suffix}
                        readOnly
                        className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                      />
                    )}
                  </div>

                  {/*USERNAME*/}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Username
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="employee_username"
                        value={updatedEmployee.username}
                        onChange={handleChange}
                        className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                      />
                    ) : (
                      <input
                        type="text"
                        value={selectedEmployee.employee_username}
                        readOnly
                        className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                      />
                    )}
                  </div>

                  {/*PHONE NUMBER*/}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Contact Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="employee_phone"
                        value={updatedEmployee.phone}
                        onChange={handleChange}
                        className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                      />
                    ) : (
                      <input
                        type="text"
                        value={selectedEmployee.employee_phone}
                        readOnly
                        className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                      />
                    )}
                  </div>

                  {/*ADDRESS*/}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Address
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="employee_address"
                        value={updatedEmployee.address}
                        onChange={handleChange}
                        className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                      />
                    ) : (
                      <input
                        type="text"
                        value={selectedEmployee.employee_address}
                        readOnly
                        className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                      />
                    )}
                  </div>

                  {/*GENDER*/}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Gender
                    </label>
                    {isEditing ? (
                      <div className="form-control mt-4">
                        <select
                          name="employee_gender"
                          value={updatedEmployee.employee_gender}
                          onChange={handleChange}
                          className="select select-bordered"
                          required
                        >
                          <option value="" disabled>
                            Select gender
                          </option>
                          {["Male", "Female", "Other"].map((gender, idx) => (
                            <option key={idx} value={gender}>
                              {gender}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={selectedEmployee.employee_gender}
                        readOnly
                        className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                      />
                    )}
                  </div>

                  {/*DEPARTMENT*/}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Department
                    </label>
                    {isEditing ? (
                      <div className="form-control mt-4">
                        <select
                          name="employee_department"
                          value={updatedEmployee.employee_department}
                          onChange={handleChange}
                          className="select select-bordered"
                          required
                        >
                          <option value="" disabled>
                            Select department
                          </option>
                          {["HR", "Sales", "Engineering", "Marketing"].map(
                            (dept, idx) => (
                              <option key={idx} value={dept}>
                                {dept}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={selectedEmployee.employee_department}
                        readOnly
                        className="p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800"
                      />
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4">
                    <button
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 ease-in-out"
                      onClick={handleUpdate}
                    >
                      Update Employee
                    </button>
                    <button
                      className="ml-2 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200 ease-in-out"
                      onClick={handleBackToList}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div></div>
                )}
              </div>
            ) : (
              <div className="overflow-auto rounded-lg bg-white pb-10">
                <table className="table-auto w-full pb-5 text-sm">
                  <thead className="bg-green-600 text-white">
                    <tr>
                      <th className="p-3 text-left">Employee ID</th>
                      <th className="p-3 text-left">Full Name</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEmployees.map((employee, index) => (
                      <tr
                        key={employee._id}
                        className="hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => handleRowClick(employee)}
                      >
                        <td className="p-3 border-b">{employee.employee_id}</td>
                        <td className="p-3 border-b capitalize">
                          {employee.employee_firstname}{" "}
                          {employee.employee_lastname}
                        </td>
                        <td className="p-3 border-b">
                          {employee.employee_email}
                        </td>
                        <td className="p-3 border-b">
                          {employee.employee_department}
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
