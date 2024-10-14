import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeNavbar from "../../Components/EmployeeNavbar";
import { MdOutlineAccountCircle } from "react-icons/md";
import { IoMdLock } from "react-icons/io";

const EditProfile = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("editProfile"); // Toggle between Edit Profile and Change Password

  // State to hold the employee's profile data
  const [employeeData, setEmployeeData] = useState({
    employee_firstname: "",
    employee_middlename: "",
    employee_lastname: "",
    employee_suffix: "",
    employee_username: "",
    employee_email: "",
    employee_phone: "",
    employee_address: "",
    employee_dateOfBirth: "",
    employee_gender: "",
    employee_department: "",
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch data from localStorage when the component mounts
  useEffect(() => {
    const employeeFirstName = localStorage.getItem("employeeFirstName");
    const employeeMiddleName = localStorage.getItem("employeeMiddleName");
    const employeeLastName = localStorage.getItem("employeeLastName");
    const employeeSuffix = localStorage.getItem("employeeSuffix");
    const employeeUsername = localStorage.getItem("employeeUsername");
    const employeeEmail = localStorage.getItem("employeeEmail");
    const employeePhone = localStorage.getItem("employeePhone");
    const employeeAddress = localStorage.getItem("employeeAddress");
    const employeeDateOfBirth = localStorage.getItem("employeeDateOfBirth");
    const employeeGender = localStorage.getItem("employeeGender");
    const employeeDepartment = localStorage.getItem("employeeDepartment");

    // Set the data into the state
    setEmployeeData({
      employee_firstname: employeeFirstName || "",
      employee_middlename: employeeMiddleName || "",
      employee_lastname: employeeLastName || "",
      employee_suffix: employeeSuffix || "",
      employee_username: employeeUsername || "",
      employee_email: employeeEmail || "",
      employee_phone: employeePhone || "",
      employee_address: employeeAddress || "",
      employee_dateOfBirth: employeeDateOfBirth || "",
      employee_gender: employeeGender || "",
      employee_department: employeeDepartment || "",
    });
  }, []);

  // Handle input change for each field
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmployeeData({
      ...employeeData,
      [name]: value,
    });
  };

  // Handle password input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="h-screen">
      <EmployeeNavbar
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <div
        className={`transition-all duration-300 ease-in-out flex-grow ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/*MAIN CONTENT*/}
        <div className="flex w-full h-screen">
          {/* Sidebar */}
          <div
            className={`transition-all duration-300 ease-in-out p-2 h-screen${
              isSidebarOpen ? "w-96 md:w-96 " : "w-64 md:w-96 "
            }`}
          >
            <ul>
              <h1 className="text-2xl font-bold py-8">Settings</h1>
              <div className="flex gap-2">
                <div
                  className={`cursor-pointer font-normal text-sm p-2 mb-2 w-full flex gap-2 ${
                    activeSection === "editProfile"
                      ? "bg-blue-100 text-gray-800 rounded-md"
                      : ""
                  }`}
                  onClick={() => setActiveSection("editProfile")}
                >
                  <div>
                    <MdOutlineAccountCircle className="w-6 h-6" />
                  </div>
                  Profile <br /> Manage your public profile and private
                  information
                </div>
              </div>

              <div className="flex gap-2">
                <div
                  className={`cursor-pointer font-normal text-sm p-2 mb-2 w-full flex gap-2 ${
                    activeSection === "changePassword"
                      ? "bg-blue-100 text-gray-800 rounded-md"
                      : ""
                  }`}
                  onClick={() => setActiveSection("changePassword")}
                >
                  <div>
                    <IoMdLock className="w-6 h-6" />
                  </div>
                  Security <br /> Manage your password
                </div>
              </div>
            </ul>
          </div>

          {/* Main Content Area */}
          <div className="flex p-6 w-full bg-gray-100">
            {activeSection === "editProfile" ? (
              <div>
                <h2 className="text-2xl font-medium mb-4">Account</h2>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {/* Form Fields */}
                  <div>
                    <label className="font-medium">First Name</label>
                    <input
                      type="text"
                      name="employee_firstname"
                      value={employeeData.employee_firstname}
                      onChange={handleInputChange}
                      className="input input-bordered w-full text-sm "
                    />
                  </div>
                  <div>
                    <label className="font-medium ">Middle Name</label>
                    <input
                      type="text"
                      name="employee_middlename"
                      value={employeeData.employee_middlename}
                      onChange={handleInputChange}
                      className="input input-bordered w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Last Name</label>
                    <input
                      type="text"
                      name="employee_lastname"
                      value={employeeData.employee_lastname}
                      onChange={handleInputChange}
                      className="input input-bordered w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Suffix</label>
                    <input
                      type="text"
                      name="employee_suffix"
                      value={employeeData.employee_suffix}
                      onChange={handleInputChange}
                      className="input input-bordered w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="font">Username</label>
                    <input
                      type="text"
                      name="employee_username"
                      value={employeeData.employee_username}
                      onChange={handleInputChange}
                      className="input input-bordered w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Email</label>
                    <input
                      type="email"
                      name="employee_email"
                      value={employeeData.employee_email}
                      onChange={handleInputChange}
                      className="input input-bordered w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Phone</label>
                    <input
                      type="text"
                      name="employee_phone"
                      value={employeeData.employee_phone}
                      onChange={handleInputChange}
                      className="input input-bordered w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Address</label>
                    <input
                      type="text"
                      name="employee_address"
                      value={employeeData.employee_address}
                      onChange={handleInputChange}
                      className="input input-bordered w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Date of Birth</label>
                    <input
                      type="date"
                      name="employee_dateOfBirth"
                      value={employeeData.employee_dateOfBirth}
                      onChange={handleInputChange}
                      className="input input-bordered w-full text-sm"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="font-medium">Gender</label>
                    <input
                      name="employee_gender"
                      value={employeeData.employee_gende}
                      onChange={handleInputChange}
                      className="select select-bordered w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="font">Department:</label>
                    <input
                      type="text"
                      name="employee_department"
                      value={employeeData.employee_department}
                      onChange={handleInputChange}
                      className="input input-border w-full text-sm"
                      readOnly
                    />
                  </div>
                </div>
                <button className="btn btn-primary mt-4">Save Changes</button>
              </div>
            ) : (
              <div className="pt-5">
                <h2 className="text-xl font-medium mb-4">Change Password</h2>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="font-medium text-sm">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="input input-bordered w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-sm">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="input input-bordered w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-sm">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="input input-bordered w-full text-sm"
                    />
                    <span className="text-sm pt-1 hover:underline cursor-pointer">Forgot password?</span>
                  </div>
                </div>
                <button className="btn btn-primary mt-4">
                  Change Password
                </button>
              </div>
            )}
          </div>
        </div>

        {/*END OF MAIN CONTENT*/}
      </div>
    </div>
  );
};

export default EditProfile;
