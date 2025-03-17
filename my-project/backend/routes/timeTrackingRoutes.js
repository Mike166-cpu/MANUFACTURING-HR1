const express = require("express");
const TimeTracking = require("../models/TimeTracking");
const router = express.Router();
const Schedule = require("../models/Schedule"); 
const timeTrackingController = require("../controllers/timeTrackingController");
const { generateServiceToken } = require("../middleware/gatewayTokenGenerator");
const { formatDuration } = require("../utils/formatDuration");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { isHoliday } = require("../utils/holiday");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");
const {deleteOBRequest} = require("../controllers/timeTrackingController");

// Time In
router.post("/time-in", async (req, res) => {
  try {
    const {
      employee_id,
      employee_firstname,
      employee_lastname,
      position,
    } = req.body;
    

    if (!employee_id) {
      return res.status(400).json({
        message:
          "Missing required fields: employee_id is required",
      });
    }
    const now = new Date();

    const localTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const currentHour = localTime.getHours();
    const currentMinute = localTime.getMinutes();
    const currentDay = localTime.toLocaleDateString("en-US", { weekday: "long" });


    const formattedDate = localTime.toISOString().split('T')[0];

    const existingEntry = await TimeTracking.findOne({
      employee_id,
      time_in: {
        $gte: new Date(`${formattedDate}T00:00:00.000Z`), // Start of the day
        $lt: new Date(`${formattedDate}T23:59:59.999Z`),  // End of the day
      },
    });

    if (existingEntry) {
      return res.status(400).json({
        message: "You already recorded a time in for today.",
      });
    }

    const holiday = isHoliday(formattedDate);
    const is_holiday = holiday ? true : false;
    const holiday_name = holiday ? holiday.name : null;

    if (is_holiday) {
      return res.status(400).json({
        message: `Today is ${holiday_name}. Time-in is not allowed on holidays.`,
        holiday_name,
      });
    }

    if (currentHour < 8 || (currentHour === 17 && currentMinute > 0) || currentHour > 17) {
      return res.status(400).json({
        message: "Time-in is only allowed between 8:00 AM and 5:00 PM",
        currentTime: `${currentHour}:${currentMinute.toString().padStart(2, '0')}`
      });
    }

    // Fetch employee schedule
    const schedule = await Schedule.findOne({ employeeId: employee_id });

    // Debug schedule
    console.log("Schedule found:", schedule);
    console.log("Current day:", currentDay);

    if (!schedule) {
      return res.status(404).json({ 
        message: "No schedule found for this employee. Please contact your administrator." 
      });
    }

    // Debug working days
    console.log("Working days:", schedule.days);
    console.log("Is working day:", schedule.days.includes(currentDay));

    // Check if the current day is a working day
    if (!schedule.days.includes(currentDay)) {
      return res.status(400).json({ 
        message: `You are not scheduled to work on ${currentDay}` 
      });
    }

    // Check for existing active session
    const activeSession = await TimeTracking.findOne({
      employee_id,
      status: "active",
    });

    if (activeSession) {
      return res.status(400).json({
        message: "You already have an active session",
      });
    }

    // Calculate minutes past 8:15 AM for late status
    const scheduleStart = new Date(localTime);
    scheduleStart.setHours(8, 15, 0, 0); // 8:15 AM cutoff

    const isLate = localTime > scheduleStart;
    const minutesLate = isLate ? Math.floor((localTime - scheduleStart) / 60000) : 0;

    // Create new entry with timezone-aware calculations
    const newEntry = new TimeTracking({
      employee_id,
      employee_firstname,
      employee_lastname,
      position,
      time_in: localTime,
      status: "active",
      entry_type: "System Entry",
      entry_status: isLate ? "late" : "on_time",
      minutes_late: minutesLate,
      schedule_start: "08:00",
      schedule_end: "17:00",
      is_holiday,
      holiday_name,
      timezone: "Asia/Manila" 
    });

    await newEntry.save();

    function formatMinutesLate(minutes) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours > 0 
        ? `${hours} hour(s) ${mins} minute(s)`
        : `${mins} minute(s)`;
    }

    res.status(201).json({
      message: isLate 
        ? `Time In recorded successfully! Note: You are late by ${formatMinutesLate(minutesLate)}`
        : "Time In recorded successfully!",
      session: newEntry,
      serverTime: localTime.toLocaleString('en-US', { timeZone: 'Asia/Manila' })
    });

  } catch (error) {
    console.error("Time-in error:", error);
    res.status(500).json({
      message: "Failed to record time in",
      error: error.message,
    });
  }
});

