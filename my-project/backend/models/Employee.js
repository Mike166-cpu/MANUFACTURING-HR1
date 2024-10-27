const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  employee_firstname: { type: String, required: true },
  employee_middlename: { type: String },
  employee_lastname: { type: String, required: true },
  employee_suffix: { type: String },
  employee_username: { type: String, required: true, unique: true },
  employee_email: { type: String, required: true, unique: true },
  employee_password: { type: String, required: true },
  employee_phone: { type: String, required: true },
  employee_address: { type: String, required: true },
  employee_dateOfBirth: { type: Date, required: true },
  employee_gender: { type: String, required: true },
  employee_department: { type: String, required: true },
  time_in: { type: Date },
  time_out: { type: Date },
  total_hours: { type: Number },
});

module.exports = mongoose.model("Employee", employeeSchema, "employee");

