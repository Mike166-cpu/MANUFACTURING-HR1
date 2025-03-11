const mongoose = require("mongoose");
const ResignationSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  employeeId: { type: String, required: true },
  department: { type: String, required: true },
  lastWorkingDay: { type: Date, required: true },
  reason: { type: String, required: true },
  message: { type: String, default: "" },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Resignation", ResignationSchema);
