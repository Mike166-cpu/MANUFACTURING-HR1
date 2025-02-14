const express = require("express");
const router = express.Router();
const Schedule = require("../models/Schedule");

// Create a new schedule
router.post("/", async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['employeeId', 'employee_id', 'first_name', 'last_name', 'days', 'startTime', 'endTime'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const schedule = new Schedule(req.body);
    const savedSchedule = await schedule.save();

    res.status(201).json(savedSchedule);
  } catch (error) {
    console.error('Schedule creation error:', error);
    res.status(400).json({
      message: "Failed to create schedule",
      error: error.message
    });
  }
});

// Get schedules for a specific employee
router.get("/:employeeId", async (req, res) => {
  try {
    const schedules = await Schedule.find({ employeeId: req.params.employeeId });
    res.status(200).send(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error); // Add error logging
    res.status(500).send({
      message: "Failed to fetch schedules",
      error: error.message
    });
  }
});

// Get schedules for a specific employee by employee_id
router.get("/employee/:employee_id", async (req, res) => {
  try {
    const schedules = await Schedule.find({ employee_id: req.params.employee_id });
    res.status(200).send(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error); // Add error logging
    res.status(500).send({
      message: "Failed to fetch schedules",
      error: error.message
    });
  }
});

// Get a specific employee by employee_id
router.get("/employee/:employee_id", async (req, res) => {
  try {
    const employee = await Schedule.findOne({ employee_id: req.params.employee_id });
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
    const schedule = await Schedule.findOne({ employee_id: req.params.employee_id });
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

// Update an existing schedule
router.put("/:scheduleId", async (req, res) => {
  try {
    const scheduleId = req.params.scheduleId;
    const updatedData = req.body;

    const updatedSchedule = await Schedule.findByIdAndUpdate(scheduleId, updatedData, { new: true });

    if (!updatedSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    res.status(200).json(updatedSchedule);
  } catch (error) {
    console.error('Schedule update error:', error);
    res.status(400).json({
      message: "Failed to update schedule",
      error: error.message
    });
  }
});

module.exports = router;
