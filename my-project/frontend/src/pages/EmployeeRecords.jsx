import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import axios from "axios"; // Make sure to install axios

const EmployeeRecords = () => {
  useEffect(() => {
    document.title = "Employee Records Management";
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div
          className={`flex-1 transition-all duration-300 ${
            isSidebarOpen ? "ml-80" : "ml-0"
          }`}
        >
          <Navbar toggleSidebar={toggleSidebar} />

          {/* MAIN CONTENT */}
          <div className="p-4">
            <h1 className="text-2xl font-bold pb-6">Employee Records Management</h1>
            {loading ? (
              <p>Loading employees...</p>
            ) : (
              <div className="overflow-x-auto rounded-md">
                <table className="table w-full">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th>Number</th> {/* Added numbering header */}
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee, index) => (
                      <tr
                        key={employee._id}
                        className="bg-white hover:bg-gray-200 transition-colors"
                      >
                        <td className="p-2">{index + 1}</td> {/* Row number */}
                        <td className="p-2">{employee.employee_firstname}</td>
                        <td className="p-2">{employee.employee_lastname}</td>
                        <td className="p-2">{employee.employee_username}</td>
                        <td className="p-2">{employee.employee_email}</td>
                        <td className="p-2">{employee.employee_phone}</td>
                        <td className="p-2">{employee.employee_department}</td>
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

export default EmployeeRecords;
