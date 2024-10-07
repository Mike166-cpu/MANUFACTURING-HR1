import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import { HiOutlineArrowNarrowLeft } from "react-icons/hi";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2"; 

const EmployeeInfo = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard";

    const token = localStorage.getItem("token");
    if (!token) {
      // Show SweetAlert if not logged in
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
    setUpdatedEmployee(employee); // Initialize with the selected employee data
    setShowDetails(true);
    setIsEditing(false); // Set editing to false when showing details
  };

  const handleBackToList = () => {
    setShowDetails(false);
    setSelectedEmployee(null);
    setIsEditing(false); // Reset editing state
  };

  const handleEdit = () => {
    setIsEditing(true); // Enable editing
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedEmployee((prev) => ({ ...prev, [name]: value })); // Update employee state
  };

  const handleUpdate = async () => {
    try {
      console.log("Updating employee with data:", updatedEmployee); // Log the updated data
      await axios.put(
        `http://localhost:5000/api/employee/${selectedEmployee._id}`,
        updatedEmployee
      );
      alert("Employee updated successfully!");
      fetchEmployees(); // Refresh the employee list
      handleBackToList(); // Go back to the employee list
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("Failed to update employee.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        console.log("Deleting employee with ID:", id); // Log the ID to be deleted
        await axios.delete(`http://localhost:5000/api/employee/${id}`);
        alert("Employee deleted successfully!");
        fetchEmployees(); // Refresh the employee list
        handleBackToList(); // Go back to the employee list
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert("Failed to delete employee.");
      }
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "ml-80" : "ml-0"
        }`}
      >
        <Navbar toggleSidebar={toggleSidebar} className="sticky top-0 z-10" />
        <div className="flex-1 overflow-y-auto bg-base-500">
          <div className="">
            <h2 className="text-3xl font-bold mb-4 pl-5 pt-5">Employee List</h2>
          </div>

          <div className="h-full bg-gray-100 p-6">
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
                      onClick={handleDelete} // Make sure to change the function to handleDelete
                    >
                      <FaTrash className="mr-2" />{" "}
                      {/* Assuming you want a trash icon for Delete */}
                      Delete
                    </button>
                  </div>
                </div>

                <hr className="pb-5" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/*FIRSNAME*/}
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
                  {/*LASTNAME*/}
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
                            Select department
                          </option>
                          {["Male", "Female", "Other"].map(
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
              <div className="overflow-x-auto rounded-lg shadow-lg bg-white">
                <table className="table-auto w-full">
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
                    {employees.map((employee, index) => (
                      <tr
                        key={employee._id}
                        className="hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => handleRowClick(employee)}
                      >
                        <td className="p-3 border-b">{index + 1}</td>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeInfo;
