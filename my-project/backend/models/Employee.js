const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  position: { type: String, required: true }, 
  experience: { type: String },
  education: { type: String },
  gender: { type: String },
  nationality: { type: String },
  civilStatus: { type: String },
  role: { type: String, default: "Employee" },
  skills: { type: [String] },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
  onboarded: { type: Boolean, default: true }, 
  archived: { type: Boolean, default: false },
  documents: [
    {
      name: { type: String, required: true }, 
      url: { type: String, required: true }, 
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Employee", EmployeeSchema);
