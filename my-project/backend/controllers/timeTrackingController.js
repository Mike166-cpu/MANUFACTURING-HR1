// THIS IS THE REAL CONTROLLER IN OB FORM

const TimeTracking = require("../models/TimeTracking");
const axios = require("axios");
const { isHoliday } = require("../utils/holiday");
const RequestModel = require("../models/ObRequest");
const cloudinary = require("../config/cloudinaryConfig");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const Schedule = require("../models/Schedule");


exports.createManualEntry = async (req, res) => {
  try {
    const {
      employee_id,
      position,
      employee_name,
      time_in,
      time_out,
      purpose,
      remarks,
      file_url,
      shift_name,
      overtime_start,
      overtime_end,
    } = req.body;

    // Initialize 'now' here
    const now = new Date(); // Add this line to define 'now'

    console.log("🔍 Incoming Manual Entry Request:", {
      employee_id,
      employee_name,
      position,
      time_in,
      time_out,
      purpose,
      remarks,
      file_url,
    });

    const dateObj = new Date(time_in);
    const formattedDate = dateObj.toISOString().split("T")[0]; // "YYYY-MM-DD"
    const dayOfWeek = dateObj.toLocaleString("en-US", { weekday: "long" });

    const dateStart = new Date(formattedDate); // 00:00:00 of the date
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1); // Next day 00:00:00

    console.log("🗓️ Formatted Date:", dateStart);
    console.log("📆 Day of Week:", dayOfWeek);

    const schedule = await Schedule.findOne({ employeeId: employee_id });

    console.log("📋 Schedule Found:", schedule);

    if (!schedule) {
      console.warn("⚠️ No schedule found for employee:", employee_id);
      return res.status(200).json({
        success: false,
        warning: true,
        message:
          "You have no working schedule for awhile. Please kindly wait for HR to set your schedule. Thank you.",
      });
    }

    if (!schedule.days.includes(dayOfWeek)) {
      console.warn("🚫 Day not in employee's schedule:", {
        employee_id,
        allowedDays: schedule.days,
        attemptedDay: dayOfWeek,
      });

      return res.status(200).json({
        success: false,
        warning: true,
        message: `You cannot submit a time-in entry on ${dayOfWeek} as you are not scheduled.`,
      });
    }

    const existingRequest = await RequestModel.findOne({
      employee_id,
      time_in: { $gte: dateStart, $lt: dateEnd },
    });

    console.log("🔍 Checking for existing request on the same date:", !!existingRequest);

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a request for this date",
        duplicate: true,
      });
    }

    console.log("🖼️ Received file_url:", file_url);

    const holiday = isHoliday(formattedDate);
    const is_holiday = !!holiday;
    const holiday_name = holiday ? holiday.name : null;

    console.log("🎉 Holiday Check:", {
      is_holiday,
      holiday_name,
    });

    const timeInDate = new Date(time_in);
    let timeOutDate = new Date(time_out);

    // Handle night shift
    let timeDiffMs = timeOutDate - timeInDate;
    if (timeDiffMs < 0) {
      timeOutDate.setDate(timeOutDate.getDate() + 1);
      timeDiffMs = timeOutDate - timeInDate;
    }

    const rawHours = timeDiffMs / (1000 * 60 * 60);
    const hours = Math.floor(rawHours - 1); // Deduct 1 hour break
    const minutes = Math.floor((rawHours - 1 - hours) * 60);
    const formattedHours = `${hours}H ${minutes.toString().padStart(2, "0")}M`;

    console.log("📊 Time Calculation:", {
      timeIn: timeInDate,
      timeOut: timeOutDate,
      rawHours,
      adjustedHours: hours,
      minutes,
      finalFormat: formattedHours,
    });

    const absentEntry = await TimeTracking.findOneAndUpdate(
      {
        employee_id,
        time_in: { $gte: dateStart, $lt: dateEnd },
        entry_status: "absent",
      },
      { $set: { entry_status: "on_time" } },
      { new: true }
    );

    if (absentEntry) {
      console.log("🗑️ Removed absent entry and updated to present for:", employee_id);
    }

    // Calculate overtime if present
    let overtimeString = "0H 00M";
    if (overtime_start && overtime_end) {
      const overtimeInDate = new Date(`${formattedDate}T${overtime_start}`);
      let overtimeOutDate = new Date(`${formattedDate}T${overtime_end}`);

      let overtimeDiffMs = overtimeOutDate - overtimeInDate;
      if (overtimeDiffMs < 0) {
        overtimeOutDate.setDate(overtimeOutDate.getDate() + 1);
        overtimeDiffMs = overtimeOutDate - overtimeInDate;
      }

      const overtimeHours = Math.floor(overtimeDiffMs / (1000 * 60 * 60));
      const overtimeMinutes = Math.floor(
        (overtimeDiffMs % (1000 * 60 * 60)) / (1000 * 60)
      );
      overtimeString = `${overtimeHours}H ${overtimeMinutes.toString().padStart(2, "0")}M`;
    }

    const monthYear = `${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getFullYear()}`;

    const randomLetters = Math.random().toString(36).substring(2, 8).toUpperCase();

    const customTimeTrackingID = `TRID-${monthYear}-${randomLetters}`;

    const newTimeEntry = new RequestModel({
      time_tracking_id: customTimeTrackingID,
      employee_id,
      position,
      employee_name,
      time_in: timeInDate,
      time_out: timeOutDate,
      total_hours: formattedHours,
      overtime_hours: overtimeString,
      status: "pending",
      purpose,
      remarks,
      entry_type: "Manual Entry",
      is_holiday,
      holiday_name,
      file_url,
      shift_name,
    });

    console.log("📝 New Entry to be saved:", newTimeEntry);

    const savedEntry = await newTimeEntry.save();

    console.log("✅ Saved Entry:", savedEntry);

    if (global.io) {
      console.log("📡 Emitting WebSocket event: obRequestCreated", savedEntry);
      global.io.emit("obRequestCreated", savedEntry);
    } else {
      console.warn("⚠️ WebSocket (global.io) not initialized! Manual entry saved but not emitted.");
    }

    res.status(201).json({
      success: true,
      message: "Manual entry created successfully",
      data: savedEntry,
      is_holiday,
      holiday_name,
    });
  } catch (error) {
    console.error("❌ Error creating manual entry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create manual entry",
      error: error.message,
    });
  }
};



