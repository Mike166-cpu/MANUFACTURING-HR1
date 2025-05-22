//EMPLOYEE

const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Active", "Suspended", "Resigned", "Terminated", "Retired", "Deceased"],
      default: "Active", 
    },
    statusHistory: [{
      status: String,
      remarks: String,
      updatedAt: Date,
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    }],
    profilePicture: { type: String },
    salary: {type: Number, default: 30000},
    employeeId: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    position: { type: String, required: true },
    experience: { type: String },
    education: [{
      level: { 
        type: String, 
        enum: ['Elementary', 'High School', 'College', 'Graduate School', 'Other'] 
      },
      schoolName: String,
      yearCompleted: String,
      course: String  
    }],
    gender: { type: String },
    nationality: { type: String },
    civilStatus: { type: String },
    role: { type: String, default: "Employee" },
    skills: { type: [String] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    onboarded: { type: Boolean, default: true },
    onboardingStatus: {
      current: {
        type: String,
        enum: ["Pending Documents", "Orientation Scheduled", "Complete"],
        default: "Pending Documents",
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    phoneNumber: { type: String },
    address: { type: String },
    emergencyContact: {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String }
    },
    archived: { type: Boolean, default: false },
    documents: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", EmployeeSchema);
