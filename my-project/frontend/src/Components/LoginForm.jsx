import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../src/assets/logo-2.png";
import Swal from "sweetalert2";
import ReCAPTCHA from "react-google-recaptcha";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  //const [captchaValue, setCaptchaValue] = useState(null); // ReCAPTCHA state
  const navigate = useNavigate();
  const location = useLocation();


  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";

  useEffect(() => {
    document.title = "Login - HR1";
    checkAuthStatus();
  }, []);

   const checkAuthStatus = () => {
      const token = localStorage.getItem("adminToken");
      if (token) {
        Swal.fire({
          icon: "info",
          title: "Already Logged In",
          text: "Redirecting to dashboard...",
          showConfirmButton: false,
          timer: 1500,
        });
  
        navigate("/dashboard", { replace: true }); // Redirect user away
      }
    };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      Swal.fire({
        title: "Error",
        text: "Please fill in all fields.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const response = await fetch(`${APIBASED_URL}/api/hr/admin-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Swal.fire({
          title: "Login Failed",
          text: data.message || "Incorrect username or password.",
          icon: "error",
          confirmButtonText: "Try Again",
        });
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      // Store token and user details in localStorage
      localStorage.setItem("gatewayToken", data.refreshToken);
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("firstName", data.user.firstName);
      localStorage.setItem("lastName", data.user.lastName);
      localStorage.setItem("email", data.user.email);
      localStorage.setItem("role", data.user.role);

      if (data.user.accessLevel === "Super Admin") {
        localStorage.setItem("accessLevel", "Super Admin");
      }

      if (data.user.department === "HR1") {
        window.location.href = "https://hr1.jjm-manufacturing.com/";
        return;
      }

      Swal.fire({
        title: "Login Successful",
        text: "Welcome back!",
        icon: "success",
        confirmButtonText: "Proceed",
      }).then(() => {
        const redirectTo = location.state?.from?.pathname || "/dashboard";
        navigate(redirectTo, { replace: true });
      });

      console.log(data);
    } catch (error) {
      console.error("Login error:", error);
      Swal.fire({
        title: "Error",
        text: "Something went wrong. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-500 bg-green-100 bg-opacity-25">
      {/* <div className="absolute top-0 left-0 w-32 h-32 bg-green-300 rounded-full opacity-50 -z-10"></div>
      <div className="absolute bottom-10 right-10 w-24 h-24 bg-green-500 opacity-50 -z-10"></div>
      <div className="absolute top-20 right-0 w-40 h-40 bg-yellow-400 rounded-full opacity-30 -z-10"></div>
      <div className="absolute bottom-20 left-12 w-32 h-32 border-2 border-dashed border-gray-400 -z-10"></div>
      <div className="absolute top-10 right-10 w-24 h-24 border-2 border-dashed border-gray-500 -z-10"></div> */}
      <div
        className={`bg-white rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.25)] p-10 w-full max-w-sm${
          shake ? " shake" : ""
        }`}
      >
        <div className="flex justify-center gap-x-2 pb-2">
          <img
            src={logo}
            alt="jjm logo"
            className="w-12 h-12 rounded-full border-2"
          />
          <h2 className="text-3xl font-bold text-center text-gray-800 mt-1">
            LOGIN
          </h2>
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}
        <form onSubmit={handleSubmit}>
          {/* Username Field */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm mb-2">Email</label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered w-full p-3 border border-gray-300 dark:bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
              required
            />
          </div>

          {/* Password Field */}
          <div className="mb-6 relative">
            <div className="flex gap-x-">
              <label className="block text-gray-700 text-sm mb-2">
                Password
              </label>

              <label className="block text-sm mb-2 justify-end ml-auto text-green-600">
                Forgot Password?
              </label>
            </div>
            <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-green-500">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered w-full p-3 rounded focus:outline-none dark:bg-white"
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

          <button className="btn btn-primary w-full bg-green-600 text-white hover:bg-green-700 py-3 rounded transition duration-200">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
