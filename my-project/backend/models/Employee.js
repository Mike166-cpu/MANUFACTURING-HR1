const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const employeeSchema = new mongoose.Schema({
  employee_id: { type: String, unique: true },
  employee_firstname: { type: String, required: true },
  employee_middlename: { type: String },
  employee_lastname: { type: String, required: true },
  employee_suffix: { type: String },
  employee_username: { type: String, required: true, unique: true },
  employee_email: { type: String, required: true, unique: true },
  employee_password: { type: String, required: true },
  employee_phone: { type: String, required: false },
  employee_address: { type: String, required: false },
  employee_dateOfBirth: { type: Date, required: false },
  employee_gender: { type: String, required: false },
  employee_department: { type: String, required: true },
  profile_picture: { type: String, default: "" },
  lastLogin: { type: Date },
  lastActive: { type: Date },
  
});

employeeSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const lastEmployee = await this.constructor.findOne().sort({ employee_id: -1 });
      
      const newId = lastEmployee ? parseInt(lastEmployee.employee_id.slice(1)) + 1 : 1;
      this.employee_id = `E${newId.toString().padStart(3, "0")}`;
    } catch (err) {
      return next(err);
    }
  }

  if (this.isModified("employee_password")) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.employee_password = await bcrypt.hash(this.employee_password, salt);
    } catch (err) {
      return next(err);
    }
  }

  next();
});

module.exports = mongoose.model("Employee", employeeSchema, "employee");
