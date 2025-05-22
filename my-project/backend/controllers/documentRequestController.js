const DocumentRequest = require("../models/DocumentRequest");
const Employee = require("../models/Employee");
const Onboarding = require("../models/Onboarding");
const UploadedDocument = require("../models/UploadedDocument");
const { v4: uuidv4 } = require("uuid");

exports.createDocumentRequest = async (req, res) => {
  try {
    const { employeeId, document_name } = req.body;
    console.log("Received request:", { employeeId, document_name }); 

    if (!employeeId || !document_name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const request_id = `REQ-${uuidv4().split("-")[0]}`;

    const newRequest = new DocumentRequest({
      request_id,
      employeeId,  
      employeeName: employee.fullname,
      document_name,
      status: "Submitted for Approval"
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
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const requests = await DocumentRequest.find({ employeeId: employeeId }).sort({
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

    console.log(`[DEBUG] Updating status of request ${request_id} to ${status}`);

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

    const uploadedDoc = await UploadedDocument.findOneAndUpdate(
      { request_id },
      { status },
      { new: true }
    );

    console.log(`[DEBUG] Found uploadedDoc:`, uploadedDoc);

    const { employeeId, document_name } = request;

    if (status === "Approved" && uploadedDoc?.document_url) {
      const updatedEmployee = await Employee.findOneAndUpdate(
        { employeeId },
        {
          $push: {
            documents: {
              name: document_name,
              url: uploadedDoc.document_url, 
              uploadedAt: new Date(),
            },
          },
        },
        { new: true }
      );

      if (!updatedEmployee) {
        console.warn(`[WARN] Employee with ID ${employeeId} not found`);
      } else {
        console.log(`[DEBUG] Document pushed to employee ${employeeId}`, updatedEmployee.documents.slice(-1));
      }
    } else {
      console.warn(`[WARN] Document approved but no uploadedDoc or missing document_url`);
    }

    global.io.emit(`notification-${employeeId}`, {
      message: `ADMIN: Your document request for "${document_name}" has been updated to: ${status}`,
      request_id,
      dashboard: 'employee'
    });

    res.status(200).json({ message: "Request updated successfully", request });
  } catch (error) {
    console.error("[ERROR] updateRequestStatus failed:", error);
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
