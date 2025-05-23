const mongoose = require("mongoose");

const LeaveSchema = new mongoose.Schema({
  leave_id: { type: String, unique: true, required: true }, 
  employeeId: { type: String, required: true },
  employee_name: { type: String },
  employee_department: { type: String},
  leave_type: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: "Pending" }, 
  remaining_leaves: { type: Number, default: 10 },
  days_requested: { type: Number, required: true },
  paid_days:           { type: Number, default: 0 },
  unpaid_days:         { type: Number, default: 0 },
  payment_status: { type: String, enum: ["Paid", "Partially Paid", "Unpaid"], default: "Unpaid" },

});

module.exports = mongoose.model("Leave", LeaveSchema);
