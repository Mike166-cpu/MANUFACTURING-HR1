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
const { authenticateUser, authorizeRoles} = require("../middleware/authMiddleware");
const { deleteOBRequest } = require("../controllers/timeTrackingController");
const OBRequest = require("../models/ObRequest");
const Leave = require("../models/Leave");
const cron = require("node-cron");
const Employee = require("../models/Employee")
const { v4: uuidv4 } = require('uuid');

router.get("/check-time-in", async (req, res) => {
  try {
    const { employee_id } = req.query;

    if (!employee_id) {
      return res.status(400).json({ message: "Missing employee ID." });
    }

    const now = new Date();
    const formattedDate = now.toISOString().split("T")[0];

    const hasTimeIn = await TimeTracking.findOne({
      employee_id,
      time_in: {
        $gte: new Date(`${formattedDate}T00:00:00.000Z`),
        $lt: new Date(`${formattedDate}T23:59:59.999Z`),
      },
    });

    const hasManualEntry = await OBRequest.findOne({
      employee_id,
      time_in: {
        $gte: new Date(`${formattedDate}T00:00:00.000Z`),
        $lt: new Date(`${formattedDate}T23:59:59.999Z`),
      },
      status: { $in: ["approved", "pending"] },
    });

    res.json({ hasTimeIn: !!hasTimeIn, hasManualEntry: !!hasManualEntry });
  } catch (error) {
    console.error("Check Time-In error:", error);
    res.status(500).json({ message: "Failed to check time-in status." });
  }
});

//HOLIDAY ROUTES
router.get("/upcoming-holiday", (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const upcomingHoliday = isHoliday.find((holiday) => holiday.date >= today);

  if (upcomingHoliday) {
    res.json(upcomingHoliday);
  } else {
    res.status(404).json({ message: "No upcoming holidays" });
  }
});

const markAbsents = async () => {
  const sgNow = new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" });
  const today = new Date(sgNow);
  const dateOnly = today.toISOString().split("T")[0];
  const dayOfWeek = today.toLocaleString("en-US", { weekday: "long" });

  const schedules = await Schedule.find({ days: dayOfWeek });

  for (const sched of schedules) {
    const employeeId = sched.employeeId;

    const existingTimeIn = await TimeTracking.findOne({
      employee_id: employeeId,
      time_in: {
        $gte: new Date(`${dateOnly}T00:00:00.000Z`),
        $lt: new Date(`${dateOnly}T23:59:59.999Z`)
      }
    });

    if (!existingTimeIn) {
      const employee = await Employee.findOne({ employeeId: employeeId });
      if (!employee) continue;

      const hasLeave = await Leave.findOne({
        employeeId,
        status: "Approved",
        start_date: { $lte: today },
        end_date: { $gte: today },
      });
      if (hasLeave) continue;

      const holidayInfo = isHoliday(dateOnly);
      if (holidayInfo) continue;

      // Generate time_tracking_id for absent entry
      const monthYear = `${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getFullYear()}`;
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      const time_tracking_id = `TRID-${monthYear}-${randomStr}`;

      const absentEntry = new TimeTracking({
        time_tracking_id, // Add this line
        employee_id: employeeId,
        employee_fullname: employee.fullname,
        position: employee.position,
        time_in: null,
        entry_type: "System Entry",
        entry_status: "absent",
        status: "absent",
        remarks: "Marked absent due to no time-in",
        shift_name: sched.shift_name || null,
        shift_period: null,
        is_holiday: false,
        holiday_name: null
      });

      await absentEntry.save();
    }
  }

  console.log("✅ Absentees marked for", dateOnly);
};

cron.schedule("59 23 * * *", () => {
  markAbsents();
});

