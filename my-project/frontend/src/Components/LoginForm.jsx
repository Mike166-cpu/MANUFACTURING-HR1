import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../src/assets/logo-2.png";
import Swal from "sweetalert2";
import ReCAPTCHA from "react-google-recaptcha";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [captchaValue, setCaptchaValue] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const LoadingOverlay = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="flex space-x-2">
          <div
            className="w-4 h-4 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          ></div>
          <div
            className="w-4 h-4 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-4 h-4 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    document.title = "Login - Admin";
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      toast.info("Already Logged In. Redirecting to dashboard...", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      navigate("/dashboard", { replace: true }); // Redirect user away
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    document.title = "Logging in...";
  
    if (!email || !password) {
      Swal.fire({
        title: "Error",
        text: "Please fill in all fields.",
        icon: "error",
        confirmButtonText: "OK",
      });
      setLoading(false);
      document.title = "Login - Admin";
      return;
    }
  
    try {
      const response = await fetch(`${LOCAL}/api/login-admin/userLogin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        toast.error(data.message || "Login failed!");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
  
      // Store token and user details in localStorage
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("firstName", data.user.firstName);
      localStorage.setItem("lastName", data.user.lastName);
      localStorage.setItem("email", data.user.email);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("accessLevel", data.user.accessLevel);
  
      if (data.user.department === "HR1") {
        window.location.href = "https://hr1.jjm-manufacturing.com/";
        return;
      }
  
      toast.success("Login successful!", { autoClose: 1500 });
  
      setTimeout(() => {
        const redirectTo = location.state?.from?.pathname || "/dashboard";
        navigate(redirectTo, { replace: true });
      }, 1500);
  
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-500 bg-green-100 bg-opacity-25">
      <ToastContainer />
      <div
        className={`bg-white rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.25)] p-10 w-full max-w-sm${
          shake ? " shake" : ""
        }`}
      >
        {loading && <LoadingOverlay />}
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

          <div className="text-center text-sm mb-4">
            <button
              type="button"
              className="text-blue-500 hover:underline"
              onClick={() => setIsTermsModalOpen(true)}
            >
              Terms and Conditions
            </button>
          </div>

          <button className="btn btn-primary w-full bg-green-600 text-white hover:bg-green-700 py-3 rounded transition duration-200">
            Login
          </button>
        </form>
      </div>
      {isTermsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Terms and Conditions</h3>
            <p className="text-sm text-gray-600">
              By using this application, you agree to our terms and conditions.
              Please read them carefully before proceeding.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsTermsModalOpen(false)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-200"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
