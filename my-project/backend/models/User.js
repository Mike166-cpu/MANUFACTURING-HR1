//ADMIN who going to send reques

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["employee", "admin", "superadmin"],
    default: "employee",
  },
  position: { type: String, required: true }, 
  otp: String,
  otpExpires: Date,
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
});
const User = mongoose.model("User", UserSchema);

module.exports = User;
