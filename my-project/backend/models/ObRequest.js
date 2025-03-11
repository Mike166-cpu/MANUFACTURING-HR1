const mongoose = require("mongoose");

const OBRequestSchema = new mongoose.Schema({
  employee_id: { type: String, required: true },
  employee_firstname: { type: String, required: true },
  employee_lastname: { type: String, required: true },
  position: { type: String, required: true },
  time_in: { type: Date, required: true },
  time_out: { type: Date, required: true },
  total_hours: { type: Number, required: true },
  overtime_hours: { type: Number, default: 0 },
  purpose: { type: String, required: true },
  remarks: { type: String },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("OBRequest", OBRequestSchema);
