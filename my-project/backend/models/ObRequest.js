const mongoose = require("mongoose");

const OBRequestSchema = new mongoose.Schema({
  time_tracking_id: { type: String, required: true, unique: true },
  employee_id: { type: String, required: true },
  employee_name: { type: String, required: true },
  position: { type: String},
  time_in: { type: Date, required: true },
  time_out: { type: Date, required: true },
  total_hours: { type: String, required: true }, 
  overtime_hours: { type: String, default: "0H" }, 
  purpose: { type: String, required: true },
  remarks: { type: String },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  file_url: { type: String },
  file_public_id: { type: String },
  shift_name: { type: String },
  created_at: { type: Date, default: Date.now },
  is_holiday: { type: Boolean, default: false },
  holiday_name: { type: String, default: null },
}
);

module.exports = mongoose.model("OBRequest", OBRequestSchema);
