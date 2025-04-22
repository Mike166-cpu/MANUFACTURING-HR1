import React, { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";

const SignUpForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "employee",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const APIBASE_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const validatePassword = (password) => {
    const regex =
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return regex.test(password);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validatePassword(formData.password)) {
      setError(
        "Password must be at least 8 characters long, include one uppercase letter, one number, and one special character."
      );
      return;
    }

    try {
      const response = await axios.post(
        `${APIBASE_URL}/api/admin/create-account`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.data) {
        Swal.fire({
          title: "Registration Successful!",
          text: `Your account has been created. Your Employee ID is: ${response.data.employeeId}`,
          icon: "success",
          confirmButtonText: "Proceed to Login",
        }).then(() => navigate("/login"));
      }
    } catch (error) {
      console.error("Registration error:", error);

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        "Failed to register. Please try again.";

      Swal.fire({
        title: "Registration Failed",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "Try Again",
      });

      setError(errorMessage);
    }
  };

  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Sign Up
        </h2>
        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              placeholder="Enter your email"
              value={formData.firstName}
              onChange={handleChange}
              className="input input-bordered w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              placeholder="Enter your last name"
              value={formData.lastName}
              onChange={handleChange}
              className="input input-bordered w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="input input-bordered w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input input-bordered w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>

          <div className="mb-6 relative">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Password
            </label>
            <div className="flex items-center border border-gray-300 rounded focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="input input-bordered w-full p-3 rounded focus:outline-none"
                required
              />
              <button
                type="button"
                className="flex items-center justify-center w-10 h-full"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full bg-blue-600 text-white hover:bg-blue-700 py-3 rounded transition duration-200"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpForm;
