import React, { useState } from "react";
import Swal from "sweetalert2";
import { Navigate, useNavigate, useParams } from "react-router-dom";

const ResetPassword = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState("");

 
  const handleSubmit = async (e) => {
    e.preventDefault();

     const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";

    try {
      const response = await fetch(`${APIBase_URL}/api/employee/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      Swal.fire({
        icon: "success",
        title: "Password Reset",
        text: "Your password has been reset successfully.",
      }).then(() => {
        navigate("/employeelogin")
      })
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
        <h2 className="text-2xl font-bold text-center text-gray-800">Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-xs font-medium text-gray-600">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-md transition-colors"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
