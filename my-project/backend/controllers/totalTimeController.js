const moment = require("moment");
const TotalTime = require("../models/TotalTime");

function calculateOvertimeAndDuration(time_in, time_out) {

  const durationInMillis =
    new Date(time_out).getTime() - new Date(time_in).getTime();
  const durationInMinutes = Math.floor(durationInMillis / 60000); // Convert milliseconds to minutes

  // Calculate overtime (if any, assuming a standard work duration)
  const standardWorkDuration = 8 * 60; // 8 hours = 480 minutes
  const overtimeMinutes =
    durationInMinutes > standardWorkDuration
      ? durationInMinutes - standardWorkDuration
      : 0;

  // Convert minutes to HH:MM format for display
  const formatToHHMM = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  // Format the work duration and overtime
  const formattedWorkDuration = formatToHHMM(durationInMinutes);
  const formattedOvertimeDuration = formatToHHMM(overtimeMinutes);

  // Return overtime duration in minutes, and the formatted versions
  return {
    workDuration: durationInMinutes,
    overtimeDuration: overtimeMinutes * 60, // Store overtime in seconds
    formattedWorkDuration,
    formattedOvertimeDuration,
  };
}

const checkIfLate = (actualStartTime) => {
  const actual = new Date(actualStartTime);
  const scheduled = new Date(actualStartTime);
  scheduled.setHours(8, 0, 0, 0); // Set to 8:00 AM

  // Calculate minutes late
  const minutesLate = Math.max(0, (actual - scheduled) / (1000 * 60));

  // Consider late if more than 15 minutes after 8 AM
  return {
    isLate: minutesLate > 15,
    lateDuration: minutesLate > 15 ? minutesLate : 0,
  };
};

