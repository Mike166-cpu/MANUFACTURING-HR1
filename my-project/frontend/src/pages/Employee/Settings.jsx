import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Swal from "sweetalert2";
import Breadcrumbs from "../../Components/BreadCrumb";
import * as faceapi from "face-api.js";
import axios from "axios";

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setMatches(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);
  return matches;
};

const Settings = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      updates: true,
    },
    preferences: {
      language: "English",
      theme: "light",
    },
  });
  const [hasFaceId, setHasFaceId] = useState(false);

  const LOCAL = "http://localhost:7685";
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const employeeId = localStorage.getItem("employeeId");
  console.log(employeeId);

  const videoRef = useRef();
  const canvasRef = useRef();
  const [status, setStatus] = useState("Loading models...");
  const [isProcessing, setIsProcessing] = useState(false);
  const email = localStorage.getItem("email");
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setStatus("Loading face detection models...");
        // Use absolute path instead of process.env
        const MODEL_URL = '/models';
        
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        
        setStatus("Models loaded successfully. Starting camera...");
        startVideo();
      } catch (error) {
        console.error("Error loading models:", error);
        setStatus("Failed to load face detection models. Please check console for details.");
        Swal.fire({
          icon: 'error',
          title: 'Model Loading Error',
          text: 'Could not load face detection models. Please make sure the model files exist in the public folder.'
        });
      }
    };

    loadModels();
    
    // Cleanup function
    return () => {
      const stream = videoRef.current?.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = async () => {
    try {
      // Add timeout promise
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Camera access timeout')), 10000)
      );

      const videoPromise = navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });

      const stream = await Promise.race([videoPromise, timeout]);
      videoRef.current.srcObject = stream;
      setStatus("Camera ready. Position your face in the frame.");
    } catch (err) {
      if (err.message === 'Camera access timeout') {
        setStatus("Camera access timed out. Please refresh the page and try again.");
      } else {
        setStatus("Error accessing camera. Please check permissions and refresh.");
      }
      console.error(err);
    }
  };

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg');
  }, []);

  const handleRegister = async () => {
    if (isProcessing || hasFaceId) return;
    setIsProcessing(true);

    // Immediately capture the frame
    const imageUrl = captureFrame();
    setCapturedImage(imageUrl);

    try {
      setStatus("Checking face quality...");

      // Now process the captured frame
      const img = new window.Image();
      img.src = imageUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      // Create a canvas and draw the captured image for face-api
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);

      // Run detection on the captured image
      const detections = await faceapi
        .detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

      Swal.close();

      if (!detections) {
        setStatus("No face detected. Please center your face in the frame.");
        setIsProcessing(false);
        return;
      }

      if (detections.detection.score < 0.8) {
        setStatus("Face not clear enough. Please ensure good lighting and face the camera directly.");
        setIsProcessing(false);
        return;
      }

      // Show confirmation dialog with captured image
      const result = await Swal.fire({
        title: 'Confirm Registration Image',
        html: `
          <div class="text-center">
            <img src="${imageUrl}" style="max-width: 100%; margin: 0 auto;" />
            <p class="mt-4">Is this image clear and acceptable?</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Yes, register',
        cancelButtonText: 'No, retake'
      });

      if (!result.isConfirmed) {
        setIsProcessing(false);
        setStatus("Registration cancelled. You can try again.");
        return;
      }

      // Show loading modal for registration
      Swal.fire({
        title: 'Registering Face ID',
        html: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      setStatus("Processing registration...");

      const response = await axios.post(`${APIBASED_URL}/api/faceid/register-face-id`, {
        email,
        descriptor: Array.from(detections.descriptor)
      });

      setStatus("✅ " + response.data.message);
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Face ID registered successfully!'
      });

    } catch (error) {
      Swal.close();
      setStatus("❌ " + (error.response?.data?.error || "Registration failed"));
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || "Failed to register Face ID"
      });
    } finally {
      setIsProcessing(false);
      setCapturedImage(null);
    }
  };

  //const check if there is faceIdalready
  const checkFaceId = async () => {
    try {
      const response = await axios.get(`${APIBASED_URL}/api/login-admin/check-face-id/${email}`);
      setHasFaceId(response.data.hasFaceId);
      if (response.data.hasFaceId) {
        setStatus("Face ID already registered ✓");
        // Stop video stream if face ID is already registered
        const stream = videoRef.current?.srcObject;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    } catch (err) {
      setStatus("Error checking Face ID status");
      console.error("Failed to check Face ID:", err.response?.data?.error || err.message);
    }
  };
  
  useEffect(() => {
    checkFaceId();
  }
, []);

  return (
    <div>
      <div className="flex">
        <EmployeeSidebar
          onSidebarToggle={handleSidebarToggle}
          isSidebarOpen={isSidebarOpen}
        />
        <div
          className={`flex-grow transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
          } relative`}
        >
          <EmployeeNav
            onSidebarToggle={handleSidebarToggle}
            isSidebarOpen={isSidebarOpen}
          />
          {isSidebarOpen && isMobileView && (
            <div
              className="fixed inset-0 bg-black opacity-50 z-10"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
          )}
          <div className="p-5 shadow-sm bg-white">
            <Breadcrumbs />
            <h1 className="px-5 font-bold text-xl">Settings</h1>
          </div>

          <div className="p-8 bg-slate-100 min-h-screen">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Settings Header */}
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-semibold text-gray-800">Security Settings</h2>
                  <p className="text-gray-600 mt-1">Manage your account security preferences</p>
                </div>

                {/* Face ID Section */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Face ID Authentication</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Use facial recognition for secure login
                      </p>
                    </div>
                    <div className="flex items-center">
                      {hasFaceId ? (
                        <div className="flex items-center text-green-600">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Registered</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Not registered</span>
                      )}
                    </div>
                  </div>

                  {!hasFaceId && (
                    <div className="mt-4">
                      <div className="relative bg-gray-50 p-4 rounded-lg border border-gray-200">
                        {/* Loading state above video */}
                        {isProcessing && (
                          <div className="flex flex-col items-center mb-4">
                            <svg className="animate-spin h-8 w-8 text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                            <span className="text-blue-600 font-medium">Processing...</span>
                          </div>
                        )}
                        {!hasFaceId && (
                          <>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              width="400"
                              height="300"
                              className="border-2 border-gray-300 rounded-lg mx-auto"
                            />
                            <canvas
                              ref={canvasRef}
                              className="absolute top-4 left-1/2 transform -translate-x-1/2"
                              style={{ width: '400px', height: '300px' }}
                            />
                          </>
                        )}
                        {hasFaceId && (
                          <div className="text-center py-8">
                            <div className="text-green-600 flex items-center justify-center">
                              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <p className="mt-2 text-lg font-medium">Face ID is registered and active</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          if (isProcessing) return;
                          await handleRegister();
                        }}
                        disabled={isProcessing}
                        className={`mt-4 w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                          isProcessing 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                        }`}
                      >
                        Register Face ID
                      </button>
                      <p className="mt-2 text-center text-gray-600">{status}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
