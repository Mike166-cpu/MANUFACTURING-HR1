const mongoose = require("mongoose");

const EmployeeLoginSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Match external API _id
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed password
  role: { type: String, required: true },
  Hr: { type: Number, required: true },
  position: { type: String, required: true },
  status: { type: String, enum: ["active", "terminated"], default: "active" }
});

module.exports = mongoose.model("EmployeeLogin", EmployeeLoginSchema);
