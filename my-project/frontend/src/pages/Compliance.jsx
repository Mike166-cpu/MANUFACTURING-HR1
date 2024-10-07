import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Compliance = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard";

    const token = localStorage.getItem("token");
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const [policies, setPolicies] = useState([
    {
      id: 1,
      title: "Workplace Safety",
      acknowledged: false,
      content:
        "This policy ensures the safety of all employees by following guidelines and best practices in the workplace...",
    },
    {
      id: 2,
      title: "Code of Conduct",
      acknowledged: false,
      content:
        "All employees are expected to maintain high standards of conduct at all times. This policy outlines...",
    },
    {
      id: 3,
      title: "Anti-Harassment Policy",
      acknowledged: false,
      content:
        "Our company is committed to providing a safe, harassment-free environment. This policy details...",
    },
    {
      id: 4,
      title: "Anti-Harassment Policy",
      acknowledged: false,
      content:
        "Our company is committed to providing a safe, harassment-free environment. This policy details...",
    },
    {
      id: 5,
      title: "Anti-Harassment Policy",
      acknowledged: false,
      content:
        "Our company is committed to providing a safe, harassment-free environment. This policy details...",
    },
  ]);

  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const handleAcknowledge = (id) => {
    setPolicies(
      policies.map((policy) =>
        policy.id === id
          ? { ...policy, acknowledged: !policy.acknowledged }
          : policy
      )
    );
  };

  const handleViewPolicy = (id) => {
    const policy = policies.find((policy) => policy.id === id);
    setSelectedPolicy(selectedPolicy?.id === id ? null : policy);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main content area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "ml-80" : "ml-0"
        }`}
      >
        {/* Navbar */}
        <Navbar toggleSidebar={toggleSidebar} className="sticky top-0 z-10" />

        {/* Main content with scrolling */}
        <div className="flex-1 overflow-y-auto bg-base-500">
          <div className="">
            <h2 className="text-3xl font-bold mb-4 pl-5 pt-5">
              Company Policies
            </h2>
          </div>

          {/*MAIN CONTENT */}
          <div className="h-full bg-gray-200">
            <div className="overflow-x-auto p-6 rounded-lg">
              <table className="table w-full bg-gray-100 rounded-lg">
                <thead>
                  <tr className="bg-blue-800 text-white">
                    <th className="rounded-tl-lg">Policy</th>
                    <th>Status</th>
                    <th>Action</th>
                    <th className="rounded-tr-lg">View</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy) => (
                    <React.Fragment key={policy.id}>
                      <tr>
                        <td>{policy.title}</td>
                        <td>
                          <span
                            className={`badge ${
                              policy.acknowledged
                                ? "badge-success"
                                : "badge-warning"
                            }`}
                          >
                            {policy.acknowledged ? "Acknowledged" : "Pending"}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`btn ${
                              policy.acknowledged ? "btn-error" : "btn-primary"
                            } btn-sm`}
                            onClick={() => handleAcknowledge(policy.id)}
                          >
                            {policy.acknowledged ? "Revoke" : "Acknowledge"}
                          </button>
                        </td>
                        <td>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleViewPolicy(policy.id)}
                          >
                            {selectedPolicy?.id === policy.id
                              ? "Hide"
                              : "View Policy"}
                          </button>
                        </td>
                      </tr>
                      {selectedPolicy?.id === policy.id && (
                        <tr>
                          <td colSpan="4" className="p-4 bg-white border-t">
                            <div className="whitespace-pre-wrap">
                              <strong>{policy.title}:</strong> <br />
                              {policy.content}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compliance;
