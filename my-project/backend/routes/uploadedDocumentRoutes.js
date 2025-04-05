const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const uploadedDocumentController = require("../controllers/uploadedDocumentController");

const verifyToken = (req, res, next) => {
  const bearerHeader = req.header("Authorization");
  if (!bearerHeader) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = bearerHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.GATEWAY_SERVICE_TOKEN);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
};

router.get("/request/:request_id", uploadedDocumentController.getUploadedDocumentsByRequestId);
router.get("/employee/:employee_id", uploadedDocumentController.getUploadedDocumentsByEmployeeId);
router.put("/:document_id", uploadedDocumentController.updateUploadedDocument);
router.get("/approved", uploadedDocumentController.getApprovedDocumentRequests);
router.get("/all-docs",verifyToken ,uploadedDocumentController.allDocuments);
router.get("/approved-document", uploadedDocumentController.approvedDocuments);

module.exports = router;
