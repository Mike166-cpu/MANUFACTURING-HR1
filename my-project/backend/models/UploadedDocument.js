// UPLOADED DOCUMENTS
const mongoose = require("mongoose");

const UploadedDocumentSchema = new mongoose.Schema({
  employeeId: { type: String, ref: "Employee", required: true},
  document_url: { type: String, required: true},
  request_id: { type: String, ref: "DocumentRequest", required: true},
  status: { type: String, 
    enum: ["Pending", "Submitted for Approval", "Approved", "Rejected"],
    default: "Pending",
  },
  uploaded_at: { type: Date, default: Date.now,}
});

module.exports = mongoose.model("UploadedDocument", UploadedDocumentSchema);
