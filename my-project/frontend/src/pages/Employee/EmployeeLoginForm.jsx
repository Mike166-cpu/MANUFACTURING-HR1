import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../../src/assets/logo-2.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";
import ReCAPTCHA from "react-google-recaptcha";

const EmployeeLoginForm = () => {
  useEffect(() => {
    document.title = "Login";
    checkAuthStatus();

    // Load saved credentials if they exist
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    if (savedEmail && savedPassword) {
      setFormData({
        employee_email: savedEmail,
        employee_password: savedPassword,
      });
      setRememberMe(true);
    }
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem("employeeToken");
    if (token) {
      Swal.fire({
        icon: "info",
        title: "Already Logged In",
        text: "Redirecting to dashboard...",
        showConfirmButton: false,
        timer: 1500,
      });

      navigate("/employeedashboard", { replace: true }); // Redirect user away
    }
  };

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employee_email: "",
    employee_password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const { employee_email, employee_password } = formData;

    // Check for empty fields
    if (!employee_email.trim() || !employee_password.trim()) {
      setError("Email and password are required.");
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employee_email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    setError(""); // Clear previous errors
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return; // Stop submission if validation fails

    // Handle remember me
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", formData.employee_email);
      localStorage.setItem("rememberedPassword", formData.employee_password);
    } else {
      localStorage.removeItem("rememberedEmail");
      localStorage.removeItem("rememberedPassword");
    }

    const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com"; // Change for live deployment
    const Local = "http://localhost:7685";

    try {
      const response = await fetch(`${APIBase_URL}/api/hr/employee-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Add this line to send the form data
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Update localStorage to match the user data structure
      localStorage.setItem("gatewaytoken", data.refreshToken);
      localStorage.setItem("employeeToken", data.token);
      localStorage.setItem("employeeFirstName", data.user.firstName);
      localStorage.setItem("employeeLastName", data.user.lastName);
      localStorage.setItem("employeeEmail", data.user.email);
      localStorage.setItem("employeeId", data.user._id);
      localStorage.setItem("employeePosition", data.user.position);
      localStorage.setItem("employeeHr", data.user.Hr);
      localStorage.setItem("employeeRole", data.user.role);

      Swal.fire({
        icon: "success",
        title: "Login successful!",
        text: `Welcome back, ${data.user.firstName}!`,
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
    <div className="flex flex-col justify-center items-center min-h-screen bg-opacity-15 px-4">
      <div className="p-6 py-10 w-full max-w-xs h-auto bg-white shadow-lg rounded-lg border">
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

        {error && (
          <p className="text-red-500 text-xs text-center mb-2">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label
              htmlFor="employee_email"
              className="block text-xs py-2 font-medium text-gray-600"
            >
              Email
            </label>
            <input
              type="email"
              name="employee_email"
              id="employee_email"
              value={formData.employee_email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          <div className="relative">
            <label
              htmlFor="employee_password"
              className="block text-xs font-medium text-gray-600 py-2"
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
              className="absolute inset-y-0 right-0 mt-8 pr-3 flex items-center text-gray-600 "
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3 w-3 text-black focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="rememberMe"
              className="ml-2 block text-xs text-gray-900"
            >
              Remember me
            </label>
          </div>

          <div className="text-right">
            <Link
              to="/employeelogin"
              className="text-xs text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-md transition-colors"
          >
            Login
          </button>
        </form>
      </div>

      <div className="fixed bottom-0 text-center w-full bg-white p-4 shadow-md">
        <span className="text-xs">All right reserved 2025</span>
      </div>
    </div>
  );
};

export default EmployeeLoginForm;
