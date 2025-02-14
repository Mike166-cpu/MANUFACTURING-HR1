const moment = require("moment");
const TotalTime = require("../models/TotalTime");

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

// Controller function to get time tracking entries by employee username
exports.getTimeTrackingEntriesByUsername = async (req, res) => {
  const { username } = req.params;
  try {
    const logs = await TotalTime.find({ employee_username: username });

    const workDurations = logs.map((log) => log.work_duration);

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logs for the employee" });
  }
};

// Controller function to update a time tracking entry
exports.updateTimeTrackingEntry = async (req, res) => {
  const { id } = req.params;
  const { time_out, break_start, break_end, break_duration } = req.body;

  try {
    const logEntry = await TotalTime.findById(id);
    if (!logEntry) {
      return res.status(404).json({ error: "Log not found" });
    }

    // Handle break start
    if (break_start) {
      logEntry.break_start = break_start;
      logEntry.is_on_break = true;
    }

    // Handle break end and calculate duration
    if (break_end && logEntry.break_start) {
      logEntry.break_end = break_end;
      logEntry.is_on_break = false;
      
      // Calculate break duration in seconds
      const breakStartTime = new Date(logEntry.break_start);
      const breakEndTime = new Date(break_end);
      const newBreakDuration = Math.floor((breakEndTime - breakStartTime) / 1000);
      
      // Add to existing break duration
      logEntry.break_duration = (logEntry.break_duration || 0) + newBreakDuration;
    }

    if (time_out) {
      const timeIn = new Date(logEntry.time_in);
      const timeOut = new Date(time_out);
      const durationMs = timeOut - timeIn;
      const hours = String(Math.floor(durationMs / 3600000)).padStart(2, "0");
      const minutes = String(
        Math.floor((durationMs % 3600000) / 60000)
      ).padStart(2, "0");
      const seconds = String(Math.floor((durationMs % 60000) / 1000)).padStart(
        2,
        "0"
      );
      logEntry.work_duration = `${hours}:${minutes}:${seconds}`;
      logEntry.time_out = time_out;
    }

    const updatedLog = await logEntry.save();
    res.status(200).json(updatedLog);
  } catch (error) {
    console.error("Error updating time tracking entry:", error);
    res.status(500).json({ error: "Failed to update time tracking entry" });
  }
};

// Controller function to start time tracking
exports.startTimeTracking = async (req, res) => {
  const { employee_username, employee_id, start_time } = req.body;

  try {
    if (!employee_username || !employee_id || !start_time) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const timeTrackingEntry = new TotalTime({
      employee_username,
      employee_id,
      time_in: start_time,
      is_active: true, // Marks the session as active
    });

    await timeTrackingEntry.save();
    res.status(201).json({
      message: "Time tracking started successfully",
      data: timeTrackingEntry,
    });
  } catch (error) {
    console.error("Error starting time tracking:", error);
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
