// DOCUMENT REQUEST

const mongoose = require("mongoose");

const DocumentRequestSchema = new mongoose.Schema({
  request_id: {
    type: String,
    unique: true,
    required: true,
  },
  employeeId: {
    type: String,
    ref: "Employee", 
    required: true,
  },
  employeeName: { // Add this new field
    type: String,
    required: true,
  },
  document_name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Submitted for Approval", "Approved", "Rejected"],
    default: "Pending",
  },
  requested_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("DocumentRequest", DocumentRequestSchema);
