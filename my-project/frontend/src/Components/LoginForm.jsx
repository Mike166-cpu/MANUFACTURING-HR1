import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../src/assets/logo-2.png";
import Swal from "sweetalert2";
import ReCAPTCHA from "react-google-recaptcha";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

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

  const [canResend, setCanResend] = useState(false);
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

  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [loginEmail, setLoginEmail] = useState("");

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
      const response = await axios.post(`${LOCAL}/api/login-admin/userLogin`, {
        email,
        password,
      });

      const data = response.data;

      if (response.status !== 200) {
        toast.error(data.message || "Login failed!");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      setLoginEmail(email);
      setIsOtpModalOpen(true); // Show OTP modal

      toast.success("Your OTP was sent to your email", { autoClose: 1500 });
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp) {
      toast.error("Please enter the OTP.");
      return;
    }

    try {
      const response = await axios.post(`${LOCAL}/api/login-admin/verify-otp`, {
        email: loginEmail,
        otp,
      });

      const data = response.data;

      if (response.status !== 200) {
        toast.error(data.message || "OTP verification failed!");
        return;
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("firstName", data.user.firstName);
      localStorage.setItem("lastName", data.user.lastName);
      localStorage.setItem("email", data.user.email);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("accessLevel", data.user.accessLevel);

      toast.success("Login successful!", { autoClose: 1500 });

      setTimeout(() => {
        const redirectTo = location.state?.from?.pathname || "/dashboard";
        navigate(redirectTo, { replace: true });
      }, 1500);
    } catch (error) {
      console.error("OTP error:", error);
      toast.error("Something went wrong. Try again.");
    }
  };

  //timer
  const [timer, setTimer] = useState(300); // 5 minutes
  const [resendDisabled, setResendDisabled] = useState(true);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  useEffect(() => {
    let interval;

    if (isOtpModalOpen && resendDisabled) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            clearInterval(interval);
            setResendDisabled(false);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isOtpModalOpen, resendDisabled]);

  const handleResendOtp = async () => {
    try {
      const response = await axios.post(`${LOCAL}/api/login-admin/userLogin`, {
        email: loginEmail,
        password, // You might want to skip this or use a token/refresh logic for real cases
      });

      if (response.status === 200) {
        toast.success("OTP resent to your email.");
        setTimer(300);
        setCanResend(false);
      } else {
        toast.error("Failed to resend OTP.");
      }
    } catch (error) {
      toast.error("Error resending OTP.");
      console.error(error);
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
      {isOtpModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h3 className="text-xl font-bold mb-2 text-center">Enter OTP</h3>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="input input-bordered w-full p-3 text-center text-xl tracking-widest"
              placeholder="6-digit code"
            />
            <div className="text-center mt-2 text-gray-600">
              {canResend ? (
                <button
                  onClick={handleResendOtp}
                  className="text-blue-600 hover:underline"
                >
                  Resend OTP
                </button>
              ) : (
                <span>
                  Resend in{" "}
                  <span className="font-semibold">
                    {Math.floor(timer / 60)
                      .toString()
                      .padStart(2, "0")}
                    :{(timer % 60).toString().padStart(2, "0")}
                  </span>
                </span>
              )}
            </div>

            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setIsOtpModalOpen(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleOtpSubmit}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-200"
              >
                Verify OTP
              </button>
            </div>
          </div>
        </div>
      )}

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
