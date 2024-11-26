import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
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

const Compliance = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [viewMode, setViewMode] = useState("view");
  const [policies, setPolicies] = useState([]);
  const [editingPolicy, setEditingPolicy] = useState(null);
  
  useEffect(() => {
    document.title = "Compliance";
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
    fetchPolicies();
  }, [navigate]);

  const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";

  const fetchPolicies = () => {
    axios
      .get(`${APIBase_URL}/api/policies/fetch`)
      .then((response) => {
        setPolicies(response.data);
      })
      .catch((error) => {
        console.error("Error fetching policies:", error);
      });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCreatePolicy = (newPolicy) => {
    axios
      .post(`${APIBase_URL}/api/policies/create`, newPolicy)
      .then((response) => {
        console.log("Policy created:", response.data);
        fetchPolicies(); // Refresh policies after creation

        Swal.fire({
          title: "Success!",
          text: "Policy created successfully.",
          icon: "success",
          confirmButtonText: "OK",
        });
      })
      .catch((error) => {
        console.error("Error creating policy:", error);
      });
  };

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setViewMode("edit");
  };

  const handleUpdatePolicy = (updatedPolicy) => {
    axios
      .put(
        `${APIBase_URL}/api/policies/update/${updatedPolicy._id}`,
        updatedPolicy
      )
      .then((response) => {
        console.log("Policy updated:", response.data);
        fetchPolicies();

        Swal.fire({
          title: "Updated!",
          text: "Policy updated successfully.",
          icon: "success",
          confirmButtonText: "OK",
        });

        setEditingPolicy(null);
        setViewMode("view");
      })
      .catch((error) => {
        console.error("Error updating policy:", error);
      });
  };

  const handleDeletePolicy = (policyId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${APIBase_URL}/api/policies/delete/${policyId}`)
          .then((response) => {
            console.log("Policy deleted:", response.data);
            fetchPolicies();

            Swal.fire({
              title: "Deleted!",
              text: "Policy has been deleted.",
              icon: "success",
              confirmButtonText: "OK",
            });
          })
          .catch((error) => {
            console.error("Error deleting policy:", error);
          });
      }
    });
  };

  const Breadcrumbs = ({ items }) => {
    return (
      <nav>
        <ol className="list-reset flex flex-wrap mb-4">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              <span className="text-blue-800 text-xs md:text-base font-bold truncate">
                {item.label}
              </span>
              {index < items.length - 1 && (
                <span className="font-md text-xs mx-2 md:text-base">{">"}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  const breadcrumbItems = [
    { label: "HR Compliance" },
    { label: viewMode === "create" ? "Create Policy" : "View Policy" },
  ];

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
    <div className="flex h-screen bg-gray-100 dark:bg-white">
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

        <div className="flex-1 overflow-y-auto bg-base-500">
          <div className="m-5 border rounded-md shadow-sm p-5 bg-white">
            <Breadcrumbs className="pl-5 font-md" items={breadcrumbItems} />
            <h2 className="text-2xl font-bold ">Company Policies</h2>
          </div>

          <div className="p-6">
            <div className="flex space-x-4 mb-4 justify-end items-end">
              <button
                className={`px-4 py-2 rounded-md ${
                  viewMode === "view" ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setViewMode("view")}
              >
                View Policies
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  viewMode === "create"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => {
                  setViewMode("create");
                  setEditingPolicy(null);
                }}
              >
                Create Policy
              </button>
            </div>

            {viewMode === "view" ? (
              <div className="overflow-x-auto">
                {policies.length === 0 ? (
                  <p>No policies available. Please create one.</p>
                ) : (
                  <table className="min-w-full border border-gray-300 bg-white">
                    <thead>
                      <tr className="bg-gray">
                        <th className="border px-4 py-2 text-start">Title</th>
                        <th className="border px-4 py-2 text-start">
                          Description
                        </th>
                        <th className="border px-4 py-2 text-start">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {policies.map((policy, index) => (
                        <tr key={index} className="hover:bg-gray-100">
                          <td className="border px-4 py-2 font-bold">
                            {policy.title}
                          </td>
                          <td className="border px-4 py-2">
                            <div className="p-2 bg-gray-100 rounded-md">
                              {policy.description}
                            </div>
                          </td>
                          <td className="px-4 py-2 flex">
                            <button
                              className="text-blue-500"
                              onClick={() => handleEditPolicy(policy)}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-500 ml-2"
                              onClick={() => handleDeletePolicy(policy._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <CreatePolicyForm
                onCreate={
                  viewMode === "create"
                    ? handleCreatePolicy
                    : handleUpdatePolicy
                }
                initialPolicy={editingPolicy}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CreatePolicyForm = ({ onCreate, initialPolicy }) => {
  const [title, setTitle] = useState(initialPolicy ? initialPolicy.title : "");
  const [description, setDescription] = useState(
    initialPolicy ? initialPolicy.description : ""
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const newPolicy = { title, description };
    onCreate(
      initialPolicy ? { ...newPolicy, _id: initialPolicy._id } : newPolicy
    );
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-md p-5 bg-gray-50">
      <div className="mb-4">
        <label className="block text-gray-700">Policy Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 p-2 border rounded-md w-full"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Policy Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="mt-1 p-2 border rounded-md w-full"
        ></textarea>
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded-md"
      >
        {initialPolicy ? "Update Policy" : "Create Policy"}
      </button>
    </form>
  );
};

export default Compliance;
