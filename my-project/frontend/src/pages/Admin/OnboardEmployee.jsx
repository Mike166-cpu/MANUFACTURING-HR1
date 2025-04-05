import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import axios from "axios";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import moment from "moment";
import Swal from "sweetalert2";
import Breadcrumbs from "../../Components/BreadCrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const socket = io("http://localhost:7685");
socket.on("connect", () => console.log("Connected to WebSocket"));
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

const OnboardEmployee = () => {
  const navigate = useNavigate();
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const adminToken = localStorage.getItem("adminToken");

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

  const [applicants, setApplicants] = useState([]);

  useEffect(() => {
    fetcApplicant();
  }, []);

  const fetcApplicant = async () => {
    try {
      const response = await axios.get(`${LOCAL}/api/onboarding/applicant`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const nonArchivedApplicants = response.data.filter(
        (applicant) => !applicant.archived
      );
      console.log(response.data);
      setApplicants(nonArchivedApplicants);
    } catch (error) {
      console.error("Error fetching applicants:", error);
    }
  };

  const onboardApplicant = async (applicant) => {
    try {
      console.log("Sending applicant:", applicant);

      const response = await axios.post(
        `${LOCAL}/api/onboarding/accept`,
        { applicant },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      console.log("Onboard Response:", response.data);
      toast.success("Applicant onboarded successfully!");
      fetcApplicant();
    } catch (error) {
      console.error("Onboarding error:", error.response?.data || error.message);
      toast.error("Failed to onboard applicant.");
    }
  };

  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const modalRef = useRef(null);
  const openModal = (applicant) => {
    setSelectedApplicant(applicant);
    if (modalRef.current) {
      modalRef.current.showModal();
    }
  };

  //archive applicant
  const archiveApplicant = async (applicant) => {
    try {
      await axios.post(
        `${LOCAL}/api/onboarding/archive`,
        { applicantId: applicant._id },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      setApplicants((prevApplicants) =>
        prevApplicants.filter((app) => app._id !== applicant._id)
      );
      toast.success("Employee archived successfully!");

      toast.success("Applicant archived successfully!");
      fetcApplicant(); // Refresh the list
    } catch (error) {
      console.error("Archiving error:", error.response?.data || error.message);
      toast.error("Failed to archive applicant.");
    }
  };

  return (
    <div>
      <ToastContainer />
      <div className="flex min-h-screen bg-base-200">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div
          className={`flex-grow transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
          } relative`}
        >
          <Navbar toggleSidebar={toggleSidebar} />
          {isSidebarOpen && isMobileView && (
            <div
              className="fixed inset-0 bg-gray-200 opacity-50 z-10"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
          )}
          <div className="bg-white p-5">
            <Breadcrumbs />
            <div className="flex justify-between px-5">
              <h1 className="text-lg font-bold">Onboard Applicants</h1>
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/employee-info")}
              >
                View Onboarded Employees
              </button>
            </div>
          </div>

          <div className="p-6 min-h-screen">
            <div className="p-4">
              <table className="table w-full border border-gray-300 bg-white">
                <thead>
                  <tr className="bg-gray-200">
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Experience</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((applicant) => (
                    <tr key={applicant._id} className="border-b">
                      <td>{applicant.fullname}</td>
                      <td>{applicant.email}</td>
                      <td>{applicant.department}</td>
                      <td>{applicant.role}</td>
                      <td>{applicant.experience}</td>
                      <td className="space-x-2">
                        <button
                          className="btn btn-primary"
                          onClick={() => openModal(applicant)}
                        >
                          View
                        </button>

                        {!applicant.onboarded ? (
                          <button
                            className="btn btn-success"
                            onClick={() => onboardApplicant(applicant)}
                          >
                            Onboard Employee
                          </button>
                        ) : (
                          <button
                            className="btn btn-danger"
                            onClick={() => archiveApplicant(applicant)}
                          >
                            Archive
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <dialog ref={modalRef} className="modal">
                <div className="modal-box">
                  {selectedApplicant && (
                    <>
                      <h2 className="text-lg font-bold">
                        {selectedApplicant.fullname}
                      </h2>
                      <p>
                        <strong>Email:</strong> {selectedApplicant.email}
                      </p>
                      <p>
                        <strong>Department:</strong>{" "}
                        {selectedApplicant.department}
                      </p>
                      <p>
                        <strong>Experience:</strong>{" "}
                        {selectedApplicant.experience}
                      </p>
                      <p>
                        <strong>Education:</strong>{" "}
                        {selectedApplicant.education}
                      </p>
                      <p>
                        <strong>Skills:</strong>{" "}
                        {selectedApplicant.skills.join(", ")}
                      </p>
                      <p>
                        <strong>Resume:</strong>{" "}
                        <a
                          href={selectedApplicant.resume}
                          target="_blank"
                          className="text-blue-600 underline"
                        >
                          View Resume
                        </a>
                      </p>
                      <div className="modal-action">
                        <button
                          className="btn"
                          onClick={() => modalRef.current.close()}
                        >
                          Close
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardEmployee;
