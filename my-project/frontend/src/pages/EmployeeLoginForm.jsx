import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../src/assets/logo-2.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";

const EmployeeLoginForm = () => {
  useEffect(() => {
    document.title = "Login";
  });

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employee_username: "",
    employee_password: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const { employee_username, employee_password } = formData;

    // Check for empty fields
    if (!employee_username.trim() || !employee_password.trim()) {
      setError("Username and password are required.");
      return false;
    }

    // Username validation: only letters, numbers, underscores allowed
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(employee_username)) {
      setError("Username can only contain letters, numbers, and underscores.");
      return false;
    }

    setError(""); // Clear previous errors
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return; // Stop submission if validation fails

    const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com"; // Change for live deployment
    const Local = "http://localhost:7685";
    const endpoint = `${APIBase_URL}/api/employee/login-employee`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("employeeToken", data.token);
      localStorage.setItem("employeeFirstName", data.employeeFirstName);
      localStorage.setItem("employeeLastName", data.employeeLastName);
      localStorage.setItem("employeeUsername", data.employeeUsername);
      localStorage.setItem("employeeEmail", data.employeeEmail);
      localStorage.setItem("employeeId", data.employeeId);
      localStorage.setItem("employeeProfile", data.employeeProfile);
      localStorage.setItem("employeeDepartment", data.employeeDepartment);

      Swal.fire({
        icon: "success",
        title: "Login successful!",
        text: `Welcome back, ${data.employeeFirstName}!`,
        showConfirmButton: false,
        timer: 1500,
      });

      navigate("/employeedashboard");
    } catch (error) {
      console.error(error);
      setError(error.message);

      Swal.fire({
        icon: "error",
        title: "Login failed",
        text: error.message,
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-blue-300 bg-opacity-15 px-4">
      <div className="p-6 py-10 w-full max-w-xs h-auto bg-white shadow-lg rounded-lg mt-10 border">
        <div className="flex justify-center gap-x-2 pb-2">
          <img
            src={logo}
            alt="jjm logo"
            className="w-12 h-12 rounded-full border-2"
          />
          <h2 className="text-2xl font-bold text-center text-gray-800 mt-1">
            LOGIN
          </h2>
        </div>

        {error && <p className="text-red-500 text-xs text-center mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label
              htmlFor="employee_username"
              className="block text-xs font-medium text-gray-600"
            >
              Username
            </label>
            <input
              type="text"
              name="employee_username"
              id="employee_username"
              value={formData.employee_username}
              onChange={handleChange}
              placeholder="Username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          <div className="relative">
            <label
              htmlFor="employee_password"
              className="block text-xs font-medium text-gray-600"
            >
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="employee_password"
              id="employee_password"
              value={formData.employee_password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 mt-4 pr-3 flex items-center text-gray-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="text-right">
            <Link to="/forgotpassword" className="text-xs text-blue-600 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-md transition-colors"
          >
            Login
          </button>

          <p className="text-center text-xs text-gray-600">
            Don't have an account?
            <Link to="/employeesignup" className="text-blue-600 hover:underline ml-1">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default EmployeeLoginForm;
