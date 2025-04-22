import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import axios from "axios";
import BreadCrumbs from "../../Components/BreadCrumb";
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

const Policies = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const adminToken = localStorage.getItem("adminToken");
  const gatewayToken = localStorage.getItem("gatewayToken");
  const role = localStorage.getItem("role");

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

  //MAIN FUNCTION
  const [acknowledged, setAcknowledged] = useState([]);

  useEffect(() => {
    document.title = "Policies | JJM HRMS";
    fetchPolicies();
  }, []);

  //CREATE POLICIES
  const [form, setForm] = useState({ title: "", description: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPolicies, setSelectedPolicies] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleCreate = async () => {
    if (!form.title || !form.description) {
      return Swal.fire(
        "Missing Fields",
        "Please fill in all fields.",
        "warning"
      );
    }

    try {
      if (editingId) {
        const res = await axios.put(`${APIBASED_URL}/api/policies/update/${editingId}`, form);
        Swal.fire('Success', 'Policy updated successfully', 'success');
      } else {
        const res = await axios.post(`${APIBASED_URL}/api/policies/create`, form);
        Swal.fire("Success", res.data.message, "success");
      }
      setForm({ title: "", description: "" });
      setIsModalOpen(false); // Close modal after success
      setEditingId(null);
      fetchPolicies();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to process policy",
        "error"
      );
    }
  };

  const handleCheckboxChange = (policyId) => {
    setSelectedPolicies(prev => 
      prev.includes(policyId) 
        ? prev.filter(id => id !== policyId)
        : [...prev, policyId]
    );
  };

  const handleDelete = async (id) => {
    try {
      await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      }).then(async (result) => {
        if (result.isConfirmed) {
          await axios.delete(`${APIBASED_URL}/api/policies/delete/${id}`);
          Swal.fire('Deleted!', 'Policy has been deleted.', 'success');
          fetchPolicies();
        }
      });
    } catch (error) {
      Swal.fire('Error', 'Failed to delete policy', 'error');
    }
  };

  const handleEdit = async (policy) => {
    setForm({ title: policy.title, description: policy.description });
    setEditingId(policy._id);
    setIsModalOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedPolicies.length === 0) {
      return Swal.fire('Info', 'No policies selected', 'info');
    }

    try {
      await Swal.fire({
        title: 'Delete selected policies?',
        text: `You are about to delete ${selectedPolicies.length} policies`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete them!'
      }).then(async (result) => {
        if (result.isConfirmed) {
          // In a real app you'd have a bulk delete API endpoint
          for (const id of selectedPolicies) {
            await axios.delete(`${APIBASED_URL}/api/policies/delete/${id}`);
          }
          Swal.fire('Deleted!', 'Selected policies have been deleted.', 'success');
          setSelectedPolicies([]);
          fetchPolicies();
        }
      });
    } catch (error) {
      Swal.fire('Error', 'Failed to delete policies', 'error');
    }
  };

  //FETCH POLICIES
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPolicies = async () => {
    try {
      const res = await axios.get(`${APIBASED_URL}/api/policies/fetch`);
      setPolicies(res.data);
    } catch (error) {
      console.error("Error fetching policies:", error);
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPolicies = policies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(policies.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="bg-base-100">
      <div className="flex min-h-screen">
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

          {/* BREADCRUMBS */}
          <div className="bg-base-100 pb-4 px-5 shadow-sm">
            <BreadCrumbs />
            <div className="flex justify-between items-center px-4">
              <span className="font-bold text-2xl">Company Policy</span>
              <div className="flex gap-2">
                {selectedPolicies.length > 0 && (
                  <button 
                    onClick={handleBulkDelete}
                    className="btn btn-error btn-sm"
                  >
                    Delete Selected
                  </button>
                )}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn btn-primary"
                >
                  Create New Policy
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-base-200 min-h-screen">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                  </div>
                ) : policies.length === 0 ? (
                  <div className="alert alert-info">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>No policies found. Create your first policy!</span>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full">
                        <thead>
                          <tr>
                            <th>
                              <label>
                                <input
                                  type="checkbox"
                                  onChange={() => {
                                    const allIds = policies.map(policy => policy._id);
                                    setSelectedPolicies(selectedPolicies.length === policies.length ? [] : allIds);
                                  }}
                                  checked={selectedPolicies.length === policies.length && policies.length > 0}
                                />
                              </label>
                            </th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentPolicies.map((policy) => (
                            <tr key={policy._id} className={selectedPolicies.includes(policy._id) ? 'bg-base-200' : ''}>
                              <td>
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={selectedPolicies.includes(policy._id)}
                                    onChange={() => handleCheckboxChange(policy._id)}
                                  />
                                </label>
                              </td>
                              <td>
                                <div className="font-medium">{policy.title}</div>
                              </td>
                              <td>
                                <div className="line-clamp-2">{policy.description}</div>
                              </td>
                              <td>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEdit(policy)}
                                    className="btn btn-outline btn-info btn-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(policy._id)}
                                    className="btn btn-outline btn-error btn-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-base-content/70">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, policies.length)} of {policies.length} entries
                      </div>
                      <div className="join">
                        <button 
                          className="join-item btn btn-sm" 
                          onClick={() => paginate(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          «
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          // Show pages around current page
                          let pageNum = currentPage;
                          if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          // Ensure pageNum is within bounds
                          if (pageNum > 0 && pageNum <= totalPages) {
                            return (
                              <button 
                                key={pageNum}
                                className={`join-item btn btn-sm ${currentPage === pageNum ? 'btn-active' : ''}`}
                                onClick={() => paginate(pageNum)}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                          return null;
                        })}
                        <button 
                          className="join-item btn btn-sm" 
                          onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          »
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Create/Edit Policy */}
      {isModalOpen && (
        <>
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg">{editingId ? 'Edit Policy' : 'Create New Policy'}</h3>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Title</span>
                </label>
                <input
                  type="text"
                  placeholder="Policy Title"
                  className="input input-bordered w-full"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="form-control w-full mt-4">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  placeholder="Policy Description"
                  className="textarea textarea-bordered w-full"
                  rows="4"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="modal-action">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="btn btn-primary"
                >
                  {editingId ? 'Update Policy' : 'Create Policy'}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}></div>
        </>
      )}
    </div>
  );
};

export default Policies;