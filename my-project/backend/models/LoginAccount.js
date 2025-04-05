const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, 
    role: { type: String, default: "Employee" },
    employeeId: { type: String, required: true}, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmployeeLoginAccount", UserSchema);
