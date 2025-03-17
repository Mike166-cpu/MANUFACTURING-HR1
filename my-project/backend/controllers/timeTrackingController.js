// THIS IS THE REAL CONTROLLER IN OB FORM

const TimeTracking = require("../models/TimeTracking");
const axios = require("axios");
const { isHoliday } = require("../utils/holiday");
const RequestModel = require("../models/ObRequest");
const cloudinary = require("../config/cloudinaryConfig");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

exports.createManualEntry = async (req, res) => {
  try {
    const {
      employee_id,
      employee_firstname,
      position,
      employee_lastname,
      time_in,
      time_out,
      total_hours,
      overtime_hours,
      purpose,
      remarks,
      file_url, 
    } = req.body;

    const formattedDate = new Date(time_in).setHours(0, 0, 0, 0); // Normalize to midnight

    // Check if entry already exists for the same employee and date
    const existingRequest = await RequestModel.findOne({
      employee_id,
      time_in: {
        $gte: new Date(formattedDate), 
        $lt: new Date(formattedDate + 86400000) 
      }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a request for this date",
        duplicate: true
      });
    }

    console.log("Received file_url:", file_url); 

    const holiday = isHoliday(formattedDate);
    const is_holiday = holiday ? true : false;
    const holiday_name = holiday ? holiday.name : null;

    console.log("Detected Holiday:", is_holiday, "Holiday Name:", holiday_name);

    const newTimeEntry = new RequestModel({
      employee_id,
      position,
      employee_firstname,
      employee_lastname,
      time_in: new Date(time_in),
      time_out: new Date(time_out),
      total_hours,
      overtime_hours,
      status: "pending",
      purpose,
      remarks,
      entry_type: "Manual Entry",
      is_holiday,
      holiday_name,
      file_url, // Only use file_url
    });

    console.log("New entry before save:", newTimeEntry); // Debug log

    const savedEntry = await newTimeEntry.save();

    if (global.io) {
      console.log("🔴 Emitting event: obRequestCreated", savedEntry);
      global.io.emit("obRequestCreated", savedEntry); // ✅ Use savedEntry
    } else {
      console.warn("⚠️ WebSocket (global.io) is not initialized! Manual entry saved but not emitted.");
    }

    res.status(201).json({
      success: true,
      message: "Manual entry created successfully",
      data: savedEntry,
      is_holiday,
      holiday_name,
    });
  } catch (error) {
    console.error("Error creating manual entry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create manual entry",
      error: error.message,
    });
  }
};

exports.reviewOBRequest = async (req, res) => {
  try {
    const { requestId, status } = req.body; // Expect requestId and status (approved/rejected)

    // ✅ Validate status
    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    const obRequest = await RequestModel.findById(requestId);
    if (!obRequest) {
      return res
        .status(404)
        .json({ success: false, message: "OB Request not found" });
    }

    if (status === "approved") {
      // ✅ Move to TimeTracking Model
      const newTimeEntry = new TimeTracking({
        employee_id: obRequest.employee_id,
        employee_firstname: obRequest.employee_firstname,
        employee_lastname: obRequest.employee_lastname,
        position: obRequest.position,
        time_in: obRequest.time_in,
        time_out: obRequest.time_out,
        total_hours: obRequest.total_hours,
        overtime_hours: obRequest.overtime_hours,
        purpose: obRequest.purpose,
        remarks: "OB Approved",
        status: "pending",
        entry_type: "Manual Entry",
      });

      await newTimeEntry.save(); // Save to TimeTracking
    }

    // ✅ Update OBRequest status
    obRequest.status = status;
    const updatedOBRequest = await obRequest.save();

    // Emit WebSocket event for real-time updates
    if (global.io) {
      global.io.emit("obRequestUpdated", updatedOBRequest);
    }

    res.status(200).json({
      success: true,
      message: `OB Request has been ${status}`,
      data: updatedOBRequest, // Send updated OB Request
    });
  } catch (error) {
    console.error("Error reviewing OB request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to review OB request",
      error: error.message,
    });
  }
};


// GET ALL REQUEST
exports.getOBRequests = async (req, res) => {
  try {
    const obRequests = await RequestModel.find({}).sort({ createdAt: -1 });
    res.json(obRequests);
  } catch (error) {
    console.error("Error fetching OB requests:", error);
    res.status(500).json({ error: "Failed to fetch OB requests" });
  }
};

// DELETE REQUEST
exports.deleteOBRequest = async (req, res) => {
  try {
    const { requestId } = req.params; // Get request ID from URL params

    // Check if the request exists
    const obRequest = await RequestModel.findById(requestId);
    if (!obRequest) {
      return res.status(404).json({ success: false, message: "OB Request not found" });
    }

    // Delete the request
    await RequestModel.findByIdAndDelete(requestId);

    // Emit WebSocket event for real-time updates
    if (global.io) {
      console.log("Emitting event: obRequestDeleted", requestId);
      global.io.emit("obRequestDeleted", requestId);
    }

    res.status(200).json({
      success: true,
      message: "OB Request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting OB request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete OB request",
      error: error.message,
    });
  }
};


exports.checkDuplicateEntry = async (req, res) => {
  try {
    const { employee_id, date } = req.query;

    const formattedDate = new Date(date).setHours(0, 0, 0, 0); // Normalize to midnight

    const existingRequest = await RequestModel.findOne({
      employee_id,
      time_in: {
        $gte: new Date(formattedDate),
        $lt: new Date(formattedDate + 86400000),
      },
    });

    res.json({ duplicate: !!existingRequest });
  } catch (error) {
    console.error("Error checking duplicate entry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check for duplicate entry",
      error: error.message,
    });
  }
};

