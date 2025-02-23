import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

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

const AddEmployee = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const isMobileView = useMediaQuery("(max-width: 768px)");

  const handleResize = () => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  };

  useEffect (()=> {
    document.title = "Create Employee Account";
  });

  useEffect(() => {


    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
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

  const [formData, setFormData] = useState({
    employee_firstname: "",
    employee_middlename: "",
    employee_lastname: "",
    employee_suffix: "",
    employee_username: "",
    employee_email: "",
    employee_password: "",
    employee_confirmPassword: "",
    employee_department: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const [error, setError] = useState("");

  const departments = [
    "Human Resources",
    "Finance",
    "Logistics",
    "Administrative",
  ];
  const genders = ["Male", "Female", "Other"];

  const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.employee_password !== formData.employee_confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    setError("");

    console.log("Form Data:", formData); // Log the form data before sending

    try {
      const response = await fetch(`${APIBase_URL}/api/employee/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add employee");
      }

      const data = await response.json();
      toast.success("Employee Created Successfully!");

    } catch (error) {
      toast.error("Unable to create account");
      setError(error.message);
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
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
         <ToastContainer />

        {/*MAIN CONTENT*/}
        <div className="p-5 min-h-screen ">
          <div className="p-5 bg-white rounded-lg shadow-sm">
            <h1 className="font-bold text-xl">Create Employee Account</h1>
          </div>
          <div className="mt-5 card max-w-screen bg-base-100 shadow-xl mx-auto">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Name Fields */}
                <h1 className="font-bold text-lg">Personal Information</h1>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">First Name</span>
                    </label>
                    <input
                      type="text"
                      name="employee_firstname"
                      value={formData.employee_firstname}
                      onChange={handleChange}
                      placeholder="First Name"
                      className="input input-bordered capitalize"
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Middle Name</span>
                    </label>
                    <input
                      type="text"
                      name="employee_middlename"
                      value={formData.employee_middlename}
                      onChange={handleChange}
                      placeholder="Middle Name"
                      className="input input-bordered capitalize"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Last Name</span>
                    </label>
                    <input
                      type="text"
                      name="employee_lastname"
                      value={formData.employee_lastname}
                      onChange={handleChange}
                      placeholder="Last Name"
                      className="input input-bordered capitalize"
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Suffix</span>
                    </label>
                    <input
                      type="text"
                      name="employee_suffix"
                      value={formData.employee_suffix}
                      onChange={handleChange}
                      placeholder="Suffix (e.g., Jr., Sr.)"
                      className="input input-bordered capitalize"
                    />
                  </div>
                </div>

                <div className="pt-7">
                  <h1 className="font-bold text-lg">Login Information</h1>
                </div>
                <div className="grid grid-cols-2 gap-4 py-2">
                  {/* Username Field */}
                  <div className="form-control mt-4">
                    <label className="label">
                      <span className="label-text">Username</span>
                    </label>
                    <input
                      type="text"
                      name="employee_username"
                      value={formData.employee_username}
                      onChange={handleChange}
                      placeholder="Enter a username"
                      className="input input-bordered"
                      required
                    />
                  </div>

                  <div className="form-control mt-4">
                    <label className="label">
                      <span className="label-text">Email</span>
                    </label>
                    <input
                      type="email"
                      name="employee_email"
                      value={formData.employee_email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className="input input-bordered"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 py-2">
                  {/* Password and Confirm Password */}
                  <div className="flex flex-col md:flex-row md:space-x-4 w-full">
                    {/* Password Field */}
                    <div className="form-control w-full">
                      <div className="relative">
                        <label className="label-text">Password</label>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="employee_password"
                          value={formData.employee_password}
                          onChange={handleChange}
                          placeholder="Enter your password"
                          className="input input-bordered w-full pr-10" // Adds space for icon
                          required
                        />
                        <span
                          onClick={togglePasswordVisibility}
                          className="absolute right-3 top-1/2 transform -translate-y-1/5 cursor-pointer"
                        >
                          {showPassword ? (
                            <FontAwesomeIcon icon={faEyeSlash} />
                          ) : (
                            <FontAwesomeIcon icon={faEye} />
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="form-control w-full">
                      <div className="relative">
                        <label className="label-text">Confirm Password</label>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="employee_confirmPassword"
                          value={formData.employee_confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm your password"
                          className="input input-bordered w-full pr-10" // Adds space for icon
                          required
                        />
                        <span
                          onClick={toggleConfirmPasswordVisibility}
                          className="absolute right-3 top-1/2 transform -translate-y-1/5 cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <FontAwesomeIcon icon={faEyeSlash} />
                          ) : (
                            <FontAwesomeIcon icon={faEye} />
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Department</span>
                  </label>
                  <select
                    name="employee_department"
                    value={formData.employee_department}
                    onChange={handleChange}
                    className="select select-bordered"
                    required
                  >
                    <option value="" disabled>
                      Select department
                    </option>
                    {departments.map((dept, idx) => (
                      <option key={idx} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control mt-6">
                  <button type="submit" className="btn bg-green-600 hover:bg-green-700 text-white w-1/4">
                    Create Account
                  </button>
                </div>
              </form>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
          </div>
        </div>
        {/*END OF MAIN CONTENT*/}
      </div>
    </div>
  );
};

export default AddEmployee;
