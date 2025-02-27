const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  employee_id: { type: String, unique: true },
  employee_firstname: { type: String, required: true },
  employee_middlename: { type: String },
  employee_lastname: { type: String, required: true },
  employee_suffix: { type: String },
  employee_username: { type: String, required: true, unique: true },
  employee_email: { type: String, required: true, unique: true },
  employee_password: { type: String, required: true }, // Password is now handled in routes
  employee_phone: { type: String, required: false },
  employee_address: { type: String, required: false },
  employee_dateOfBirth: { type: Date, required: false },
  employee_gender: { type: String, required: false },
  employee_department: { type: String, required: true },
  profile_picture: { type: String, default: "" },
  lastLogin: { type: Date },
  lastActive: { type: Date },
});

module.exports = mongoose.model("Employee", employeeSchema, "employee");
