import React, { useState, useEffect } from "react";
import { MdOutlineAccountCircle } from "react-icons/md";
import { IoMdLock } from "react-icons/io";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";

const EditProfile = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("personalInformation");

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

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmployeeData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSubmitPersonalInfo = (e) => {
    e.preventDefault();
    console.log("Personal Information:", employeeData);
  };

  const handleSubmitPassword = (e) => {
    e.preventDefault();
    console.log("Password Data:", passwordData);
  };

  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setProfileImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  return (
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
        <div className="p-8 bg-slate-100 min-h-screen">
          <h1 className="text-2xl font-semibold mb-6">Edit Profile</h1>

          {/* Navigation Tabs */}
          <div className="mb-6">
            <nav className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveSection("personalInformation")}
                className={`mr-6 pb-2 ${
                  activeSection === "personalInformation"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <MdOutlineAccountCircle className="inline-block mr-1" />
                Personal Information
              </button>
              <button
                onClick={() => setActiveSection("changePassword")}
                className={`mr-6 pb-2 ${
                  activeSection === "changePassword"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <IoMdLock className="inline-block mr-1" />
                Change Password
              </button>
            </nav>
          </div>

          {/* Conditional Rendering Based on Active Section */}
          {activeSection === "personalInformation" && (
            <form onSubmit={handleSubmitPersonalInfo} className="space-y-6">
       
              {/* Personal Information Container */}
             
              <div className="bg-white p-6 rounded shadow">
              <div className="mb-6">
                <h2 className="text-xl font-medium mb-4">Profile Picture</h2>
                <div className="flex items-center">
                  <div className="mr-4">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Profile Preview"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 bg- rounded-full flex items-center justify-center">
                        <MdOutlineAccountCircle size={50} />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
                <h2 className="text-xl font-medium mb-4">
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="employee_firstname"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      id="employee_firstname"
                      name="employee_firstname"
                      value={employeeData.employee_firstname}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="employee_middlename"
                    >
                      Middle Name
                    </label>
                    <input
                      type="text"
                      id="employee_middlename"
                      name="employee_middlename"
                      value={employeeData.employee_middlename}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="employee_lastname"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="employee_lastname"
                      name="employee_lastname"
                      value={employeeData.employee_lastname}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="employee_suffix"
                    >
                      Suffix
                    </label>
                    <input
                      type="text"
                      id="employee_suffix"
                      name="employee_suffix"
                      value={employeeData.employee_suffix}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="employee_username"
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      id="employee_username"
                      name="employee_username"
                      value={employeeData.employee_username}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="employee_email"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="employee_email"
                      name="employee_email"
                      value={employeeData.employee_email}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="employee_phone"
                    >
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="employee_phone"
                      name="employee_phone"
                      value={employeeData.employee_phone}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="employee_address"
                    >
                      Address
                    </label>
                    <input
                      type="text"
                      id="employee_address"
                      name="employee_address"
                      value={employeeData.employee_address}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="employee_dateOfBirth"
                    >
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="employee_dateOfBirth"
                      name="employee_dateOfBirth"
                      value={employeeData.employee_dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="employee_gender"
                    >
                      Gender
                    </label>
                    <select
                      id="employee_gender"
                      name="employee_gender"
                      value={employeeData.employee_gender}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="employee_department"
                    >
                      Department
                    </label>
                    <input
                      type="text"
                      id="employee_department"
                      name="employee_department"
                      value={employeeData.employee_department}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-right">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {activeSection === "changePassword" && (
            <form onSubmit={handleSubmitPassword} className="space-y-6">
              {/* Change Password Container */}
              <div className="bg-white p-6 rounded shadow">
                <h2 className="text-xl font-medium mb-4 flex items-center">
                  <IoMdLock className="mr-2" /> Change Password
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="currentPassword"
                    >
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="newPassword"
                    >
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="confirmPassword"
                    >
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-right">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Change Password
                </button>
              </div>
            </form>
          )}
        </div>
        {/* MAIN CONTENT */}
      </div>
    </div>
  );
};

export default EditProfile;
