import React, { useState, useEffect } from "react";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Swal from "sweetalert2";
import { FaRegUserCircle, FaUserAlt } from "react-icons/fa";
import { IoIosLock } from "react-icons/io";

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

  const employeeId = localStorage.getItem("employeeId");
  const employeeUsername = localStorage.getItem("employeeUsername");
  const employeeFirstName = localStorage.getItem("employeeFirstName");
  const employeeLastName = localStorage.getItem("employeeLastName");
  const employeeEmail = localStorage.getItem("employeeEmail");

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [activeTab, setActiveTab] = useState("profile");
  const [userData, setUserData] = useState({
    employee_firstname: "",
    employee_lastname: "",
    employee_username: "",
    employee_middlename: "",
    employee_suffix: "",
    employee_email: "",
    employee_address: "",
    employee_phone: "",
    employee_department: "",
    employee_dateOfBirth: "",
    currentPassword: "",
    newPassword: "",
    employee_id: "",
    profilePicture: null,
  });
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAl = "http://localhost:7685";

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleUpload = async (file) => {
    const username = localStorage.getItem("employeeUsername");
    if (!username || !file) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No file selected or user not logged in.",
        confirmButtonColor: "#d33",
      });
      return;
    }

    const formData = new FormData();
    formData.append("profile_picture", fileInput.files[0]);
    formData.append("employeeId", employeeId);
    formData.append("username", employeeUsername);
    formData.append("firstName", employeeFirstName);
    formData.append("lastName", employeeLastName);
    formData.append("email", employeeEmail);
    try {
      const response = await fetch(
        `${APIBase_URL}/api/upload-profile-picture?username=${username}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to upload image");
      }

      // Update user data with new profile picture URL
      setUserData((prevData) => ({
        ...prevData,
        profilePicture: result.profilePicture || null,
      }));

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Profile picture updated successfully!",
        confirmButtonColor: "#4CAF50",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
        confirmButtonColor: "#d33",
      });
    }
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfilePicture(URL.createObjectURL(file)); // Update preview
    handleUpload(e); // Upload the file
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const username = localStorage.getItem("employeeUsername");
      if (!username) {
        setError("User not logged in");
        return;
      }

      try {
        const response = await fetch(
          `${APIBase_URL}/api/user/current?username=${username}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch user data");
        }

        setUserData((prevData) => ({
          ...prevData,
          employee_id: data.employee_id || "",
          employee_firstname: data.employee_firstname || "",
          employee_lastname: data.employee_lastname || "",
          employee_middlename: data.employee_middlename || "",
          employee_username: data.employee_username || "",
          employee_email: data.employee_email || "",
          employee_suffix: data.employee_suffix || "",
          employee_address: data.employee_address || "",
          employee_phone: data.employee_phone || "",
          employee_department: data.employee_department || "",
          employee_dateOfBirth: data.employee_dateOfBirth || "",
          profilePicture: data.profilePicture || null,
        }));
      } catch (error) {
        setError(error.message);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message,
          confirmButtonColor: "#d33",
        });
      }
    };

    fetchUserData();
  }, []);

  const formatBirthday = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = localStorage.getItem("employeeUsername");

    try {
      const response = await fetch(
        `${APIBase_URL}/api/user/update?username=${username}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update user data");
      }

      const updatedData = await response.json();
      setUserData(updatedData);
      setIsEditing(false);
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Profile updated successfully!",
        confirmButtonColor: "#4CAF50",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
        confirmButtonColor: "#d33",
      });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const username = localStorage.getItem("employeeUsername");

    if (!userData.currentPassword || !userData.newPassword) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please fill in both current and new passwords",
        confirmButtonColor: "#d33",
      });
      return;
    }

    try {
      // Changed from LOCAL to APIBase_URL
      const response = await fetch(`${LOCAl}/api/user/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          currentPassword: userData.currentPassword,
          newPassword: userData.newPassword,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to change password");
      }

      // Clear form fields
      setUserData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: ""
      }));

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Password changed successfully! Please login again with your new password.",
        confirmButtonColor: "#4CAF50",
      }).then(() => {
        // Force logout after password change
        localStorage.clear();
        window.location.href = '/employeelogin';
      });
      
    } catch (error) {
      console.error('Password change error:', error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleResize = () => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
      setIsSidebarOpen(true);
    }
  };

  const [profilePicture, setProfilePicture] = useState("");

  useEffect(() => {
    if (employeeId) {
      fetch(`${APIBase_URL}/api/profile-picture?employeeId=${employeeId}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.profilePicture) {
            setProfilePicture(data.profilePicture);
          }
        })
        .catch((error) => console.error("Error fetching profile data:", error));
    }
  }, [employeeId]);

  const handleDeletePicture = () => {
    setProfilePicture(null); // Clear profile picture
  };

  useEffect(() => {
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="flex md:flex-row">
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
        
        <div className="min-h-screen bg-base-200 p-4 md:p-6">
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h1 className="text-2xl font-bold">Account Settings</h1>
                  <div className="text-sm breadcrumbs">
                    <ul>
                      <li>Account</li>
                      <li>{activeTab === "password" ? "Change Password" : "Profile"}</li>
                    </ul>
                  </div>
                </div>

                <div className="tabs tabs-boxed bg-base-200 mt-4 md:mt-0">
                  <button
                    onClick={() => {
                      setActiveTab("password");
                      setIsEditing(true);
                      setIsChangingPassword(false);
                    }}
                    className={`tab ${activeTab === "password" ? "tab-active" : ""}`}
                  >
                    <IoIosLock className="w-4 h-4 mr-2" />
                    Change Password
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("profile");
                      setIsEditing(true);
                      setIsChangingPassword(false);
                    }}
                    className={`tab ${activeTab === "profile" ? "tab-active" : ""}`}
                  >
                    <FaUserAlt className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              {activeTab === "profile" && (
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center">
                    <div className="avatar">
                      <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        {profilePicture ? (
                          <img src={profilePicture} alt="Profile" />
                        ) : (
                          <div className="bg-neutral-focus text-neutral-content rounded-full w-24">
                            <FaRegUserCircle className="w-24 h-24" />
                          </div>
                        )}
                      </div>
                    </div>
                    <label className="btn btn-ghost btn-sm mt-4">
                      <span className="text-primary">{profilePicture ? "Change Picture" : "Add Picture"}</span>
                      <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Employee ID</span>
                      </label>
                      <input
                        type="text"
                        name="employee_id"
                        value={userData.employee_id}
                        className="input input-bordered"
                        disabled
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">First Name</span>
                      </label>
                      <input
                        type="text"
                        name="employee_firstname"
                        value={userData.employee_firstname}
                        onChange={handleInputChange}
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
                        value={userData.employee_lastname}
                        onChange={handleInputChange}
                        className="input input-bordered"
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Middle Name</span>
                      </label>
                      <input
                        type="text"
                        name="employee_middlename"
                        value={userData.employee_middlename}
                        onChange={handleInputChange}
                        className="input input-bordered"
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Email</span>
                      </label>
                      <input
                        type="email"
                        name="employee_email"
                        value={userData.employee_email}
                        onChange={handleInputChange}
                        className="input input-bordered"
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Address</span>
                      </label>
                      <input
                        type="text"
                        name="employee_address"
                        value={userData.employee_address}
                        onChange={handleInputChange}
                        className="input input-bordered"
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Department</span>
                      </label>
                      <input
                        type="text"
                        name="employee_department"
                        value={userData.employee_department}
                        onChange={handleInputChange}
                        disabled
                        className="input input-bordered"
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Date of Birth</span>
                      </label>
                      <input
                        type="date"
                        name="employee_dateOfBirth"
                        value={userData.employee_dateOfBirth}
                        onChange={handleInputChange}
                        className="input input-bordered"
                      />
                    </div>

                    <div className="col-span-2">
                      <button type="submit" className="btn btn-primary w-full max-w-xs">
                        Save Changes
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {activeTab === "password" && (
                <form onSubmit={handlePasswordChange} className="max-w-md mx-auto">
                  <h2 className="text-2xl font-bold mb-6">Change Password</h2>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Current Password</span>
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={userData.currentPassword}
                      onChange={handleInputChange}
                      className="input input-bordered"
                    />
                  </div>
                  <div className="form-control mt-4">
                    <label className="label">
                      <span className="label-text">New Password</span>
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={userData.newPassword}
                      onChange={handleInputChange}
                      className="input input-bordered"
                    />
                  </div>
                  <div className="mt-6">
                    <button type="submit" className="btn btn-primary w-full">
                      Update Password
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