// Time In
router.post("/time-in", async (req, res) => {
  try {
    const { employee_id, employee_fullname, position } = req.body;

    console.log("➡️ Time-in request received:");
    console.log("Employee ID:", employee_id);
    console.log("Fullname:", employee_fullname);
    console.log("Position:", position);

    const schedule = await Schedule.findOne({ employeeId: employee_id });
    console.log("🗓️ Schedule found:", schedule);

    if (!schedule) {
      console.warn("⚠️ No schedule found for employee:", employee_id);
      return res.status(400).json({
        success: false,
        message: "No schedule found for employee"
      });
    }

    const sgTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" });
    const now = new Date(sgTime);
    console.log("⏰ Singapore time:", now);

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    console.log("📅 Time range for today:", startOfDay, "to", endOfDay);

    const existingTimeIn = await TimeTracking.findOne({
      employee_id,
      time_in: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    if (existingTimeIn) {
      console.warn("⛔ Employee has already timed in today:", existingTimeIn);
      return res.status(400).json({
        success: false,
        message: "You have already timed in today"
      });
    }

    const dateOnly = now.toISOString().split("T")[0];
    const holidayInfo = isHoliday(dateOnly);
    console.log("🎉 Holiday info:", holidayInfo);

    const monthYear = `${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getFullYear()}`;
    const randomLetters = Math.random().toString(36).substring(2, 8).toUpperCase();
    const customTimeTrackingID = `TRID-${monthYear}-${randomLetters}`;

    console.log("🆔 Generated Time Tracking ID:", customTimeTrackingID);

    const timeTracking = new TimeTracking({
      time_tracking_id: customTimeTrackingID,
      employee_id,
      employee_fullname,
      position,
      time_in: now,
      entry_type: 'System Entry',
      status: 'active',
      is_holiday: !!holidayInfo,
      holiday_name: holidayInfo ? holidayInfo.name : null,
      shift_name: schedule.shiftname || null,
      entry_status: req.body.entry_status || 'on_time',
      minutes_late: req.body.minutes_late || 0,
    });

    await timeTracking.save();
    console.log("✅ Time-in record saved successfully:", timeTracking);

    res.status(201).json({
      success: true,
      message: "Time in recorded successfully",
      session: timeTracking,
      serverTime: now.toLocaleString("en-US", { timeZone: "Asia/Singapore" })
    });

  } catch (error) {
    console.error("❌ Time-in error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record time in",
      error: error.message
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

    const totalDurationHours =
      (timeOut - activeSession.time_in) / (1000 * 60 * 60);

    let overtimeHours = 0;
    let regularHours = totalDurationHours;

    const fivePM = new Date(timeOut);
    fivePM.setHours(17, 0, 0, 0);

    if (timeOut > fivePM) {
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

    if (totalDurationHours > 5) {
      regularHours = Math.max(0, regularHours - 1);
      activeSession.break_duration = 3600; //
    } else {
      activeSession.break_duration = 0;
    }

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
    
    // Add debug loggings
    console.log("Total sessions:", sessions.length);
    console.log("Entry types:", sessions.reduce((acc, session) => {
      acc[session.entry_type] = (acc[session.entry_type] || 0) + 1;
      return acc;
    }, {}));
    
    res.status(200).json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
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

router.get("/approveSessions", async (req, res) => {
  try {
    const sessions = await TimeTracking.find({ status: "approved" });

    const formatDuration = (duration) => {
      if (typeof duration === "string") {
        const match = duration.match(/^(\d+)H (\d+)M$/);
        if (match) {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          return `${hours}H ${minutes.toString().padStart(2, '0')}M`;
        }
      }
      return duration || "0H 00M";
    };

    const formattedSessions = sessions.map((session) => {
      const totalHours = session.total_hours || "0H 00M";
      const overtimeHours = session.overtime_hours || "0H 00M";
      
      return {
        ...session._doc,
        total_hours: formatDuration(totalHours),
        overtime_hours: formatDuration(overtimeHours),
      };
    });

    res.status(200).json(formattedSessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/approveTime", async (req, res) => {
  try {
    const sessions = await TimeTracking.find({ status: "approved" });
    res.status(200).json(sessions); // Directly return the raw session data
  } catch (error) {
    console.error("Error fetching approved sessions:", error);
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

// GET EMPLOYEE STATS
router.get("/attendance-stats/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;
    const now = new Date();

    // Current Month
    const firstDayOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );
    const lastDayOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    );

    // Previous Month
    const firstDayOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Count on-time and late records for the current month
    const onTimeCount = await TimeTracking.countDocuments({
      employee_id,
      time_in: { $gte: firstDayOfCurrentMonth, $lte: lastDayOfCurrentMonth },
      entry_status: "on_time",
    });

    const lateCount = await TimeTracking.countDocuments({
      employee_id,
      time_in: { $gte: firstDayOfCurrentMonth, $lte: lastDayOfCurrentMonth },
      entry_status: "late",
    });

    const totalAttendance = onTimeCount + lateCount;

    // Total work hours this month
    const currentMonthStats = await TimeTracking.aggregate([
      {
        $match: {
          employee_id,
          time_in: {
            $gte: firstDayOfCurrentMonth,
            $lte: lastDayOfCurrentMonth,
          },
        },
      },
      {
        $group: {
          _id: null,
          total_hours: { $sum: "$total_hours" },
        },
      },
    ]);

    // Total work hours last month
    const lastMonthStats = await TimeTracking.aggregate([
      {
        $match: {
          employee_id,
          time_in: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth },
        },
      },
      {
        $group: {
          _id: null,
          total_hours: { $sum: "$total_hours" },
        },
      },
    ]);

    const totalHoursThisMonth =
      currentMonthStats.length > 0 ? currentMonthStats[0].total_hours : 0;
    const totalHoursLastMonth =
      lastMonthStats.length > 0 ? lastMonthStats[0].total_hours : 0;

    // Determine trend
    let trend = "neutral"; // Default trend
    if (totalHoursThisMonth > totalHoursLastMonth) {
      trend = "up"; // Work hours increased
    } else if (totalHoursThisMonth < totalHoursLastMonth) {
      trend = "down"; // Work hours decreased
    }

    res.json({
      on_time: onTimeCount,
      late: lateCount,
      total: totalAttendance,
      total_hours: totalHoursThisMonth,
      trend: trend, // "up", "down", or "neutral"
    });
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    res.status(500).json({ message: "Failed to fetch attendance statistics" });
  }
});

// GET EMPLOYEE ACTIVITY FOR GRAPH
router.get("/activity/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { month } = req.query;

    const year = new Date().getFullYear();
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);

    // Get all attendance records for the month
    const attendanceRecords = await TimeTracking.find({
      employee_id,
      time_in: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
    }).sort({ time_in: 1 });

    // Transform the data with guaranteed numbers
    const dailyData = attendanceRecords.map((record, index) => ({
      name: `Day ${index + 1}`,
      hours: parseFloat(record.total_hours || 0).toFixed(1),
      on_time: record.entry_status === "on_time" ? 1 : 0,
      late: record.entry_status === "late" ? 1 : 0,
      date: record.time_in.toISOString().split("T")[0],
    }));

    console.log("Sending data:", dailyData); // Debug log
    res.json(dailyData);
  } catch (error) {
    console.error("Error fetching activity data:", error);
    res.status(500).json({ message: "Failed to fetch activity data" });
  }
});

// Get summarized stats for promotion evaluation
router.get("/promotion-stats/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const stats = await TimeTracking.aggregate([
      {
        $match: {
          employee_id,
          time_in: { $gte: sixMonthsAgo },
          status: "approved"
        }
      },
      {
        $group: {
          _id: null,
          totalDays: { $sum: 1 },
          totalHours: { $sum: { $toDouble: "$total_hours" } },
          onTimeCount: {
            $sum: { $cond: [{ $eq: ["$entry_status", "on_time"] }, 1, 0] }
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ["$entry_status", "late"] }, 1, 0] }
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalDays: 0,
      totalHours: 0,
      onTimeCount: 0,
      lateCount: 0
    });
  } catch (error) {
    console.error("Error fetching promotion stats:", error);
    res.status(500).json({ message: "Failed to fetch promotion statistics" });
  }
});

