const UploadedDocument = require("../models/UploadedDocument");
const DocumentRequest = require("../models/DocumentRequest");



exports.uploadDocument = async (req, res) => {
  try {
    const { employeeId, document_url, request_id } = req.body;

    if (!employeeId || !document_url || !request_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newDocument = new UploadedDocument({
      employeeId,
      document_url,
      request_id,
    });

    await newDocument.save();

    const request = await DocumentRequest.findOneAndUpdate(
      { request_id, employeeId },
      { status: "Submitted for Approval" },
      { new: true }
    );

    if (!request) {
      return res
        .status(404)
        .json({ message: "Document request not found or already processed" });
    }

    // Emit Notification to the Specific Employee
    global.io.emit(`notification-admin`, {
      message: `Employee ${employeeId} submitted a document for approval.`,
      employeeId,
      request_id,
      dashboard: "admin",
    });

    res
      .status(201)
      .json({
        message: "Document uploaded and request updated",
        request_id: request.request_id,
      });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUploadedDocumentsByRequestId = async (req, res) => {
  try {
    const { request_id } = req.params;
    const documents = await UploadedDocument.find({ request_id });

    if (!documents) {
      return res
        .status(404)
        .json({ message: "No documents found for this request" });
    }

    const request = await DocumentRequest.findOne({ request_id });
    if (!request) {
      return res.status(404).json({ message: "Document request not found" });
    }

    res.status(200).json({ documents, status: request.status });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUploadedDocumentsByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const documents = await UploadedDocument.find({ employeeId });

    if (!documents) {
      return res
        .status(404)
        .json({ message: "No documents found for this employee" });
    }

    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateUploadedDocument = async (req, res) => {
  try {
    const { document_id } = req.params;
    const { document_url } = req.body;

    if (!document_url) {
      return res.status(400).json({ message: "Document URL is required" });
    }

    const updatedDocument = await UploadedDocument.findByIdAndUpdate(
      document_id,
      { document_url },
      { new: true }
    );

    if (!updatedDocument) {
      return res.status(404).json({ message: "Document not found" });
    }

    global.io.emit(`notification-admin`, {
      message: `Document for request ${updatedDocument.request_id} has been updated.`,
      employeeId: updatedDocument.employeeId,
      request_id: updatedDocument.request_id,
      dashboard: "admin",
    });

    res
      .status(200)
      .json({ message: "Document updated successfully", updatedDocument });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getApprovedDocumentRequests = async (req, res) => {
  try {
    const approvedRequests = await DocumentRequest.find({
      status: "Approved",
    }).sort({ requested_at: -1 });

    res.status(200).json(approvedRequests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.approvedDocuments = async (req, res) => {
  try {
    const document = await UploadedDocument.find ({
      status: "Approved"
    }).sort ({requested_at: -1});

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



exports.allDocuments = async (req, res) => {
  try {
    const documents = await UploadedDocument.find({});
    
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
