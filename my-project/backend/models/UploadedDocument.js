// UPLOADED DOCUMENTS
const mongoose = require("mongoose");

const UploadedDocumentSchema = new mongoose.Schema({
  employee_id: {
    type: String,
    ref: "Employee",
    required: true,
  },
  document_url: {
    type: String,
    required: true,
  },
  request_id: {
    type: String,
    ref: "DocumentRequest",
    required: true,
  },
  uploaded_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UploadedDocument", UploadedDocumentSchema);
