import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

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

const Onboarding = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");

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

  const handleResize = () => {
    setIsSidebarOpen(window.innerWidth >= 768);
  };

  useEffect(() => {
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div
          className={`flex-grow transition-all duration-300 ease-in-out ${
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

          {/* MAIN CONTENT */}
          <div className="p-8 space-y-6">
            <h1 className=" bg-white p-5 rounded-lg shadow-sm text-2xl font-extrabold text-start text-gray-800 mb-8">
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

          </div>

          {/* END OF MAIN CONTENT */}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