exports.reviewOBRequest = async (req, res) => {
  try {
    const { requestId, status } = req.body;

    console.log("🔍 Incoming OB Review Request:", { requestId, status });

    // ✅ Validate status
    if (!["approved", "rejected"].includes(status)) {
      console.warn("⚠️ Invalid status value received:", status);
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    const obRequest = await RequestModel.findById(requestId);

    console.log("📄 OB Request found:", obRequest);

    if (!obRequest) {
      console.warn("🚫 OB Request not found for ID:", requestId);
      return res
        .status(404)
        .json({ success: false, message: "OB Request not found" });
    }

    // Use the same time_tracking_id from the OB Request
    const time_tracking_id = obRequest.time_tracking_id;

    if (status === "approved") {
      console.log("✅ Approving OB Request and creating TimeTracking record...");

      // Get hours from request
      const totalHours = obRequest.total_hours || "0H";
      const overtimeHours = obRequest.overtime_hours || "0H";

      const newTimeEntry = new TimeTracking({
        time_tracking_id, // Use the same time_tracking_id from OB request
        employee_id: obRequest.employee_id,
        shift_name: obRequest.shift_name,
        employee_fullname: obRequest.employee_name,
        position: obRequest.position,
        time_in: obRequest.time_in,
        time_out: obRequest.time_out,
        total_hours: totalHours,     
        overtime_hours: overtimeHours, 
        purpose: obRequest.purpose,
        remarks: "OB Approved",
        status: "pending",
        entry_type: "Manual Entry",
        is_holiday: obRequest.is_holiday || false,
        holiday_name: obRequest.holiday_name || null,
      });

      console.log("📝 New TimeTracking Entry (before save):", newTimeEntry);

      await newTimeEntry.save();
      console.log("💾 TimeTracking entry saved successfully.");
    }

    obRequest.status = status;
    const updatedOBRequest = await obRequest.save();

    console.log("🔄 OB Request updated with new status:", updatedOBRequest);

    // Emit WebSocket event for real-time updates
    if (global.io) {
      console.log("📡 Emitting WebSocket event: obRequestUpdated", updatedOBRequest);
      global.io.emit("obRequestUpdated", updatedOBRequest);
    } else {
      console.warn("⚠️ WebSocket (global.io) not initialized. Event not emitted.");
    }

    res.status(200).json({
      success: true,
      message: `OB Request has been ${status}`,
      data: updatedOBRequest,
    });
  } catch (error) {
    console.error("❌ Error reviewing OB request:", error);
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
      return res
        .status(404)
        .json({ success: false, message: "OB Request not found" });
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
