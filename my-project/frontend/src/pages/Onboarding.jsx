import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import { HiOutlineArrowNarrowLeft } from "react-icons/hi";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { CiFilter } from "react-icons/ci";

const Onboarding = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard";

    const token = sessionStorage.getItem("adminToken");
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
    document.title = "Onboarding";
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [newHireData, setNewHireData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    jobTitle: "",
    startDate: "",
    department: "",
    supervisor: "",
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleChange = (e) => {
    setNewHireData({ ...newHireData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add logic to handle the form submission
    console.log("New Hire Data Submitted:", newHireData);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            isSidebarOpen ? "ml-80" : "ml-0"
          }`}
        >
          <Navbar toggleSidebar={toggleSidebar} />

          {/* MAIN CONTENT */}
          <div className="p-8 space-y-6">
            <h1 className="text-2xl font-extrabold text-start text-gray-800 mb-8">
              Onboarding Process
            </h1>

            {/* Step 1: Personal Information */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Add New Hire
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(newHireData).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {key.charAt(0).toUpperCase() +
                          key.slice(1).replace(/([A-Z])/g, " $1")}
                      </label>
                      <input
                        type={
                          key === "startDate"
                            ? "date"
                            : key === "email"
                            ? "email"
                            : "text"
                        }
                        name={key}
                        value={value}
                        onChange={handleChange}
                        required
                        className="w-full border-2 border-blue-500 rounded-lg shadow-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder={
                          key === "startDate"
                            ? undefined
                            : key.charAt(0).toUpperCase() +
                              key.slice(1).replace(/([A-Z])/g, " $1")
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <button
                    type="submit"
                    className="w-1/4 bg-blue-800 text-white text-md py-3 rounded-md hover:bg-blue-700 transition duration-200 "
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>

            {/* Onboarding Checklist */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Onboarding Checklist
              </h2>
              <ul className="list-disc list-inside space-y-2 text-sm  text-gray-700">
                {[
                  "Complete Orientation",
                  "Set Up Company Email",
                  "Introduction to Team",
                  "HR Policies Review",
                  "Complete Training Modules",
                  "Complete Tax Forms",
                  "Schedule 1-on-1 with Supervisor",
                ].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 w-5 h-5 text-blue-600"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Documentation Upload */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Required Documents
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Upload the following documents:
              </p>
              <div className="space-y-4">
                {["Resume", "ID Proof", "Tax Forms", "Signed Offer Letter"].map(
                  (document) => (
                    <div key={document}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {document}
                      </label>
                      <input
                        type="file"
                        className="w-full border-2 border-blue-500 rounded-lg shadow-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Feedback and Evaluation */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Onboarding Feedback
              </h2>
              <form>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Overall Experience Rating
                  </label>
                  <select
                    className="w-full border-2 border-blue-500 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  >
                    <option value="">Select a rating</option>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Feedback Comments
                  </label>
                  <textarea
                    className="w-full border-2 border-blue-500 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    rows="4"
                    placeholder="Enter your feedback here..."
                    required
                  ></textarea>
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-[10 0p] bg-blue-600 text-white text-sm p-3 rounded-md hover:bg-blue-700 transition duration-200 shadow-lg"
                  >
                    Submit Feedback
                  </button>
                </div>
              </form>
            </div>
          </div>
          <footer className="bg-white text-black p-4 text-end ">
            <p className="text-xs">© 2024 JJM MANUFACTURING. All rights reserved.</p>
          </footer>
          {/* END OF MAIN CONTENT */}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
