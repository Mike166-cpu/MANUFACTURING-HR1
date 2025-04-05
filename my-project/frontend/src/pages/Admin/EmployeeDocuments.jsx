import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import BreadCrumbs from "../../Components/BreadCrumb";
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

const EmployeeDocuments = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const navigate = useNavigate();
  const [modalDocument, setModalDocument] = useState(null);
  const [loading, setLoading] = useState(false);

  const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";

  useEffect(() => {
    document.title = "Employee Documents";

    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/login");
    } else {
      fetchEmployees();
    }
  }, [navigate]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${APIBase_URL}/api/employee`);
      if (Array.isArray(response.data)) {
        setEmployees(response.data);
      } else {
        console.error("Error: Expected an array of employees.");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (employeeId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${APIBase_URL}/api/documents?employeeId=${employeeId}`
      );
      setDocuments(response.data);
      setSelectedEmployee(employeeId);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleBackButton = () => {
    setSelectedEmployee(null);
    setDocuments([]);
  };

  const openModal = (doc) => setModalDocument(doc);
  const closeModal = () => setModalDocument(null);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`flex-grow transition-all duration-300 ${
          isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
        }`}
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
          <span className="px-4 font-bold text-2xl"> Dashboard Overview</span>
        </div>

        <div className="p-6 min-h-screen bg-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
            Employee Documents
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            {loading ? (
              <div className="flex justify-center items-center w-full h-32">
                <div className="dotted-circle"></div>
              </div>
            ) : !selectedEmployee ? (
              <div className="flex-1 min-h-screen bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="table-auto w-full text-left">
                  <thead className="bg dark:bg-gray-700">
                    <tr>
                      <th className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        Employee ID
                      </th>
                      <th className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        Employee Name
                      </th>
                      <th className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        Department
                      </th>
                      <th className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr className=" dark:hover:bg-gray-700 transition-colors">
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                          {employee.employee_id}
                        </td>
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200 capitalize">
                          {employee.employee_firstname}{" "}
                          {employee.employee_lastname}
                        </td>
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                          {employee.employee_department}
                        </td>
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                          <button
                            className="bg-blue-500 hover:bg-blue-200 hover:text-blue-800 hover:underline text-white rounded-lg p-2 cursor-pointer"
                            key={employee._id}
                            onClick={() => fetchDocuments(employee.employee_id)}
                          >
                            View Documents
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                <button
                  onClick={handleBackButton}
                  className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
                >
                  Back to Employees
                </button>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-4">
                  Documents for Employee ID: {selectedEmployee}
                </h3>
                {documents.length > 0 ? (
                  <ul className="list-disc pl-5 mt-4">
                    {documents.map((doc) => (
                      <li key={doc._id}>
                        <button
                          onClick={() => openModal(doc)}
                          className="text-blue-500 hover:underline"
                        >
                          {doc.filename}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 mt-4">
                    No documents found for this employee.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        {modalDocument && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-3xl w-full">
              <button
                onClick={closeModal}
                className="absolute top-5 right-5 bg-white dark:bg-gray-700 text-black dark:text-white px-4 py-2 rounded-full"
              >
                Close
              </button>
              <h3 className="text-xl font-semibold mb-4">
                {modalDocument.filename}
              </h3>
              <iframe
                src={`${APIBase_URL}/${modalDocument.path}`}
                className="w-full h-[400px]"
                title={modalDocument.filename}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDocuments;
