const express = require("express");
const TimeTracking = require("../models/TimeTracking");
const router = express.Router();
const Schedule = require("../models/Schedule"); // Import the Schedule model
const timeTrackingController = require("../controllers/timeTrackingController");
const { formatDuration } = require("../utils/formatDuration");

// Time In
router.post("/time-in", async (req, res) => {
  try {
    const { employee_id } = req.body;

    // Get current date and time
    const now = new Date();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
    const currentHour = now.getHours();

    // Fetch employee schedule
    const schedule = await Schedule.findOne({ employee_id });

    if (!schedule) {
      return res
        .status(404)
        .json({ message: "No schedule found for this employee" });
    }

    // Check if the current day is a working day
    if (!schedule.days.includes(currentDay)) {
      return res
        .status(400)
        .json({ message: "You are not scheduled to work today" });
    }

    // Check if the current time is within the allowed time-in window (8 AM to 5 PM)
    if (currentHour < 8 || currentHour >= 17) {
      return res
        .status(400)
        .json({ message: "You can only time in between 8 AM and 5 PM" });
    }

    // Check if there's already an active session
    const activeSession = await TimeTracking.findOne({
      employee_id,
      status: "active",
    });

    if (activeSession) {
      return res.status(400).json({
        message: "You already have an active session",
      });
    }

    const newEntry = new TimeTracking({
      employee_id,
      time_in: new Date(),
      status: "active",
    });
    await newEntry.save();

    res.status(201).json({
      message: "Time In recorded successfully!",
      session: newEntry,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

    activeSession.time_out = new Date();

    // Calculate total hours
    let totalHours =
      (activeSession.time_out - activeSession.time_in) / (1000 * 60 * 60);

    // Check if time out is after 5 PM
    const timeOutHour = activeSession.time_out.getHours();
    if (timeOutHour >= 17) {
      const overtime =
        timeOutHour - 17 + activeSession.time_out.getMinutes() / 60;
      activeSession.overtime_hours = Math.max(0, overtime);
      totalHours -= 1;
      activeSession.break_duration = 3600; // 1 hour in seconds
    }

    activeSession.total_hours = totalHours;
    activeSession.status = "pending"; // Changed from 'completed' to 'pending'
    await activeSession.save();

    res.status(200).json({
      message: "Time Out recorded successfully! Waiting for approval.",
      session: activeSession,
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

router.get("/approveSessions", async (req, res) => {
  try {
    const sessions = await TimeTracking.find({ status: "approved" });

    // Format the total_hours for each session
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

// Add route for manual entry
router.post("/manual-entry", timeTrackingController.createManualEntry);

module.exports = router;
