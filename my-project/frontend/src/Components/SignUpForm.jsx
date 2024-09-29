import React, { useState, useEffect } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"; // Update icon imports
import { Link } from "react-router-dom"; // Import Link

const SignUpForm = () => {
  useEffect(() => {
    document.title = "Signup - HR1";
  }, []);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    suffix: "",
    birthday: "",
    address: "",
    contactNumber: "",
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    const { password } = formData;

    if (!validatePassword(password)) {
      setError(
        "Password must be at least 8 character long, contain at least one uppercase letter, one number, and one special character."
      );
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log("User created successfully!");
        alert("Sign-up successful! Welcome aboard.");
        setError("");
        setFormData({
          firstName: "",
          lastName: "",
          middleName: "",
          suffix: "",
          birthday: "",
          address: "",
          contactNumber: "",
          username: "",
          password: "",
        });
      } else {
        const data = await response.json();
        setError(data.message || "Error creating user.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-500">
      <div className="bg-white rounded-lg shadow-lg p-10 w-full max-w-4xl">
        {" "}
        {/* Increased max width */}
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Sign Up
        </h2>
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}
        <form onSubmit={handleSubmit}>
          {/* First Name, Last Name, Middle Name Fields in One Line */}
          <div className="mb-4 flex space-x-4">
            <div className="flex-1">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                className="input input-bordered w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
                required
              />
            </div>

            <div className="flex-1">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                className="input input-bordered w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
                required
              />
            </div>

            <div className="flex-1">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Middle Name
              </label>
              <input
                type="text"
                name="middleName"
                placeholder="Middle"
                value={formData.middleName}
                onChange={handleChange}
                className="input input-bordered w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
              />
            </div>
          </div>

          {/* Suffix Field */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Suffix (e.g., Jr., Sr.)
            </label>
            <input
              type="text"
              name="suffix"
              placeholder="*Optional"
              value={formData.suffix}
              onChange={handleChange}
              className="input input-bordered w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
            />
          </div>

          {/* Birthday Field */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Birthday
            </label>
            <input
              type="date"
              name="birthday"
              value={formData.birthday}
              onChange={handleChange}
              className="input input-bordered w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
              required
            />
          </div>

          {/* Address Field */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Address
            </label>
            <input
              type="text"
              name="address"
              placeholder="123 Main St"
              value={formData.address}
              onChange={handleChange}
              className="input input-bordered w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
              required
            />
          </div>

          {/* Contact Number Field */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Contact Number
            </label>
            <input
              type="tel"
              name="contactNumber"
              placeholder="123-456-7890"
              value={formData.contactNumber}
              onChange={handleChange}
              className="input input-bordered w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
              required
            />
          </div>

          {/* Username Field */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              placeholder="username123"
              value={formData.username}
              onChange={handleChange}
              className="input input-bordered w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
              required
            />
          </div>

          {/* Password Field with Show/Hide Feature */}
          <div className="mb-6 relative">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Password
            </label>
            <div className="flex items-center border border-gray-300 rounded focus-within:ring-2 focus-within:ring-green-500">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder=""
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

          {/* Signup Button */}
          <button
            type="submit"
            className="btn btn-primary w-full bg-green-600 text-white hover:bg-green-700 py-3 rounded transition duration-200"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-green-600 hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpForm;
