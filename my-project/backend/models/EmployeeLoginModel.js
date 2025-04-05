const mongoose = require("mongoose");

const EmployeeLoginSchema = new mongoose.Schema({
  _id: { type: String, required: true }, 
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, 
  role: { type: String, required: true },
  Hr: { type: Number, required: true },
  position: { type: String, required: true },
  status: { type: String, enum: ["active", "terminated"], default: "active" },
  profilePicture: { type: String, default: "" }
});

module.exports = mongoose.model("EmployeeLogin", EmployeeLoginSchema);
