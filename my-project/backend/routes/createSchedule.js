const express = require("express");
const router = express.Router();
const Schedule = require("../models/Schedule");
const EmployeeLogin = require("../models/Employee");
const Shift = require("../models/Shifts");

// Keep only one view-schedule route at the top
router.get("/view-schedule/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log("Finding schedule for employeeId:", employeeId);
    
    const schedule = await Schedule.findOne({ employeeId }).lean();
    console.log("Found schedule:", schedule);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "No schedule found for this employee"
      });
    }

    res.status(200).json({
      success: true,
      schedule: schedule
    });
  } catch (error) {
    console.error("Error viewing schedule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch schedule details",
      error: error.message
    });
  }
});

// Create a new shift
router.post("/create-shift", async (req, res) => {
  try {
    const { 
      name, 
      shiftType,
      days, 
      startTime, 
      endTime, 
      breakStart, 
      breakEnd, 
      flexibleStartTime, 
      flexibleEndTime 
    } = req.body;

    // Debug log
    console.log('Received shift data:', req.body);

    // Validate required fields
    if (!name || !shiftType || !days || !days.length || !startTime || !endTime) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["name", "shiftType", "days", "startTime", "endTime"],
        received: { name, shiftType, daysLength: days?.length, startTime, endTime }
      });
    }

    // Create shift data with break times included by default
    const shiftData = {
      name,
      shiftType,
      days,
      startTime,
      endTime,
      breakStart,
      breakEnd,
      ...(shiftType === 'Flexible' && { flexibleStartTime, flexibleEndTime }),
    };

    const newShift = new Shift(shiftData);
    await newShift.save();

    res.status(201).json({
      message: "Shift created successfully",
      shift: newShift
    });
  } catch (error) {
    console.error("Error creating shift:", error);
    res.status(500).json({
      error: error.message || "Failed to create shift",
      validationErrors: error.errors
    });
  }
});

// Fetch all shifts
router.get("/fetch-shift", async (req, res) => {
  try {
    const shifts = await Shift.find();
    res.json(shifts);
  } catch (error) {
    console.error("Error fetching shifts:", error);
    res.status(500).json({ error: "Failed to fetch shifts" });
  }
});

router.delete("/delete-shift/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the shift exists
    const shift = await Shift.findById(id);
    if (!shift) {
      return res.status(404).json({ error: "Shift not found" });
    }

    // Delete the shift
    await Shift.findByIdAndDelete(id);
    res.status(200).json({ message: "Shift deleted successfully" });
  } catch (error) {
    console.error("Error deleting shift:", error);
    res.status(500).json({ error: "Failed to delete shift" });
  }
});

//update shift
router.put("/update-shift/:id", async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    shiftType,
    days, 
    startTime, 
    endTime,
    breakStart,
    breakEnd,
    flexibleStartTime,
    flexibleEndTime 
  } = req.body;

  try {
    if (!name || !shiftType || !days || !startTime || !endTime) {
      return res.status(400).json({ 
        error: "Required fields missing" 
      });
    }

    const updateData = {
      name,
      shiftType,
      days,
      startTime,
      endTime,
      ...(shiftType === 'Split' && { breakStart, breakEnd }),
      ...(shiftType === 'Flexible' && { flexibleStartTime, flexibleEndTime }),
    };

    const updatedShift = await Shift.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedShift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    res.status(200).json({ 
      message: "Shift updated successfully", 
      shift: updatedShift 
    });
  } catch (error) {
    console.error("Error updating shift:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Fetch all schedules
router.get("/", async (req, res) => {
  try {
    const schedules = await Schedule.find().populate("employeeId");
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: "Error fetching schedules" });
  }
});

const convertTo24HourFormat = (time12h) => {
  let [time, period] = time12h.split(" ");
  let [hours, minutes] = time.split(":");

  hours = parseInt(hours, 10);
  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
};


