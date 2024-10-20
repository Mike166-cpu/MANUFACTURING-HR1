import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import { HiOutlineArrowNarrowLeft } from "react-icons/hi";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { CiFilter } from "react-icons/ci";
import * as XLSX from "xlsx";
import ExportModal from "./ExportModal";
import { FaDownload } from "react-icons/fa";

const EmployeeInfo = () => {
  const navigate = useNavigate();

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
              <span className="text-blue-800 text-sm font-medium">{item.label}</span>
              {index < items.length - 1 && <span className="mx-2">{">"}</span>}
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  const breadcrumbItems = [{ label: "Employee Records" }, { label: "List"}];


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

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/employee");
      console.log("Response data:", response.data);
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
      console.log("Updating employee with data:", updatedEmployee); 
      await axios.put(
        `http://localhost:5000/api/employee/${selectedEmployee._id}`,
        updatedEmployee
      );
      alert("Employee updated successfully!");
      fetchEmployees(); 
      handleBackToList(); 
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("Failed to update employee.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        console.log("Deleting employee with ID:", id); 
        await axios.delete(`http://localhost:5000/api/employee/${id}`);
        alert("Employee deleted successfully!");
        fetchEmployees(); 
        handleBackToList(); 
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert("Failed to delete employee.");
      }
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.employee_firstname
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      employee.employee_lastname
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      employee.employee_username
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      employee.employee_email
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      employee.employee_phone
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      employee.employee_department
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
      const response = await axios.get("http://localhost:5000/api/employee");

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const allEmployees = response.data;

      if (!Array.isArray(allEmployees) || allEmployees.length === 0) {
        throw new Error("No employees found or invalid data format");
      }

      const data = allEmployees.map((employee) => ({
        FirstName: employee.employee_firstname,
        LastName: employee.employee_lastname,
        Username: employee.employee_username,
        Email: employee.employee_email,
        Phone: employee.employee_phone,
        Department: employee.employee_department,
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

      XLSX.writeFile(workbook, "Employee-data-2024.xlsx");
    } catch (error) {
      console.error("Error exporting data:", error);
    } finally {
      setIsExporting(false); 
      setIsModalOpen(false); 
    }
  };

  return (
    <div className="flex h-screen overflow-auto">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "ml-80" : "ml-0"
        }`}
      >
        <Navbar toggleSidebar={toggleSidebar} className="sticky top-0 z-10" />
        <div className="flex-1 overflow-y-auto bg-base-500">
          <div className="border-2 m-5 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 pl-5 pt-5 pb-2">
              Employee List
              <Breadcrumbs items={breadcrumbItems} />
            </h2>
          </div>

          <div className="flex flex-col md:flex-row justify-end mb-4 px-5 items-end gap-1">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2 md:mb-0 p-2 border border-gray-300 rounded-lg w-full md:w-1/4"
            />

            {/* Filter Dropdown */}
            <div className="relative">
              <div className="absolute left-2 top-2">
                <CiFilter className="w-5 h-6" />
              </div>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="pl-8 p-2 border border-gray-300 rounded-lg w-10"
              >
                <option value="">Select </option>
                <option value="HR">HR</option>
                <option value="Sales">Sales</option>
                <option value="Engineering">Engineering</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            <button
              className="flex bg-green-700 text-white rounded-lg hover:bg-green-700 transition duration-200 ease-in-out text-md h-10 pt-2 px-2"
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
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="p-3 text-left">Number</th>
                      <th className="p-3 text-left">First Name</th>
                      <th className="p-3 text-left">Last Name</th>
                      <th className="p-3 text-left">Username</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Phone</th>
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
                        <td className="p-3 border-b">
                          {indexOfFirstEmployee + index + 1}
                        </td>
                        <td className="p-3 border-b">
                          {employee.employee_firstname}
                        </td>
                        <td className="p-3 border-b">
                          {employee.employee_lastname}
                        </td>
                        <td className="p-3 border-b">
                          {employee.employee_username}
                        </td>
                        <td className="p-3 border-b">
                          {employee.employee_email}
                        </td>
                        <td className="p-3 border-b">
                          {employee.employee_phone}
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
\               {filteredEmployees.length === 0 && (
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
