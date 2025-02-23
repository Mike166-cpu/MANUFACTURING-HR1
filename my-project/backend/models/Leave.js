const mongoose = require("mongoose");

const LeaveSchema = new mongoose.Schema({
  leave_id: { type: String, unique: true, required: true }, // Unique Leave ID
  employee_id: { type: String, required: true },
  employee_username: { type: String, required: true },
  employee_firstname: { type: String, required: true },
  employee_lastname: { type: String, required: true },
  employee_department: { type: String, required: true },
  leave_type: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: "Pending" }, // Pending, Approved, Rejected
  remaining_leaves: { type: Number, default: 10 },
});

module.exports = mongoose.model("Leave", LeaveSchema);
