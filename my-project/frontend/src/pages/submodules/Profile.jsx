import React, { useState, useEffect } from "react";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import { CiLock } from "react-icons/ci";
import { FaRegUser } from "react-icons/fa";

const Profile = () => {
  useEffect (()=> {
    document.title = "Profile";
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employeeData, setEmployeeData] = useState({
    employee_firstname: localStorage.getItem("employeeFirstName"),
    employee_middlename: localStorage.getItem("employeeMiddleName"),
    employee_lastname: localStorage.getItem("employeeLastName"),
    employee_suffix: localStorage.getItem("employeeSuffix"),
    employee_username: localStorage.getItem("employeeUsername"),
    employee_email: localStorage.getItem("employeeEmail"),
    employee_phone: localStorage.getItem("employeePhone"),
    employee_address: localStorage.getItem("employeeAddress"),
    employee_dateOfBirth: localStorage.getItem("employeeDateOfBirth"),
    employee_gender: localStorage.getItem("employeeGender"),
    employee_department: localStorage.getItem("employeeDepartment"),
  });
  const [activeTab, setActiveTab] = useState("profile"); // State to toggle between tabs

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmployeeData({ ...employeeData, [name]: value });
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    console.log("Updated Profile Data:", employeeData);
  };

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChangePassword = (e) => {
    e.preventDefault();
    console.log("Change Password");
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const getBreadcrumb = () => {
    switch (activeTab) {
      case "profile":
        return (
          <>
            <span className="hover:underline cursor-pointer">Account</span> &gt;{" "}
            <span className="font-bold">Edit Profile</span>
          </>
        );
      case "password":
        return (
          <>
            <span className="hover:underline cursor-pointer">Account</span> &gt;{" "}
            <span className="font-bold">Change Password</span>
          </>
        );
      default:
        return <span className="font-bold">Profile</span>;
    }
  };

  return (
    <div>
      <div className="flex">
        <EmployeeSidebar
          onSidebarToggle={handleSidebarToggle}
          isSidebarOpen={isSidebarOpen}
        />
        <div
          className={`flex-grow transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "ml-72" : "ml-0"
          }`}
        >
          <EmployeeNav
            onSidebarToggle={handleSidebarToggle}
            isSidebarOpen={isSidebarOpen}
          />

          {/* MAIN CONTENT */}
          <div className="min-h-screen bg-slate-100 p-6 bg-opacity-10">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2 border rounded-lg p-5">
                Account
                <div className="font-normal text-sm text-blue-700">
                  {getBreadcrumb()}
                </div>
              </h1>
            </div>

            {/* Tab Navigation */}
            <div className="flex mb-4">
              <button
                className={`flex items-center mr-4 px-4 py-2 ${
                  activeTab === "profile"
                    ? "text-blue-500 underline"
                    : "bg-white text-gray-700"
                } rounded-md`}
                onClick={() => setActiveTab("profile")}
              >
                <FaRegUser className="mr-2" /> Edit Profile
              </button>

              <button
                className={`flex items-center mr-4 px-4 py-2 ${
                  activeTab === "password"
                    ? "text-blue-500 underline"
                    : "bg-white text-gray-700"
                } rounded-md`}
                onClick={() => setActiveTab("password")}
              >
                <CiLock className="mr-2" /> Change Password
              </button>
            </div>

            {/* Profile Form */}
            {activeTab === "profile" && (
              <form
                onSubmit={handleProfileUpdate}
                className="bg-white p-6 rounded-lg shadow-md"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="employee_firstname"
                      value={employeeData.employee_firstname || ""}
                      onChange={handleInputChange}
                      className="mt-1 p-2 border rounded-md w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="employee_middlename"
                      value={employeeData.employee_middlename || ""}
                      onChange={handleInputChange}
                      className="mt-1 p-2 border rounded-md w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="employee_lastname"
                      value={employeeData.employee_lastname || ""}
                      onChange={handleInputChange}
                      className="mt-1 p-2 border rounded-md w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Suffix
                    </label>
                    <input
                      type="text"
                      name="employee_suffix"
                      value={employeeData.employee_suffix || ""}
                      onChange={handleInputChange}
                      className="mt-1 p-2 border rounded-md w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="employee_email"
                      value={employeeData.employee_email || ""}
                      onChange={handleInputChange}
                      className="mt-1 p-2 border rounded-md w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="employee_phone"
                      value={employeeData.employee_phone || ""}
                      onChange={handleInputChange}
                      className="mt-1 p-2 border rounded-md w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <input
                      type="text"
                      name="employee_address"
                      value={employeeData.employee_address || ""}
                      onChange={handleInputChange}
                      className="mt-1 p-2 border rounded-md w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="employee_dateOfBirth"
                      value={employeeData.employee_dateOfBirth || ""}
                      onChange={handleInputChange}
                      className="mt-1 p-2 border rounded-md w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Gender
                    </label>
                    <input
                      type="text"
                      name="employee_gender"
                      value={employeeData.employee_gender || ""}
                      onChange={handleInputChange}
                      className="mt-1 p-2 border rounded-md w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <input
                      type="text"
                      name="employee_department"
                      value={employeeData.employee_department || ""}
                      onChange={handleInputChange}
                      className="mt-1 p-2 border rounded-md w-full"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </form>
            )}

            {activeTab === "password" && (
              <form onSubmit={handlePasswordSubmit}>
                <div className="grid grid-cols-1 gap-6 bg-white py-8 px-5 rounded-lg shadow-md">
                  <div>
                    <label className="block text-sm font-medium">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className=" block border-gray-300 rounded-md border h-3/4 w-2/4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="mt-1 block border-gray-300 rounded-md border h-3/4 w-2/4"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="mt-1 block border-gray-300 rounded-md border h-3/4 w-2/4"
                      required
                    />
                  </div>
                  <span className="underline text-blue-800 text-sm">
                    Forgot Password?
                  </span>
                  <button
                    type="submit"
                    className=" bg-blue-600 text-white text-sm py-2 px-4 rounded-md w-52"
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
