const TotalTime = require("../models/TimeTracking");

// Create new OB request
exports.createOBRequest = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.headers.authorization) {
      return res
        .status(401)
        .json({ message: "No authorization token provided" });
    }

    const {
      employee_username,
      employee_id,
      time_in,
      time_out,
      date,
      purpose,
      remarks,
      entry_type,
      work_duration, 
      overtime_duration, 
    } = req.body;

    // Validate required fields
    if (!employee_username || !employee_id || !time_in || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newOBRequest = new TotalTime({
      employee_username,
      employee_id,
      time_in,
      time_out,
      date,
      label: "OB",
      status: "pending",
      remarks,
      purpose,
      break_duration: 0,
      entry_type: entry_type || "Manual Entry", 
      session_id: `OB-${employee_id}-${Date.now()}`,
      overtime_duration,
      work_duration,
    });

    const savedRequest = await newOBRequest.save();

    if (global.io) {
      console.log("🔴 Emitting event: obRequestCreated", savedRequest);
      global.io.emit("obRequestCreated", savedRequest);
    } else {
      console.warn(
        "⚠️ WebSocket (global.io) is not initialized! OB request saved but not emitted."
      );
    }

    res.status(201).json({
      message: "OB request created successfully",
      data: savedRequest,
    });
  } catch (error) {
    console.error("Error creating OB request:", error);
    res.status(500).json({ error: "Failed to create OB request" });
  }
};

// Get all OB requests
exports.getAllOBRequests = async (req, res) => {
  try {
    const obRequests = await TotalTime.find({ label: "OB" });
    res.status(200).json(obRequests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch OB requests" });
  }
};

// Get OB requests by employee
exports.getEmployeeOBRequests = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const obRequests = await TotalTime.find({
      employee_id,
      label: "OB",
    });
    res.status(200).json(obRequests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employee's OB requests" });
  }
};

// Update OB request status
exports.updateOBRequestStatus = async (req, res) => {
  try {
    const { requestId, status } = req.body;

    const updatedRequest = await TotalTime.findOneAndUpdate(
      { _id: requestId, label: "OB" },
      { status },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: "OB request not found" });
    }

    // Emit with specific event name for OB status updates
    global.io.emit("obRequestUpdated", updatedRequest);

    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(500).json({ error: "Failed to update OB request status" });
  }
};

//GET ALL MANUALY ENTRIES FOR SPECIFIC EMPLOYEE
exports.getManualEntries = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const manualEntries = await TotalTime.find({
      employee_id,
      entry_type: "Manual Entry",
    });

    global.io.emit("obRequestCreated", savedRequest);

    res.status(200).json(manualEntries);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch manual entries" });
  }
};
