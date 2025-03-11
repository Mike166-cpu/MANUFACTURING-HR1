const express = require("express");
const router = express.Router();
const Schedule = require("../models/Schedule");
const EmployeeLogin = require("../models/EmployeeLoginModel");

//NEW ROUTES
// Fetch all schedules
router.get("/", async (req, res) => {
  try {
    const schedules = await Schedule.find().populate("employeeId");
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: "Error fetching schedules" });
  }
});

// Create or update a schedule
router.post("/assign", async (req, res) => {
  const {
    employeeId,
    days,
    startTime,
    endTime,
    firstName,
    lastName,
    email,
    position,
  } = req.body;

  try {
    // Validate required fields
    if (
      !employeeId ||
      !days ||
      !startTime ||
      !endTime ||
      !firstName ||
      !lastName ||
      !email ||
      !position
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!Array.isArray(days) || days.length === 0) {
      return res
        .status(400)
        .json({ error: "Please select at least one working day" });
    }

    // Find employee in EmployeeLoginModel
    const employee = await EmployeeLogin.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Check for overlapping schedules
    const existingSchedule = await Schedule.findOne({
      employeeId,
      days: { $in: days },
    });

    if (existingSchedule) {
      return res.status(400).json({
        error:
          "Schedule conflict: Employee already has a shift on one of the selected days",
      });
    }

    const schedule = new Schedule({
      employeeId,
      firstName,
      lastName,
      email,
      position,
      days,
      startTime,
      endTime,
    });

    const savedSchedule = await schedule.save();
    res.status(201).json({
      message: "Schedule assigned successfully",
      schedule: savedSchedule,
    });
  } catch (error) {
    console.error("Schedule creation error:", error);
    res.status(500).json({
      error: "Error creating schedule",
      details: error.message,
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
  }
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

// Get schedule for a specific employee
router.get("/employee/:employeeId", async (req, res) => {
  try {
    const schedule = await Schedule.find({ employeeId: req.params.employeeId });

    if (!schedule || schedule.length === 0) {
      return res.status(404).json({
        message: "No schedule found for this employee",
        employeeId: req.params.employeeId,
      });
    }

    console.log("Found schedule:", schedule); // Debug log
    res.status(200).json(schedule);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({
      message: "Failed to fetch schedule",
      error: error.message,
    });
  }
});

// New simplified route for finding schedule by employeeId
router.get("/findByEmployeeId/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log("Searching for schedule with employeeId:", employeeId);

    const schedule = await Schedule.find({ employeeId: employeeId });
    console.log("Found schedule:", schedule);

    if (!schedule || schedule.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No schedule found for this employee",
      });
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

// Update an existing schedule
router.put("/:scheduleId", async (req, res) => {
  try {
    const scheduleId = req.params.scheduleId;
    const { employeeId, days, startTime, endTime } = req.body;

    // Verify employee exists in EmployeeLoginModel
    const employee = await EmployeeLogin.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      scheduleId,
      {
        days,
        startTime,
        endTime,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        position: employee.position,
      },
      { new: true }
    );

    if (!updatedSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    res.status(200).json(updatedSchedule);
  } catch (error) {
    console.error("Schedule update error:", error);
    res.status(400).json({
      message: "Failed to update schedule",
      error: error.message,
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

module.exports = router;
