import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const EmployeeLoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employee_username: "",
    employee_password: "",
  });

  const [error, setError] = useState("");

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
  
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }
  
      // Store employee data in local storage
      localStorage.setItem("authToken", data.token); // Optional if you're using tokens
      localStorage.setItem("employeeFirstName", data.employee_firstname);
      localStorage.setItem("employeeLastName", data.employee_lastname);
      localStorage.setItem("employeeUsername", data.employee_username); // Ensure this line is present
  
      // Retrieve username from local storage
      const employeeUsername = localStorage.getItem("employeeUsername");
  
      console.log(data.message);
      alert(`Login successful! Welcome back, ${employeeUsername}!`);
      navigate("/employeedashboard");
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };
  
  return (
    <div className="flex justify-center items-start min-h-screen pt-10">
      <div className="card w-full max-w-md bg-base-100 shadow-xl mx-auto">
        <div className="card-body">
          <h2 className="card-title text-center justify-center font-bold">
            Employee Login
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Username</span>
              </label>
              <input
                type="text"
                name="employee_username"
                value={formData.employee_username}
                onChange={handleChange}
                placeholder="Enter your username"
                className="input input-bordered"
                required
              />
            </div>
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                name="employee_password"
                value={formData.employee_password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="input input-bordered"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="form-control mt-6">
              <button type="submit" className="btn btn-primary">
                Login
              </button>
              <p className="text-center mt-4">
                Don't have an account?
                <Link
                  to="/employeesignup"
                  className="text-green-600 hover:underline"
                >
                  {" "}
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLoginForm;
