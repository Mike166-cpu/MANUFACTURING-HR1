import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const EmployeeSignupForm = () => {
  const [formData, setFormData] = useState({
    employee_firstname: "",
    employee_middlename: "",
    employee_lastname: "",
    employee_suffix: "",
    employee_username: "",
    employee_email: "",
    employee_password: "",
    employee_confirmPassword: "",
    employee_phone: "",
    employee_address: "",
    employee_dateOfBirth: "",
    employee_gender: "",
    employee_department: "",
  });

  const [error, setError] = useState("");

  const departments = ["HR", "Finance", "Engineering", "Sales", "Marketing"];
  const genders = ["Male", "Female", "Other"];

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
      const response = await fetch("http://localhost:5000/api/employee/add", {
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
      console.log(data.message);
      alert("Login successful! Welcome aboard!");
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen pt-10">
      <div className="card w-full max-w-3xl bg-base-100 shadow-xl mx-auto">
        <div className="card-body">
          <h2 className="card-title text-center">Employee Signup</h2>
          <form onSubmit={handleSubmit}>
            {/* Name Fields */}
            <div className="grid grid-cols-3 gap-4">
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
                  className="input input-bordered"
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
                  className="input input-bordered"
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
                  className="input input-bordered"
                  required
                />
              </div>
            </div>

            {/* Suffix Field */}
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Suffix</span>
              </label>
              <input
                type="text"
                name="employee_suffix"
                value={formData.employee_suffix}
                onChange={handleChange}
                placeholder="Suffix (e.g., Jr., Sr.)"
                className="input input-bordered"
              />
            </div>

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

            {/* Email Field */}
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

            {/* Password and Confirm Password */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="form-control">
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
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Confirm Password</span>
                </label>
                <input
                  type="password"
                  name="employee_confirmPassword"
                  value={formData.employee_confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="input input-bordered"
                  required
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            {/* Other Fields */}
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Phone Number</span>
              </label>
              <input
                type="text"
                name="employee_phone"
                value={formData.employee_phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Address</span>
              </label>
              <input
                type="text"
                name="employee_address"
                value={formData.employee_address}
                onChange={handleChange}
                placeholder="Enter your address"
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Date of Birth</span>
              </label>
              <input
                type="date"
                name="employee_dateOfBirth"
                value={formData.employee_dateOfBirth}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Gender</span>
              </label>
              <select
                name="employee_gender"
                value={formData.employee_gender}
                onChange={handleChange}
                className="select select-bordered"
                required
              >
                <option value="" disabled>
                  Select gender
                </option>
                {genders.map((gender, idx) => (
                  <option key={idx} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control mt-4">
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
              <button type="submit" className="btn btn-primary">
                Signup
              </button>

              <p className="text-center mt-4">
                Already have an account?
                <Link
                  to="/employeelogin"
                  className="text-green-600 hover:underline"
                >
                  {" "}
                  Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSignupForm;
