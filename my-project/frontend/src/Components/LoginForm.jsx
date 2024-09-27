import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login - HR1";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Login failed");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      navigate("/dashboard");
    } catch (error) {
      setError("An error occurred during login.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-500">
      <div
        className={`bg-white rounded-lg shadow-lg p-10 w-full max-w-md ${shake ? "shake" : ""}`}
      >
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Sign In
        </h2>
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}
        <form onSubmit={handleSubmit}>
          {/* Username Field */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input input-bordered w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
              required
            />
          </div>

          {/* Password Field */}
          <div className="mb-6 relative">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Password
            </label>
            <div className="flex items-center border border-gray-300 rounded focus-within:ring-2 focus-within:ring-green-500">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered w-full p-3 rounded focus:outline-none"
                required
              />
              <button
                type="button"
                className="flex items-center justify-center w-10 h-full"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FontAwesomeIcon
                    icon={faEyeSlash}
                    className="h-5 w-5 text-gray-500"
                  />
                ) : (
                  <FontAwesomeIcon
                    icon={faEye}
                    className="h-5 w-5 text-gray-500"
                  />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button className="btn btn-primary w-full bg-green-600 text-white hover:bg-green-700 py-3 rounded transition duration-200">
            Login
          </button>
        </form>

        <p className="text-center mt-4">
          Don't have an account?
          <Link to="/signup" className="text-green-600 hover:underline">
            {" "}
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
