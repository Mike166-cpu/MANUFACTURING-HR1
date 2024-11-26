import React, { useState } from "react";
import Swal from "sweetalert2";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      return Swal.fire({
        icon: "error",
        title: "Invalid Email",
        text: "Please enter a valid email address.",
      });
    }

    const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";

    try {
      const response = await fetch(`${APIBase_URL}/api/employee/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employee_email: email }), // Ensure the key matches your backend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send password reset email.");
      }

      Swal.fire({
        icon: "success",
        title: "Email Sent",
        text: "Please check your inbox for password reset instructions.",
      });

      // Clear the email field
      setEmail("");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-blue-300 bg-opacity-15 px-4">
      <div className="p-6 py-10 w-full max-w-xs h-auto bg-white shadow-lg rounded-lg mt-10 border">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Forgot Password
        </h2>
        <p className="text-center text-sm text-gray-600 mt-1 mb-4">
          Enter your email to receive password reset instructions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-gray-600"
            >
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-md transition-colors"
          >
            Send Reset Link
          </button>

          <p className="text-center text-xs text-gray-600 mt-4">
            Remember your password?{" "}
            <a
              href="/employeelogin"
              className="text-blue-600 hover:underline ml-1"
            >
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
