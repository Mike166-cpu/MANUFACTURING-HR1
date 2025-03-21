import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";

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

const Offboarding = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Offboarding";

    const token = sessionStorage.getItem("adminToken");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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
    <div>
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

          {/*MAIN CONTENT*/}
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Offboarding</h1>
            <form className="bg-white shadow-md rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    className="mt-1 p-2 border border-gray-300 rounded w-full"
                    placeholder="Enter employee's name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold">
                    Employee Email
                  </label>
                  <input
                    type="email"
                    className="mt-1 p-2 border border-gray-300 rounded w-full"
                    placeholder="Enter employee's email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold">
                    Last Working Day
                  </label>
                  <input
                    type="date"
                    className="mt-1 p-2 border border-gray-300 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold">
                    Reason for Leaving
                  </label>
                  <textarea
                    className="mt-1 p-2 border border-gray-300 rounded w-full"
                    placeholder="Enter reason for leaving"
                    rows="4"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold">
                    Exit Interview Notes
                  </label>
                  <textarea
                    className="mt-1 p-2 border border-gray-300 rounded w-full"
                    placeholder="Enter exit interview notes"
                    rows="4"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Submit Offboarding
                </button>
              </div>
            </form>
          </div>
          {/*END MAIN CONTENT*/}
        </div>
      </div>
    </div>
  );
};

export default Offboarding;
