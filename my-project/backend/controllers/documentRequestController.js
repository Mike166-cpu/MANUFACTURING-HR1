const DocumentRequest = require("../models/DocumentRequest");
const Employee = require("../models/EmployeeLoginModel");
const UploadedDocument = require("../models/UploadedDocument");
const { v4: uuidv4 } = require("uuid");

exports.createDocumentRequest = async (req, res) => {
  try {
    const { employee_id, document_name } = req.body;
    console.log("Received request:", { employee_id, document_name }); // Debug log

    if (!employee_id || !document_name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const employee = await Employee.findOne({ _id: employee_id });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const request_id = `REQ-DOC${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newRequest = new DocumentRequest({
      request_id,
      employee_id: employee._id, // Using employee._id directly
      document_name,
      status: "Pending"  // Changed initial status to Pending
    });

    await newRequest.save();
    console.log("Created request:", newRequest); // Debug log

    res.status(201).json({ message: "Document request submitted", newRequest });
  } catch (error) {
    console.error("Create request error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllDocumentRequests = async (req, res) => {
  try {
    const requests = await DocumentRequest.find().sort({ requested_at: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// GET DOCUMENT REQUEST BY EMPLOYEE ID
exports.getEmployeeDocumentRequests = async (req, res) => {
  try {
    const { employee_id } = req.params;

    if (!employee_id) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const requests = await DocumentRequest.find({ employee_id: employee_id }).sort({
      requested_at: -1,
    });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    const { request_id } = req.params;
    const { status } = req.body;

    if (
      !["Pending", "Submitted for Approval", "Approved", "Rejected"].includes(
        status
      )
    ) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Update the DocumentRequest status
    const request = await DocumentRequest.findOneAndUpdate(
      { request_id },
      { status },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Also update the status in UploadedDocument
    await UploadedDocument.findOneAndUpdate(
      { request_id },
      { status },
      { new: true }
    );

    const { employee_id, document_name } = request;

    // Send notification
    global.io.emit(`notification-${employee_id}`, {
      message: `ADMIN: Your document request for "${document_name}" has been updated to: ${status}`,
      request_id,
      dashboard: 'employee'
    });

    res.status(200).json({ message: "Request updated successfully", request });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteDocumentRequest = async (req, res) => {
  try {
    const { request_id } = req.params;

    const request = await DocumentRequest.findOneAndDelete({ request_id });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Also delete the associated uploaded document if it exists
    await UploadedDocument.findOneAndDelete({ request_id });

    res.status(200).json({ message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
