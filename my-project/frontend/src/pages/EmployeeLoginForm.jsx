import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../src/assets/logo-2.png";
import { FaEye, FaEyeSlash } from "react-icons/fa"; 
import Swal from "sweetalert2";

const EmployeeLoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employee_username: "",
    employee_password: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/employee/login-employee",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store employee data in local storage
      localStorage.setItem("employeeToken", data.token);
      localStorage.setItem("employeeFirstName", data.employee_firstname);
      localStorage.setItem("employeeLastName", data.employee_lastname);
      localStorage.setItem("employeeUsername", data.employee_username);
      localStorage.setItem("employeeEmail", data.employee_email);
      localStorage.setItem("employeeDepartment", data.employee_department);
      localStorage.setItem(
        "employeeMiddleName",
        data.employee_middlename || ""
      );
      localStorage.setItem("employeeSuffix", data.employee_suffix || "");
      localStorage.setItem("employeePhone", data.employee_phone || "");
      localStorage.setItem("employeeAddress", data.employee_address || "");
      localStorage.setItem(
        "employeeDateOfBirth",
        data.employee_dateOfBirth || ""
      );
      localStorage.setItem("employeeGender", data.employee_gender || "");

      const employeeUsername = localStorage.getItem("employeeUsername");

      Swal.fire({
        icon: "success",
        title: `Login successful!`,
        text: `Welcome back, ${employeeUsername}!`,
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
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6 border">
        {/* Logo and Title */}
        <div className="flex flex-col items-center gap-2 pb-4">
          <img
            src={logo}
            alt="JJM Logo"
            className="w-16 h-16 object-contain rounded-full border-2"
          />
          <h2 className="text-2xl font-semibold text-gray-700">Employee Login</h2>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-4">
          {/* Username Field */}
          <div className="mb-4">
            <label
              htmlFor="employee_username"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Username
            </label>
            <input
              type="text"
              name="employee_username"
              id="employee_username"
              value={formData.employee_username}
              onChange={handleChange}
              placeholder="Enter your username"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Password Field */}
          <div className="mb-4 relative">
            <label
              htmlFor="employee_password"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="employee_password"
              id="employee_password"
              value={formData.employee_password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              required
            />
            {/* Show/Hide Password Icon */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 mt-4 flex items-center text-gray-600 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Forgot Password Link */}
          <div className="mb-4 flex justify-end">
            <Link
              to="/forgotpassword"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <div className="mb-4">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition-colors duration-200"
            >
              Login
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-gray-600 text-sm">
            Don't have an account?
            <Link
              to="/employeesignup"
              className="text-blue-600 hover:underline ml-1"
            >
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default EmployeeLoginForm;