const markAbsences = async () => {
  try {
    const now = new Date();
    const localTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Manila" })
    );
    const yesterday = new Date(localTime);
    yesterday.setDate(localTime.getDate() - 1);
    const formattedDate = yesterday.toISOString().split("T")[0];
    const dayName = yesterday.toLocaleString("en-US", { weekday: "long" });

    console.log(
      `Running absence check for ${formattedDate} (${dayName}) at midnight...`
    );

    const schedules = await Schedule.find({ days: dayName });

    for (const schedule of schedules) {
      const { employeeId, firstName, lastName, position } = schedule;

      const existingEntry = await TimeTracking.findOne({
        employee_id: employeeId,
        time_in: {
          $gte: new Date(`${formattedDate}T00:00:00.000Z`),
          $lt: new Date(`${formattedDate}T23:59:59.999Z`),
        },
      });

      if (!existingEntry) {
        await TimeTracking.create({
          employee_id: employeeId,
          employee_firstname: firstName,
          employee_lastname: lastName,
          position: position,
          time_in: null,
          time_out: null,
          entry_status: "absent",
          is_absent: true,
          remarks: "No time entry for scheduled workday.",
          createdAt: new Date(),
        });

        console.log(`Marked absent: ${firstName} ${lastName}`);
      }
    }
  } catch (error) {
    console.error("Error marking absences:", error);
  }
};

cron.schedule("0 0 * * *", markAbsences, {
  timezone: "Asia/Manila",
});

router.get("/calendar/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const events = [];

    const schedule = await Schedule.findOne({ employeeId });

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const attendanceRecords = await TimeTracking.find({
      employee_id: employeeId,
    });

    attendanceRecords.forEach((record) => {
      if (record.entry_status === "absent") {
        events.push({
          title: "Absent",
          start: record.createdAt,
          backgroundColor: "#ff4d4d",
          textColor: "#fff",
        });
      } else {
        events.push({
          title: "Present",
          start: record.time_in,
          backgroundColor: "#4CAF50",
          textColor: "#fff",
        });
      }
    });

    schedule.days.forEach((day) => {
      events.push({
        title: "Scheduled Work",
        start: day,
        backgroundColor: "#007bff",
        textColor: "#fff",
      });
    });

    res.json(events);
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    res.status(500).json({ message: "Failed to fetch data" });
  }
});

// MANUAL ENTRY ROUTES
router.post("/manual-entry", timeTrackingController.createManualEntry);

router.get("/get-request", timeTrackingController.getOBRequests);

router.post("/request-review", timeTrackingController.reviewOBRequest);

router.get("/check-duplicate", timeTrackingController.checkDuplicateEntry);

router.delete(
  "/ob-request/:requestId",
  authenticateUser,
  authorizeRoles("admin", "superadmin"),
  deleteOBRequest
);

router.get("/schedule/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const schedule = await Schedule.findOne({ employeeId });
    
    if (!schedule) {
      return res.status(404).json({ message: "Schedule " });
    }
    
    res.json(schedule);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({ message: "Failed to fetch schedule" });
  }
});

// AI MODEL API
const { trainModelAndPredict } = require("../services/predictiveAnalytics");
router.get("/attendance-predictions", async (req, res) => {
  const result = await trainModelAndPredict();
  res.json(result);
});

module.exports = router;
