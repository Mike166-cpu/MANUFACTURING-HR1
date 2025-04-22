import React, { useState, useEffect } from "react";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import Breadcrumbs from "../../Components/BreadCrumb";
import Swal from "sweetalert2";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, User, Mail, Phone, Building, Clock, Calendar, Edit, BookOpen, Heart } from "lucide-react";

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
    education: [],
    skills: [],
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
        `${APIBASED_URL}/api/employeeData/${employeeId}`
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
        icon: 'error',
        title: 'Error',
        text: 'Please select an image file.'
      });
      return;
    }
  
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "HR1_UPLOADS");
    formData.append("cloud_name", "da7oknctx");
  
    try {
      Swal.fire({
        title: 'Uploading image...',
        html: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const uploadResponse = await axios.post(
        "https://api.cloudinary.com/v1_1/da7oknctx/image/upload",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setUploadProgress(Math.round(progress));
            Swal.update({
              html: `Upload progress: ${Math.round(progress)}%`
            });
          },
        }
      );
  
      if (!uploadResponse.data.secure_url) {
        throw new Error("No secure URL received from Cloudinary");
      }
  
      const employeeId = localStorage.getItem("employeeId");
      
      await axios.put(
        `${APIBASED_URL}/api/employeeData/update-profile-picture/${employeeId}`,
        {
          profile_picture: uploadResponse.data.secure_url,
        }
      );
  
      setProfile(prev => ({
        ...prev,
        profilePicture: uploadResponse.data.secure_url
      }));
  
      setIsModalOpen(false);
      setFile(null);
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Profile picture updated successfully!',
        timer: 1500,
        showConfirmButton: false
      });
      
      fetchUser();
      
    } catch (error) {
      console.error("Upload failed:", error);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.response?.data?.message || 'Failed to upload profile picture'
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

  // Add new state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    phoneNumber: "",
    address: "",
    education: [{
      level: '',
      schoolName: '',
      yearCompleted: '',
      course: ''
    }],
    skills: [],
    emergencyContact: {
      name: "",
      relationship: "",
      phone: ""
    }
  });

  const handleEditClick = () => {
    // Load all existing profile data into edit form
    setEditForm({
      phoneNumber: profile.phoneNumber || "",
      address: profile.address || "",
      education: profile.education || [{
        level: '',
        schoolName: '',
        yearCompleted: '',
        course: ''
      }],
      skills: profile.skills || [],
      emergencyContact: {
        name: profile.emergencyContact?.name || "",
        relationship: profile.emergencyContact?.relationship || "",
        phone: profile.emergencyContact?.phone || ""
      }
    });
    setIsEditing(true);
  };

  const handleSkillChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim());
    setEditForm(prev => ({
      ...prev,
      skills: skills
    }));
  };

  const handleEducationChange = (index, field, value) => {
    setEditForm(prev => {
      const newEducation = [...prev.education];
      newEducation[index] = {
        ...newEducation[index],
        [field]: value
      };
      return {
        ...prev,
        education: newEducation
      };
    });
  };

  const addEducation = () => {
    setEditForm(prev => ({
      ...prev,
      education: [...prev.education, {
        level: '',
        schoolName: '',
        yearCompleted: '',
        course: ''
      }]
    }));
  };

  const removeEducation = (index) => {
    setEditForm(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleSaveChanges = async () => {
    try {
      const employeeId = profile.employeeId;
      
      Swal.fire({
        title: 'Updating profile...',
        html: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      await axios.put(`${APIBASED_URL}/api/employeeData/${employeeId}`, {
        phoneNumber: editForm.phoneNumber,
        address: editForm.address,
        education: editForm.education,
        skills: editForm.skills,
        emergencyContact: editForm.emergencyContact
      });
      
      // Update local profile state with all the data
      setProfile(prev => ({
        ...prev,
        phoneNumber: editForm.phoneNumber,
        address: editForm.address,
        education: editForm.education,
        skills: editForm.skills,
        emergencyContact: editForm.emergencyContact
      }));
      
      setIsEditing(false);

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Profile updated successfully!',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.message || 'Failed to update profile'
      });
    }
  };

  const renderPersonalInfo = () => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
        {!isEditing && (
          <button
            onClick={handleEditClick}
            className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
          >
            <Edit size={16} />
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500">Phone Number</label>
            <input
              type="text"
              value={editForm.phoneNumber}
              onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
              className="w-full mt-1 p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500">Address</label>
            <input
              type="text"
              value={editForm.address}
              onChange={(e) => setEditForm({...editForm, address: e.target.value})}
              className="w-full mt-1 p-2 border rounded-lg"
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-500">Education Background</label>
              <button
                type="button"
                onClick={addEducation}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                + Add Education
              </button>
            </div>
            {editForm.education.map((edu, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between">
                  <h4 className="font-medium">Education #{index + 1}</h4>
                  {editForm.education.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      className="text-red-500 hover:text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-500">Level</label>
                    <select
                      value={edu.level}
                      onChange={(e) => handleEducationChange(index, 'level', e.target.value)}
                      className="w-full mt-1 p-2 border rounded-lg"
                    >
                      <option value="">Select Level</option>
                      <option value="Elementary">Elementary</option>
                      <option value="High School">High School</option>
                      <option value="College">College</option>
                      <option value="Graduate School">Graduate School</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Year Completed</label>
                    <input
                      type="text"
                      value={edu.yearCompleted}
                      onChange={(e) => handleEducationChange(index, 'yearCompleted', e.target.value)}
                      className="w-full mt-1 p-2 border rounded-lg"
                      placeholder="YYYY"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">School Name</label>
                  <input
                    type="text"
                    value={edu.schoolName}
                    onChange={(e) => handleEducationChange(index, 'schoolName', e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg"
                    placeholder="Enter school name"
                  />
                </div>
                {edu.level === 'College' || edu.level === 'Graduate School' ? (
                  <div>
                    <label className="text-sm text-gray-500">Course/Degree</label>
                    <input
                      type="text"
                      value={edu.course}
                      onChange={(e) => handleEducationChange(index, 'course', e.target.value)}
                      className="w-full mt-1 p-2 border rounded-lg"
                      placeholder="Enter course or degree"
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div>
            <label className="text-sm text-gray-500">Skills (comma-separated)</label>
            <textarea
              value={editForm.skills.join(', ')}
              onChange={handleSkillChange}
              className="w-full mt-1 p-2 border rounded-lg"
              rows="3"
              placeholder="Enter skills separated by commas"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500">Emergency Contact Name</label>
            <input
              type="text"
              value={editForm.emergencyContact.name}
              onChange={(e) => setEditForm({
                ...editForm,
                emergencyContact: {...editForm.emergencyContact, name: e.target.value}
              })}
              className="w-full mt-1 p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500">Emergency Contact Relationship</label>
            <input
              type="text"
              value={editForm.emergencyContact.relationship}
              onChange={(e) => setEditForm({
                ...editForm,
                emergencyContact: {...editForm.emergencyContact, relationship: e.target.value}
              })}
              className="w-full mt-1 p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500">Emergency Contact Phone</label>
            <input
              type="text"
              value={editForm.emergencyContact.phone}
              onChange={(e) => setEditForm({
                ...editForm,
                emergencyContact: {...editForm.emergencyContact, phone: e.target.value}
              })}
              className="w-full mt-1 p-2 border rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Email</label>
            <input 
              type="text"
              value={profile.email}
              readOnly
              className="w-full p-2 border rounded-lg bg-gray-50"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Phone Number</label>
            <input 
              type="text"
              value={profile.phoneNumber || "Not provided"}
              readOnly
              className="w-full p-2 border rounded-lg bg-gray-50"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Employee ID</label>
            <input 
              type="text"
              value={profile.employeeId}
              readOnly
              className="w-full p-2 border rounded-lg bg-gray-50"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-sm text-gray-500 mb-1 block">Address</label>
            <input 
              type="text"
              value={profile.address || "Not provided"}
              readOnly
              className="w-full p-2 border rounded-lg bg-gray-50"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-sm text-gray-500 mb-1 block">Skills</label>
            <div className="flex flex-wrap gap-2 p-2 rounded-lg min-h-[42px]">
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">No skills listed</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

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
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Profile header */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
            
            {/* Personal Information */}
            {renderPersonalInfo()}
            
            {/* Work Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Work Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Department</label>
                  <input 
                    type="text"
                    value={profile.department}
                    readOnly
                    className="w-full p-2 border rounded-lg bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Position</label>
                  <input 
                    type="text"
                    value={profile.position}
                    readOnly
                    className="w-full p-2 border rounded-lg bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Date Hired</label>
                  <input 
                    type="text"
                    value={formatDate(profile.onboardingStatus?.lastUpdated)}
                    readOnly
                    className="w-full p-2 border rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            </div>
            
            {/* Educational Background */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Educational Background</h3>
                {!isEditing && (
                  <button
                    onClick={handleEditClick}
                    className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">Education History</p>
                    <button
                      type="button"
                      onClick={addEducation}
                      className="text-blue-500 hover:text-blue-600 text-sm"
                    >
                      + Add Education
                    </button>
                  </div>
                  {editForm.education.map((edu, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <h4 className="font-medium">Education #{index + 1}</h4>
                        {editForm.education.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEducation(index)}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-gray-500">Level</label>
                          <select
                            value={edu.level}
                            onChange={(e) => handleEducationChange(index, 'level', e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg"
                          >
                            <option value="">Select Level</option>
                            <option value="Elementary">Elementary</option>
                            <option value="High School">High School</option>
                            <option value="College">College</option>
                            <option value="Graduate School">Graduate School</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Year Completed</label>
                          <input
                            type="text"
                            value={edu.yearCompleted}
                            onChange={(e) => handleEducationChange(index, 'yearCompleted', e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg"
                            placeholder="YYYY"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">School Name</label>
                        <input
                          type="text"
                          value={edu.schoolName}
                          onChange={(e) => handleEducationChange(index, 'schoolName', e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg"
                          placeholder="Enter school name"
                        />
                      </div>
                      {edu.level === 'College' || edu.level === 'Graduate School' ? (
                        <div>
                          <label className="text-sm text-gray-500">Course/Degree</label>
                          <input
                            type="text"
                            value={edu.course}
                            onChange={(e) => handleEducationChange(index, 'course', e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg"
                            placeholder="Enter course or degree"
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.education && profile.education.length > 0 ? (
                    profile.education.map((edu, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-semibold text-gray-800">{edu.level}</p>
                        <p className="text-gray-600">{edu.schoolName}</p>
                        <p className="text-sm text-gray-500">
                          {edu.course && `${edu.course} • `}Completed {edu.yearCompleted}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No education history provided</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Emergency Contact */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Emergency Contact</h3>
                {!isEditing && (
                  <button
                    onClick={handleEditClick}
                    className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={editForm.emergencyContact.name}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        emergencyContact: {...editForm.emergencyContact, name: e.target.value}
                      })}
                      className="w-full mt-1 p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Emergency Contact Relationship</label>
                    <input
                      type="text"
                      value={editForm.emergencyContact.relationship}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        emergencyContact: {...editForm.emergencyContact, relationship: e.target.value}
                      })}
                      className="w-full mt-1 p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Emergency Contact Phone</label>
                    <input
                      type="text"
                      value={editForm.emergencyContact.phone}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        emergencyContact: {...editForm.emergencyContact, phone: e.target.value}
                      })}
                      className="w-full mt-1 p-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Name</label>
                    <input 
                      type="text"
                      value={profile.emergencyContact?.name || "Not provided"}
                      readOnly
                      className="w-full p-2 border rounded-lg bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Relationship</label>
                    <input 
                      type="text"
                      value={profile.emergencyContact?.relationship || "Not provided"}
                      readOnly
                      className="w-full p-2 border rounded-lg bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Phone</label>
                    <input 
                      type="text"
                      value={profile.emergencyContact?.phone || "Not provided"}
                      readOnly
                      className="w-full p-2 border rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
              )}
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