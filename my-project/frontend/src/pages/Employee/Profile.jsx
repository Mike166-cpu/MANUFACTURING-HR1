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
      const response = await fetch(`${APIBase_URL}/api/user/change-password`, {
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

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Password changed successfully!",
        confirmButtonColor: "#4CAF50",
      });
      setIsChangingPassword(false);
      setUserData({ ...userData, currentPassword: "", newPassword: "" });
    } catch (error) {
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

        {/* Mobile overlay */}
        {isSidebarOpen && isMobileView && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-10"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
        <div className="min-h-screen bg-slate-100 p-4 md:p-6 dark:bg-gray-800">
          <div className="flex flex-col md:flex-row mb-2 p-5 bg-white border rounded-lg shadow-sm">
            <div className="flex-grow">
              <h1 className="text-xl md:text-2xl font-bold mt-2 dark:text-black">
                Account
              </h1>{" "}
              <div className="text-sm text-gray-500">
                <nav className="flex items-center space-x-2">
                  <span>Account</span>
                  <span>{">"}</span>
                  {activeTab === "password" ? (
                    <span className="text-blue-800">Change Password</span>
                  ) : (
                    <span className="text-blue-800">Profile</span>
                  )}
                </nav>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:space-y-0 md:space-x-4 mt-4 md:mt-0">
              <button
                onClick={() => {
                  setActiveTab("password");
                  setIsEditing(true);
                  setIsChangingPassword(false);
                }}
                className={`p-4 rounded-lg flex items-center text-sm ${
                  activeTab === "password"
                    ? "underline text-blue-800"
                    : "text-blue text-black"
                }`}
              >
                <IoIosLock className="w-5 h-5 mr-1" />
                Change Password
              </button>

              <button
                onClick={() => {
                  setActiveTab("profile");
                  setIsEditing(true);
                  setIsChangingPassword(false);
                }}
                className={`p-4 rounded-lg flex items-center text-sm ${
                  activeTab === "profile"
                    ? "underline text-blue-800"
                    : "text-blue text-black"
                }`}
              >
                <FaUserAlt className="w-5 h-5 mr-1" />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Profile Picture Section */}

          <div className="bg-white rounded-lg shadow-md p-5 md:p-6">
            {activeTab === "profile" && (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col md:flex-row gap-4"
              >
                {" "}
                <div className="flex flex-col items-center pt-10 pr-5">
                  {profilePicture ? (
                    <img
                      src={profilePicture} // Full URL to the image
                      alt="Profile"
                      className="profile-img w-24 h-24 rounded-full object-cover" // Adjusted size and shape
                      style={{ width: "80px", height: "80px" }} // Adjust the width and height here
                    />
                  ) : (
                    <FaRegUserCircle className="w-24 h-24 text-gray-400" />
                  )}

                  <label
                    htmlFor="fileInput"
                    className="mt-2 cursor-pointer text-sm text-blue-500 hover:underline"
                  >
                    {profilePicture
                      ? "Change profile picture"
                      : "Add profile picture"}
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="fileInput"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  <div>
                    {/* Firstname */}
                    <label className="text-sm font-semibold capitalize">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      name="employee_id"
                      value={userData.employee_id}
                      onChange={handleInputChange}
                      className="border p-2 rounded w-full dark:bg-white dark:text-black capitalize"
                      readOnly
                      disabled
                    />
                  </div>
                  <div>
                    {/* Firstname */}
                    <label className="text-sm font-semibold capitalize">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="employee_firstname"
                      value={userData.employee_firstname}
                      onChange={handleInputChange}
                      className="border p-2 rounded w-full dark:bg-white dark:text-black capitalize"
                    />
                  </div>

                  {/* Lastname */}
                  <div>
                    <label className="text-sm font-semibold capitalize">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="employee_lastname"
                      value={userData.employee_lastname}
                      onChange={handleInputChange}
                      className="border p-2 rounded w-full dark:bg-white dark:text-black capitalize"
                    />
                  </div>

                  {/* Middlename */}
                  <div>
                    <label className="text-sm font-semibold capitalize">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="employee_middlename"
                      value={userData.employee_middlename}
                      onChange={handleInputChange}
                      className="border p-2 rounded w-full dark:bg-white dark:text-black capitalize"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-semibold">Email</label>
                    <input
                      type="email"
                      name="employee_email"
                      value={userData.employee_email}
                      onChange={handleInputChange}
                      className="border p-2 rounded w-full dark:bg-white dark:text-black"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="text-sm font-semibold">Address</label>
                    <input
                      type="text"
                      name="employee_address"
                      value={userData.employee_address}
                      onChange={handleInputChange}
                      className="border p-2 rounded w-full dark:bg-white dark:text-black capitalize"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="text-sm font-semibold">Department</label>
                    <input
                      type="text"
                      name="employee_department"
                      value={userData.employee_department}
                      onChange={handleInputChange}
                      disabled
                      className="border p-2 rounded w-full dark:bg-white dark:text-black"
                    />
                  </div>

                  {/* Birthday */}
                  <div>
                    <label className="text-sm font-semibold">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="employee_dateOfBirth"
                      value={userData.employee_dateOfBirth}
                      onChange={handleInputChange}
                      className="border p-2 rounded w-full dark:bg-white dark:text-black"
                    />
                  </div>
                  <div className="flex justify-start mt-4">
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            )}

            {activeTab === "password" && (
              <form onSubmit={handlePasswordChange} className="mt-4">
                <div>
                  <h1 className="text-xl font-bold pb-4 dark:text-black">
                    Change Password
                  </h1>
                  <label className="text-sm font-semibold">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={userData.currentPassword}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full dark:bg-white dark:text-black"
                  />
                </div>
                <div className="mt-4">
                  <label className="text-sm font-semibold">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={userData.newPassword}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full dark:bg-white dark:text-black"
                  />
                </div>
                <div className="flex justify-start mt-4">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