// Create or update a schedule
router.post("/assign", async (req, res) => {
  try {
    console.log('Received assignment request:', req.body); // Debug log

    const {
      employeeId,
      firstName,
      lastName,
      email,
      department, 
      role,
      days,
      startTime,
      endTime,
      shiftType,
      shiftname,
      breakStart,
      flexibleStartTime,
      flexibleEndTime
    } = req.body;

    // Calculate break end (1 hour after break start)
    let breakEnd = null;
    if (breakStart) {
      const [hours, minutes] = breakStart.split(':');
      let breakEndHour = parseInt(hours) + 1;
      if (breakEndHour > 23) breakEndHour = 0;
      breakEnd = `${breakEndHour.toString().padStart(2, '0')}:${minutes}`;
    }

    // Validate required fields
    if (!employeeId || !department || !days || !startTime || !endTime || !shiftType || !shiftname || !role) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        details: { employeeId, department, days, startTime, endTime, shiftType, shiftname, role }
      });
    }

    // Ensure days is an array
    if (!Array.isArray(days)) {
      return res.status(400).json({
        success: false,
        message: "Days must be an array",
        received: days
      });
    }

    // Check for existing schedule
    const existingSchedule = await Schedule.findOne({ employeeId });

    if (existingSchedule) {
      // Update existing schedule
      const updatedSchedule = await Schedule.findByIdAndUpdate(
        existingSchedule._id,
        {
          $set: {
            days,
            startTime,
            endTime,
            shiftType,
            shiftname,
            breakStart,
            breakEnd,
            flexibleStartTime,
            flexibleEndTime,
            firstName,
            lastName,
            email,
            department,
            role
          }
        },
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: "Schedule updated successfully",
        schedule: updatedSchedule
      });
    }

    // Create new schedule
    const newSchedule = new Schedule({
      employeeId,
      firstName,
      lastName,
      email,
      department, 
      role,
      days,
      startTime,
      endTime,
      shiftType,
      shiftname,
      breakStart,
      breakEnd,
      flexibleStartTime,
      flexibleEndTime
    });

    const savedSchedule = await newSchedule.save();
    return res.status(201).json({
      success: true,
      message: "Schedule assigned successfully",
      schedule: savedSchedule
    });

  } catch (error) {
    console.error("Schedule creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating schedule",
      error: error.message
    });
  }
});

// Delete a schedule
router.delete("/:id", async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Schedule deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting schedule" });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Add validation middleware for schedule creation
router.post("/", async (req, res, next) => {
  try {
    const existingSchedule = await Schedule.findOne({
      employeeId: req.body.employeeId,
    });
    if (existingSchedule) {
      return res.status(400).json({
        message:
          "Employee already has a schedule. Please update the existing one.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      message: "Error checking existing schedule",
      error: error.message,
    });
  }ds
});

// Create a new schedule
router.post("/", async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = [
      "employeeId",
      "employee_id",
      "first_name",
      "last_name",
      "days",
      "startTime",
      "endTime",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const schedule = new Schedule(req.body);
    const savedSchedule = await schedule.save();

    res.status(201).json(savedSchedule);
  } catch (error) {
    console.error("Schedule creation error:", error);
    res.status(400).json({
      message: "Failed to create schedule",
      error: error.message,
    });
  }
});

// Get schedules for a specific employee
router.get("/:employeeId", async (req, res) => {
  try {
    const schedules = await Schedule.find({
      employeeId: req.params.employeeId,
    });
    res.status(200).send(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error); // Add error logging
    res.status(500).send({
      message: "Failed to fetch schedules",
      error: error.message,
    });
  }
});

// Get schedules for a specific employee by employee_id
router.get("/employee/:employee_id", async (req, res) => {
  try {
    const schedules = await Schedule.find({
      employee_id: req.params.employee_id,
    });
    res.status(200).send(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error); // Add error logging
    res.status(500).send({
      message: "Failed to fetch schedules",
      error: error.message,
    });
  }
});

// Get a specific employee by employee_id
router.get("/employee/:employee_id", async (req, res) => {
  try {
    const employee = await Schedule.findOne({
      employee_id: req.params.employee_id,
    });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({
      message: "Failed to fetch employee",
      error: error.message,
    });
  }
});

// Get working days for a specific employee by employee_id
router.get("/employee/:employee_id/working-days", async (req, res) => {
  try {
    const schedule = await Schedule.findOne({
      employee_id: req.params.employee_id,
    });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.status(200).json({ days: schedule.days });
  } catch (error) {
    console.error("Error fetching working days:", error);
    res.status(500).json({
      message: "Failed to fetch working days",
      error: error.message,
    });
  }
});

// Get schedules for a specific employee by _id
router.get("/employee/byId/:_id", async (req, res) => {
  try {
    const schedules = await Schedule.find({ employeeId: req.params._id });
    if (!schedules || schedules.length === 0) {
      return res
        .status(404)
        .json({ message: "No schedules found for this employee" });
    }
    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({
      message: "Failed to fetch schedules",
      error: error.message,
    });
  }
});

// New simplified route for finding schedule by employeeId
router.get("/findByEmployeeId/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log("Searching for schedule with employeeId:", employeeId);

    const schedule = await Schedule.find({ employeeId });

    if (!schedule || schedule.length === 0) {
      return res.status(200).json([]);  // Return an empty array
    }

    res.status(200).json(schedule);
  } catch (error) {
    console.error("Error in findByEmployeeId:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching schedule",
      error: error.message,
    });
  }
});

