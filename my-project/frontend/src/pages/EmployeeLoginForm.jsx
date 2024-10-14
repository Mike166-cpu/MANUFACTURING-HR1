import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../src/assets/logo-2.png";

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
        throw new Error("Login failed");
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

      console.log(data.message);
      console.log(data);
      alert(`Login successful! Welcome back, ${employeeUsername}!`);
      navigate("/employeedashboard");
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-blue-300 bg-opacity-15 overflow-auto">
      <div className="card w-full max-w-md lg:max-w-sm bg-white shadow-lg rounded-xl p-6 border mx-4">
        <div className="flex justify-center gap-x-2 pb-4">
          <img
            src={logo}
            alt="jjm logo"
            className="w-12 h-12 rounded-full border-2"
          />
          <h2 className="text-2xl lg:text-3xl font-medium text-center text-gray-600 mt-1">
            LOGIN
          </h2>
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="mt-4">
          <label className="text-sm">Username</label>
          <div className="form-control mb-4">
            <input
              type="text"
              name="employee_username"
              value={formData.employee_username}
              onChange={handleChange}
              placeholder="Username"
              className="input input-bordered h-12 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="form-control mb-4 relative">
            <div className="flex gap-x-">
              <label className="block text-gray-700 text-sm mb-2">
                Password
              </label>

              <label className="block text-sm mb-2 justify-end ml-auto text-green-600">
                Forgot Password?
              </label>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="employee_password"
              value={formData.employee_password}
              onChange={handleChange}
              placeholder="Password"
              className=" input input-bordered h-12 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring focus:ring-blue-500 focus:border-blue-500 pr-10"
              required
            />
            <div className="flex text-sm justify-end items-center mt-2">
              <input
                type="checkbox"
                id="show-password"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="mr-2 h-4 w-4 cursor-pointer"
              />
              <label
                htmlFor="show-password"
                className="text-gray-600 cursor-pointer"
              >
                Show Password
              </label>
            </div>
          </div>

          <div className="form-control">
            <button
              type="submit"
              className="btn btn-primary rounded-md bg-blue-600 hover:bg-blue-700 text-white py-2 w-full"
            >
              Login
            </button>
            <p className="text-center mt-4 text-gray-600 text-sm">
              Don't have an account?
              <Link
                to="/employeesignup"
                className="text-blue-600 hover:underline"
              >
                {" "}
                Sign Up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeLoginForm;
