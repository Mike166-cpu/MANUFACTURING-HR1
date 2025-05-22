import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../Components/Navbar";
import Sidebar from "../../Components/Sidebar";
import BreadCrumbs from "../../Components/BreadCrumb";
import * as QRCodeReact from "qrcode.react";
const QRCode = QRCodeReact.default;
import { jwtDecode } from "jwt-decode";

const AdminSettings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const APIBASE_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const email = localStorage.getItem("email");
  console.log("Email from localStorage:", email);

  const adminToken = localStorage.getItem("adminToken");
  let decoded = null;

  if (adminToken) {
    try {
      decoded = jwtDecode(adminToken);
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  } else {
    console.warn("No token found in localStorage.");
  }

  //main functions
  const [qrCode, setQrCode] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [token, setToken] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [step, setStep] = useState("initial");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const userId = localStorage.getItem("adminId");
  console.log("User ID from localStorage:", userId);

  // Add this after your state declarations
useEffect(() => {
  const check2FAStatus = async () => {
    try {e
      const response = await axios.get(
        `${APIBASED_URL}/api/login-admin/2fa/status/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (response.data.enabled) {
        setEnabled(true);
        setStep("enabled");
      }
    } catch (err) {
      console.error("Error checking 2FA status:", err);
    }
  };

  if (userId) {
    check2FAStatus();
  }
}, [userId]);

  const handleEnable2FA = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await axios.post(
        `${APIBASED_URL}/api/login-admin/2fa/setup`,
        {
          userId: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data && res.data.qrCode) {
        setQrCode(res.data.qrCode);
        setManualCode(res.data.manualCode);
        setStep("verify");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to enable 2FA");
      console.error("Error enabling 2FA:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate token format
      if (!token || token.length !== 6 || !/^\d+$/.test(token)) {
        setError("Please enter a valid 6-digit code");
        return;
      }

      console.log("Sending verification request with token:", token); // Debug log

      const response = await axios.post(
        `${APIBASED_URL}/api/login-admin/2fa/verify`,
        {
          userId,
          token: token.trim(), // Remove any whitespace
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Verification response:", response.data); // Debug log

      if (response.data.message === "2FA successfully enabled") {
        setEnabled(true);
        setStep("enabled");
        setToken(""); // Clear the token input
        toast.success("2FA successfully enabled!");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Verification failed";
      setError(errorMessage);
      console.error("Verification failed:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      const userToken = prompt("Enter your 2FA token to disable:");
      if (!userToken) return; // User cancelled

      await axios.post(`${APIBASED_URL}/api/login-admin/2fa/disable`, {
        userId: userId,
        token: userToken, // Send the TOTP token, not adminToken
      });
      setEnabled(false);
      setStep("initial");
    } catch (err) {
      alert("Failed to disable 2FA: " + err.response?.data?.message);
    }
  };

  return (
    <div>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <div
          className={`flex-grow transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
          }`}
        >
          <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

          <div className="bg-white p-6 shadow-sm mb-6">
            <BreadCrumbs />
            <h1 className="text-2xl font-bold text-gray-800 mt-2 px-4">
              Settings
            </h1>
          </div>

          <div className="max-w-md p-4 bg-white shadow rounded-xl">
            <h2 className="text-xl font-semibold mb-2">
              Two-Factor Authentication (2FA)
            </h2>

            {step === "initial" && (
              <>
                <p className="mb-4">
                  Secure your account with Google Authenticator.
                </p>
                <button
                  onClick={handleEnable2FA}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Enable 2FA
                </button>
              </>
            )}

            {step === "verify" && (
              <>
                <p className="mb-2">
                  Scan the QR code with your Google Authenticator app:
                </p>
                <div className="flex justify-center mb-4">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
                <p className="mt-2 text-sm text-gray-600 break-all">
                  Manual code: {manualCode}
                </p>

                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={token}
                  onChange={(e) => {
                    // Only allow numbers and limit to 6 digits
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setToken(value);
                  }}
                  className="border px-4 py-2 mt-4 w-full text-center text-xl tracking-wider rounded"
                  maxLength="6"
                  pattern="\d{6}"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
                <button
                  onClick={handleVerify2FA}
                  className="bg-green-600 text-white px-4 py-2 mt-2 rounded w-full"
                >
                  Confirm 2FA Setup
                </button>
              </>
            )}

            {step === "enabled" && (
              <>
                <p className="text-green-600 font-medium mb-4">
                  2FA is currently enabled on your account.
                </p>
                <button
                  onClick={handleDisable2FA}
                  className="bg-red-600 text-white px-4 py-2 rounded"
                >
                  Disable 2FA
                </button>
              </>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