// Time Out - Modified to set status as pending
router.put("/time-out", async (req, res) => {
  try {
    const { employee_id } = req.body;

    const activeSession = await TimeTracking.findOne({
      employee_id,
      status: "active",
    });

    if (!activeSession) {
      return res.status(404).json({
        message: "No active session found",
      });
    }

    const timeOut = new Date();
    activeSession.time_out = timeOut;

    // Calculate total duration in hours
    const totalDurationHours =
      (timeOut - activeSession.time_in) / (1000 * 60 * 60);

    // Calculate overtime (hours worked after 5 PM)
    let overtimeHours = 0;
    let regularHours = totalDurationHours;

    // Create 5 PM datetime for comparison
    const fivePM = new Date(timeOut);
    fivePM.setHours(17, 0, 0, 0);

    // If time out is after 5 PM
    if (timeOut > fivePM) {
      // Calculate overtime only for the portion after 5 PM
      overtimeHours = (timeOut - fivePM) / (1000 * 60 * 60);

      // Adjust regular hours by subtracting overtime
      regularHours = (fivePM - activeSession.time_in) / (1000 * 60 * 60);

      console.log("Debug - Overtime calculation:", {
        timeOut: timeOut.toLocaleTimeString(),
        fivePM: fivePM.toLocaleTimeString(),
        overtimeHours,
        regularHours,
      });
    }

    // Only deduct break hour if total duration is more than 5 hours
    if (totalDurationHours > 5) {
      regularHours = Math.max(0, regularHours - 1); // Deduct 1 hour break
      activeSession.break_duration = 3600; // 1 hour in seconds
    } else {
      activeSession.break_duration = 0;
    }

    // Update session with calculated hours (rounded to 2 decimal places)
    activeSession.total_hours = Math.round(regularHours * 100) / 100;
    activeSession.overtime_hours = Math.round(overtimeHours * 100) / 100;
    activeSession.status = "pending";

    await activeSession.save();

    res.status(200).json({
      message: "Time Out recorded successfully! Waiting for approval.",
      session: activeSession,
      regularHours: activeSession.total_hours,
      overtimeHours: activeSession.overtime_hours,
      breakDuration: activeSession.break_duration ? "1 hour" : "No break",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Active Session
router.get("/active-session/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;
    const activeSession = await TimeTracking.findOne({
      employee_id,
      status: "active",
    });

    res.status(200).json(activeSession);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Time Tracking History for specific employee
router.get("/history/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;
    const history = await TimeTracking.find({ employee_id })
      .sort({ time_in: -1 }) // Sort by most recent first
      .limit(10); // Limit to last 10 entries

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New route for approving sessions
router.put("/approve/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { remarks } = req.body;

    const session = await TimeTracking.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Session is not pending approval" });
    }

    session.status = "approved";
    session.remarks = remarks;
    session.approved_at = new Date();
    await session.save();

    res.status(200).json({
      message: "Session approved successfully",
      session,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin route to get all time tracking sessions
router.get("/admin/all-sessions", async (req, res) => {
  try {
    const sessions = await TimeTracking.find().sort({ time_in: -1 });
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin route to approve/reject session
router.put("/admin/update-status/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status, remarks } = req.body;

    const session = await TimeTracking.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Update session status and remarks
    const updatedSession = await TimeTracking.findByIdAndUpdate(
      sessionId,
      {
        status,
        remarks,
        approved_at: new Date(),
      },
      { new: true }
    );

    res.status(200).json({
      message: `Session ${status} successfully`,
      session: updatedSession,
    });
  } catch (error) {
    console.error("Error updating session status:", error);
    res.status(500).json({ error: error.message });
  }
});

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
    res.status(401).json({ message: "Invalid token" });
  }
};

router.get("/approveSessions", verifyToken, async (req, res) => {
  try {
    const sessions = await TimeTracking.find({ status: "approved" });

    const formattedSessions = sessions.map((session) => ({
      ...session._doc,
      total_hours: formatDuration(session.total_hours),
      overtime_hours: formatDuration(session.overtime_hours),
    }));

    res.status(200).json(formattedSessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/check-timein", async (req, res) => {
    try {
      const { employee_id, date } = req.query;
  
      const formattedDate = new Date(date).setHours(0, 0, 0, 0); // Normalize to midnight
  
      const existingRequest = await TimeTracking.findOne({
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
  });


// MANUAL ENTRY ROUTES

router.post("/manual-entry", timeTrackingController.createManualEntry);

router.get("/get-request", timeTrackingController.getOBRequests);

router.post("/request-review", timeTrackingController.reviewOBRequest);

router.get("/check-duplicate", timeTrackingController.checkDuplicateEntry);

router.delete("/ob-request/:requestId", authenticateUser, authorizeRoles("admin", "superadmin"), deleteOBRequest);


module.exports = router;
