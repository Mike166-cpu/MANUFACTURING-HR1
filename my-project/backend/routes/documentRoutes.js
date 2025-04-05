const express = require("express");
const router = express.Router();
const documentRequestController = require("../controllers/documentRequestController");
const uploadedDocumentController = require("../controllers/uploadedDocumentController");

// Routes
router.post("/", documentRequestController.createDocumentRequest); // Create a request
router.get("/", documentRequestController.getAllDocumentRequests); // Get all requests
router.get("/:employeeId", documentRequestController.getEmployeeDocumentRequests); // Get requests for an employee
router.put("/:request_id", documentRequestController.updateRequestStatus); // Update request status
router.delete("/:request_id", documentRequestController.deleteDocumentRequest); // Delete request
router.post("/uploaded-documents", uploadedDocumentController.uploadDocument); // Changed from /uploaded-documents to match frontend

module.exports = router;
