import React, { useState, useEffect } from "react";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Breadcrumbs from "../../Components/BreadCrumb";
import Swal from "sweetalert2";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, User, Mail, Phone, Building, Clock, Calendar, Edit } from "lucide-react";

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

const Profile = () => {
  useEffect(() => {
    document.title = "Profile";
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobileView = useMediaQuery("(max-width: 768px)");

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

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

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  //FETCH EMPLOYEE DATA
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    department: "",
    position: "",
    dateHired: "",
    employeeId: "",
    profilePicture: "",
    address: "",
    emergencyContact: {
      name: "",
      relationship: "",
      phone: ""
    }
  });
  
  const fetchUser = async () => {
    const employeeId = localStorage.getItem("employeeId"); 

    try {
      const response = await axios.get(
        `${APIBASED_URL}/api/hr/user/${employeeId}`
      );
      setProfile(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to load profile",
        text: "Please try again later",
      });
    }
  };
  
  useEffect(() => {
    fetchUser();
  }, []); 

  // CHANGE PROFILE PICTURE
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    }
  });

  const handleUploadProfilePicture = async () => {
    if (!file) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select an image file.",
      });
      return;
    }

    setUploading(true);
    Swal.fire({
      title: "Uploading profile picture...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "HR1_UPLOADS");
    data.append("cloud_name", "da7oknctx");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/da7oknctx/image/upload",
        {
          method: "POST",
          body: data,
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setUploadProgress(Math.round(progress));
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Upload failed with status: ${res.status}`);
      }

      const uploadFile = await res.json();

      if (!uploadFile.secure_url) {
        throw new Error("No secure URL received from Cloudinary");
      }

      const employeeId = localStorage.getItem("employeeId");
      
      // Update profile picture URL in backend
      await axios.put(`${APIBASED_URL}/api/hr/update-profile-picture/${employeeId}`, {
        profile_picture: uploadFile.secure_url,
      });

      // Update local profile state
      setProfile(prev => ({
        ...prev,
        profilePicture: uploadFile.secure_url
      }));

      setIsModalOpen(false);
      setFile(null);
      Swal.fire({
        icon: "success",
        title: "Profile picture updated successfully!",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      Swal.fire({
        icon: "error",
        title: "Upload failed!",
        text: error.message || "Failed to upload profile picture",
        showConfirmButton: true,
      });
    } finally {
      setUploading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
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
            className="fixed inset-0 bg-black bg-opacity-50 z-10"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <div className="p-4 lg:p-6 bg-white shadow-sm border-b">
          <Breadcrumbs />
          <h1 className="text-2xl font-semibold text-gray-800 mt-2">Profile</h1>
        </div>

        {/* MAIN CONTENT */}
        <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
          <div className="max-w-5xl mx-auto">
            {/* Profile header */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="relative h-40 bg-gradient-to-r from-blue-500 to-purple-600">
                <div className="absolute -bottom-12 left-8">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full ring-4 ring-white bg-white flex items-center justify-center overflow-hidden">
                      {profile.profilePicture ? (
                        <img 
                          src={profile.profilePicture} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={40} className="text-gray-400" />
                      )}
                    </div>
                    <button 
                      className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-full shadow-lg transition-colors"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="pt-16 pb-6 px-8">
                <h2 className="text-2xl font-bold text-gray-800">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-gray-600 mt-1">{profile.position}</p>
              </div>
            </div>
            
            {/* Profile details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal info */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{profile.phoneNumber || "Not provided"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <User className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Employee ID</p>
                      <p className="font-medium">{profile._id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Building className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{profile.address || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Work info */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Work Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Building className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="font-medium">{profile.department}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Position</p>
                      <p className="font-medium">{profile.position}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Date Hired</p>
                      <p className="font-medium">{formatDate(profile.dateHired)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Emergency contact */}
              <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contact</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{profile.emergencyContact?.name || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Relationship</p>
                    <p className="font-medium">{profile.emergencyContact?.relationship || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{profile.emergencyContact?.phone || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => !uploading && setIsModalOpen(false)}></div>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 z-10">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Update Profile Picture
                </h3>

                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                    file ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-500"
                  }`}
                >
                  <input {...getInputProps()} />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      <div className="w-full max-w-xs mx-auto">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm mt-2 text-gray-600">{uploadProgress}% uploaded</p>
                      </div>
                    </div>
                  ) : file ? (
                    <div className="flex flex-col items-center gap-3">
                      <img src={URL.createObjectURL(file)} alt="Preview" className="w-32 h-32 rounded-full object-cover" />
                      <p className="text-sm text-gray-500">Click or drag to change image</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-12 h-12 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-700">Drop your image here, or click to browse</p>
                        <p className="text-sm text-gray-500 mt-1">Supports JPG, JPEG, PNG</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setIsModalOpen(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button 
                    className={`px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 ${
                      uploading ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                    onClick={handleUploadProfilePicture}
                    disabled={uploading || !file}
                  >
                    {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {uploading ? "Uploading..." : "Update Profile Picture"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;