function convertSecondsToHM(seconds) {
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  minutes = minutes % 60;

  // Ensure two-digit formatting for both hours and minutes
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

// Helper function to calculate work duration excluding break time
const calculateWorkDuration = (timeIn, timeOut, breakStart, breakEnd) => {
  const startTime = new Date(timeIn);
  const endTime = new Date(timeOut);
  const lunchStart = new Date(startTime);
  lunchStart.setHours(12, 0, 0);
  const lunchEnd = new Date(startTime);
  lunchEnd.setHours(13, 0, 0);

  let totalSeconds = 0;

  // If work spans lunch break
  if (startTime < lunchStart && endTime > lunchEnd) {
    totalSeconds += (lunchStart - startTime) / 1000;
    totalSeconds += (endTime - lunchEnd) / 1000;
  } else {
    totalSeconds = (endTime - startTime) / 1000;
  }

  // Exclude break time if provided
  if (breakStart && breakEnd) {
    const breakDuration = (new Date(breakEnd) - new Date(breakStart)) / 1000;
    totalSeconds -= breakDuration;
  }

  return Math.floor(totalSeconds);
};

// Controller function to create a new time tracking entry
exports.createTimeTrackingEntry = async (req, res) => {
  try {
    const {
      employee_username,
      employee_id,
      time_in,
      time_out,
      work_duration,
      break_duration,
      label,
      entry_type,
    } = req.body;

    if (!employee_username || !time_in || !work_duration || !label) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newTime = new TotalTime({
      employee_username,
      employee_id,
      time_in,
      time_out,
      work_duration,
      break_duration,
      label,
      entry_type: entry_type || "System Entry",
    });
    await newTime.save();
    res.status(201).json({
      message: "Time tracking entry created successfully",
      newTime,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create time tracking entry" });
  }
};

// Controller function to get all time tracking entries
exports.getAllTimeTrackingEntries = async (req, res) => {
  try {
    const logs = await TotalTime.find();
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch time tracking entries" });
  }
};

// Controller function to get time tracking entries by employee username and employee_id
exports.getTimeTrackingEntriesByUsername = async (req, res) => {
  const { username, employee_id } = req.params;
  try {
    const logs = await TotalTime.find({
      employee_username: username,
      employee_id: employee_id,
    });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logs for the employee" });
  }
};

// GET ALL APPROVED TIME ENTRIES
exports.getApprovedTimeTrackingEntries = async (req, res) => {
  try {
    const approvedLogs = await TotalTime.find({ status: "approved" }); 
    console.log("Approved Time Tracking Entries:", approvedLogs); 
    res.status(200).json(approvedLogs);
  } catch (error) {
    console.error("Error fetching approved time tracking entries:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch approved time tracking entries" });
  }
};

// New controller function to get time tracking entries by employee ID
exports.getTimeTrackingEntriesByEmployeeId = async (req, res) => {
  try {
    const { employee_id } = req.params;
    console.log("Fetching time tracking entries for employee ID:", employee_id);

    if (!employee_id) {
      return res.status(400).json({ error: "Employee ID is required" });
    }

    const logs = await TotalTime.find({ employee_id: employee_id });
    console.log("Raw logs from database:", logs);

    // Process logs and preserve overtime_duration as a number
    const processedLogs = logs.map((log) => {
      const processedLog = log.toObject(); // Convert mongoose doc to plain object

      // Ensure overtime_duration remains a number
      if (typeof processedLog.overtime_duration !== "undefined") {
        processedLog.overtime_duration = parseInt(
          processedLog.overtime_duration
        );
      }

      console.log("Processed log:", processedLog);
      return processedLog;
    });

    console.log("Final processed logs:", processedLogs);
    res.status(200).json(processedLogs);
  } catch (error) {
    console.error("Error fetching time tracking entries:", error);
    res.status(500).json({ error: "Failed to fetch time tracking entries" });
  }
};

exports.updateTimeTrackingEntry = async (req, res) => {
  try {
    const { time_out, break_start, break_end, remarks } = req.body;
    const timeTracking = await TotalTime.findById(req.params.id);

    if (!timeTracking) {
      return res.status(404).json({ message: "Time tracking entry not found" });
    }

    const workDuration = calculateWorkDuration(timeTracking.time_in, time_out, break_start, break_end);

    const updateData = {
      time_out: time_out,
      work_duration: workDuration,
      break_start: break_start,
      break_end: break_end,
      break_duration: break_start && break_end ? (new Date(break_end) - new Date(break_start)) / 1000 : 0,
      remarks: remarks || timeTracking.remarks,
      status: "pending",
    };

    const updatedTimeTracking = await TotalTime.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.json(updatedTimeTracking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controller function to start time tracking
exports.startTimeTracking = async (req, res) => {
  const { employee_username, employee_id, start_time } = req.body;

  try {
    if (!employee_username || !employee_id || !start_time) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if late
    const lateStatus = checkIfLate(start_time);

    if (lateStatus.isLate) {
      console.log(
        `Employee ${employee_username} is late by ${Math.floor(
          lateStatus.lateDuration
        )} minutes`
      );
    }

    const timeTrackingEntry = new TotalTime({
      employee_username,
      employee_id,
      time_in: start_time,
      is_active: true,
      late: lateStatus.isLate,
      late_duration: Math.floor(lateStatus.lateDuration),
      label: "Work",
      entry_type: "System Entry", // Ensure this is set
      session_id: `WORK-${employee_id}-${Date.now()}`,
    });

    await timeTrackingEntry.save();
    console.log("Saved entry:", timeTrackingEntry); // Add logging

    // Add warning message if late
    const responseMessage = lateStatus.isLate
      ? `Time tracking started successfully. You are late by ${Math.floor(
          lateStatus.lateDuration
        )} minutes.`
      : "Time tracking started successfully";

    res.status(201).json({
      message: responseMessage,
      data: timeTrackingEntry,
    });
  } catch (error) {
    console.error("Error with entry type:", error);
    res
      .status(500)
      .json({ message: "Failed to start time tracking", error: error.message });
  }
};

// Controller function to update break duration
exports.updateBreakDuration = async (req, res) => {
  try {
    const { break_start, break_end } = req.body; // Receive break times
    const { id } = req.params;

    // Find the existing log entry
    const logEntry = await TotalTime.findById(id);
    if (!logEntry) {
      return res.status(404).json({ message: "Log not found" });
    }

    // Ensure break times are valid
    if (!break_start || !break_end) {
      return res
        .status(400)
        .json({ message: "Break start and end times are required" });
    }

    const breakStart = new Date(break_start);
    const breakEnd = new Date(break_end);
    const breakDurationMs = breakEnd - breakStart;

    if (breakDurationMs < 0) {
      return res
        .status(400)
        .json({ message: "Break end time must be after break start time" });
    }

    // Convert break duration to HH:MM:SS format
    const hours = String(Math.floor(breakDurationMs / 3600000)).padStart(
      2,
      "0"
    );
    const minutes = String(
      Math.floor((breakDurationMs % 3600000) / 60000)
    ).padStart(2, "0");
    const seconds = String(
      Math.floor((breakDurationMs % 60000) / 1000)
    ).padStart(2, "0");

    const formattedBreakDuration = `${hours}:${minutes}:${seconds}`;

    // Update break duration in the database
    const updatedLog = await TotalTime.findByIdAndUpdate(
      id,
      { break_duration: formattedBreakDuration },
      { new: true }
    );

    res.status(200).json(updatedLog);
  } catch (error) {
    console.error("Error updating break duration:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller function to pause time tracking
exports.pauseTimeTracking = async (req, res) => {
  try {
    const { session_id, pause_time } = req.body;

    // Validate if session_id and pause_time are provided
    if (!session_id || !pause_time) {
      return res
        .status(400)
        .json({ message: "Session ID and pause time are required" });
    }

    const session = await TotalTime.findById(session_id);

    // If session doesn't exist
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // If the session is already paused, no need to pause again
    if (session.time_out !== null) {
      return res
        .status(400)
        .json({ message: "Session is already paused or completed" });
    }

    // Calculate the time spent from time_in to pause_time
    const timeIn = new Date(session.time_in);
    const pauseTime = new Date(pause_time);
    const workDurationMs = pauseTime - timeIn;

    if (workDurationMs < 0) {
      return res
        .status(400)
        .json({ message: "Pause time cannot be before the start time" });
    }

    // Convert work duration to HH:MM:SS format
    const hours = String(Math.floor(workDurationMs / 3600000)).padStart(2, "0");
    const minutes = String(
      Math.floor((workDurationMs % 3600000) / 60000)
    ).padStart(2, "0");
    const seconds = String(
      Math.floor((workDurationMs % 60000) / 1000)
    ).padStart(2, "0");
    const formattedWorkDuration = `${hours}:${minutes}:${seconds}`;

    // Calculate break duration
    const breakDurationMs = new Date() - pauseTime; // Assuming break starts after pause
    const breakDuration = breakDurationMs / 1000; // in seconds

    // Update the session with paused time and break duration
    session.time_out = pause_time; // set the pause time as the "time_out"
    session.work_duration = formattedWorkDuration; // update work duration
    session.break_duration += breakDuration; // add the break duration in seconds

    await session.save();

    res.status(200).json({
      message: "Session paused successfully",
      session,
    });
  } catch (error) {
    console.error("Error pausing the session:", error);
    res.status(500).json({ message: "Failed to pause the session" });
  }
};

// Controller function to resume time tracking
exports.resumeTimeTracking = async (req, res) => {
  try {
    const { session_id, resume_time } = req.body;

    // Ensure session_id and resume_time are provided
    if (!session_id || !resume_time) {
      return res
        .status(400)
        .json({ message: "Session ID and resume time are required" });
    }

    const session = await TotalTime.findById(session_id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Log session data and resume_time for debugging
    console.log("Session Data:", session);
    console.log("Resume Time:", resume_time);

    // Convert time_in and resume_time to moment objects for validation
    const timeIn = moment(session.time_in); // session.time_in is a Date, but moment can handle it
    const resumeTime = moment(resume_time); // resume_time is a string, so moment will parse it

    if (!timeIn.isValid() || !resumeTime.isValid()) {
      return res
        .status(400)
        .json({ message: "Invalid session data or resume time" });
    }

    // Calculate the work duration from time_in to resume_time
    const workDuration = resumeTime.diff(timeIn, "seconds");

    if (isNaN(workDuration)) {
      return res.status(400).json({ message: "Invalid duration calculation" });
    }

    // Update session with new work duration and reset time_out
    session.time_out = null; // Clear time_out when resuming
    session.work_duration = workDuration.toString();
    await session.save();

    res.status(200).json(session);
  } catch (error) {
    console.error("Error in /resume route:", error);
    res.status(500).json({ message: "Failed to resume the timer" });
  }
};

// Controller function to approve a time tracking entry
exports.approveTimeTrackingEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const timeTracking = await TotalTime.findById(id);

    if (!timeTracking) {
      return res.status(404).json({ message: "Time tracking entry not found" });
    }

    timeTracking.status = "approved";
    const updatedTimeTracking = await timeTracking.save();
    res.json(updatedTimeTracking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
