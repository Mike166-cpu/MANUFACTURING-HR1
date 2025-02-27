const express = require("express");
const router = express.Router();
const uploadedDocumentController = require("../controllers/uploadedDocumentController");

// ...existing code...

router.get("/request/:request_id", uploadedDocumentController.getUploadedDocumentsByRequestId);
router.get("/employee/:employee_id", uploadedDocumentController.getUploadedDocumentsByEmployeeId);
router.put("/:document_id", uploadedDocumentController.updateUploadedDocument);
router.get("/approved", uploadedDocumentController.getApprovedDocumentRequests);


module.exports = router;
