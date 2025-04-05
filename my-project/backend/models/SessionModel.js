const mongoose = require("mongoose");

const EmployeeSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, unique: true }, 
  activeToken: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("EmployeeSession", EmployeeSessionSchema);