// Clear and simple route to get employee schedule
router.get("/get-schedule/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    console.log("Received request for employee ID:", employeeId);

    // Direct query using employeeId
    const schedules = await Schedule.find({ 
      employeeId: employeeId 
    }).select('-__v');

    console.log("Found schedules:", schedules);

    if (!schedules || schedules.length === 0) {
      console.log("No schedules found for employee:", employeeId);
      return res.status(404).json({
        message: "No schedule found for this employee"
      });
    }

    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({
      message: "Failed to fetch schedule",
      error: error.message
    });
  }
});

// New route to get employee schedule for time tracking
router.get("/schedule-validation/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const schedule = await Schedule.findOne({ employeeId }).lean();

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "No schedule found for this employee"
      });
    }

    const currentDay = new Date().toLocaleString('en-US', { weekday: 'long' });
    const isWorkingDay = schedule.days.includes(currentDay);

    res.status(200).json({
      success: true,
      isWorkingDay,
      schedule
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch schedule",
      error: error.message
    });
  }
});

// Update an existing schedule
router.put("/:scheduleId", async (req, res) => {
  try {
    const scheduleId = req.params.scheduleId;
    const updateData = {
      employeeId: req.body.employeeId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      department: req.body.department,
      role: req.body.role,
      days: req.body.days,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      shiftType: req.body.shiftType,
      shiftname: req.body.shiftname,
      breakStart: req.body.breakStart || null,
      breakEnd: req.body.breakEnd || null,
      flexibleStartTime: req.body.flexibleStartTime || null,
      flexibleEndTime: req.body.flexibleEndTime || null
    };

    console.log('Updating schedule:', { scheduleId, updateData });

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      scheduleId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedSchedule) {
      return res.status(404).json({ 
        success: false,
        message: "Schedule not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Schedule updated successfully",
      schedule: updatedSchedule
    });
  } catch (error) {
    console.error("Schedule update error:", error);
    res.status(400).json({
      success: false,
      message: "Failed to update schedule",
      error: error.message
    });
  }
});

// Delete a schedule
router.delete("/:scheduleId", async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.status(200).json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Schedule deletion error:", error);
    res.status(500).json({
      message: "Failed to delete schedule",
      error: error.message,
    });
  }
});

//GET ALL
router.get("/all-schedules", async (req, res) => {
  try {
    const schedules = await Schedule.find();
    res.status(200).send(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error); // Add error logging
    res.status(500).send({
      message: "Failed to fetch schedules",
      error: error.message,
    });
    }
});

// Get weekly schedule for an employee
router.get("/weekly-schedule/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const schedule = await Schedule.findOne({ employeeId });
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "No schedule found for this employee"
      });
    }

    // Create weekly schedule structure
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weeklySchedule = weekDays.map(day => ({
      day,
      isWorking: schedule.days.includes(day),
      startTime: schedule.days.includes(day) ? schedule.startTime : null,
      endTime: schedule.days.includes(day) ? schedule.endTime : null,
      breakStart: schedule.days.includes(day) ? schedule.breakStart : null,
      breakEnd: schedule.days.includes(day) ? schedule.breakEnd : null,
    }));

    res.status(200).json({
      success: true,
      employeeId: schedule.employeeId,
      employeeName: `${schedule.firstName} ${schedule.lastName}`,
      position: schedule.position,
      shiftType: schedule.shiftType,
      weeklySchedule
    });
  } catch (error) {
    console.error("Error fetching weekly schedule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch weekly schedule",
      error: error.message
    });
  }
});

module.exports = router;
