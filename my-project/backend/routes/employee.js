const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee"); // Ensure this path is correct
const TimeTracking = require("../models/TimeTracking");
const bcrypt = require("bcrypt"); // Import bcrypt for password comparison

// Employee registration route
router.post("/add", async (req, res) => {
  try {
    const employeeData = req.body;
    employeeData.employee_password = await bcrypt.hash(
      employeeData.employee_password,
      10
    );

    const newEmployee = new Employee(employeeData);
    await newEmployee.save();
    res
      .status(201)
      .json({ message: "Employee added successfully!", employee: newEmployee });
  } catch (error) {
    console.error("Error while adding employee:", error);
    res
      .status(500)
      .json({ message: "Error adding employee", error: error.message });
  }
});

// Employee login route
router.post("/login-employee", async (req, res) => {
  const { employee_username, employee_password } = req.body;

  try {
    const employee = await Employee.findOne({ employee_username });
    if (!employee) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(
      employee_password,
      employee.employee_password
    );
    if (!isPasswordValid) {
      console.log("Invalid password");
      return res.status(401).json({ message: "Invalid password" });
    }

    res.status(200).json({
      message: "Login successful!",
      employee_email: employee.employee_email,
      employee_firstname: employee.employee_firstname,
      employee_middlename: employee.employee_middlename || "",
      employee_lastname: employee.employee_lastname,
      employee_suffix: employee.employee_suffix || "",
      employee_username: employee.employee_username,
      employee_department: employee.employee_department,
      employee_phone: employee.employee_phone || "",
      employee_address: employee.employee_address || "",
      employee_dateOfBirth: employee.employee_dateOfBirth
        ? employee.employee_dateOfBirth.toISOString().split("T")[0]
        : "",
      employee_gender: employee.employee_gender || "",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all employees route
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Error fetching employees" });
  }
});

// Update employee route
router.put("/:id", async (req, res) => {
  const { id } = req.params; // Get the employee ID from the URL
  const updateData = req.body; // Get the updated data from the request body

  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true, // Ensure validation rules are applied
    });
    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json({
      message: "Employee updated successfully!",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    res
      .status(500)
      .json({ message: "Error updating employee", error: error.message });
  }
});

// Delete employee route
router.delete("/:id", async (req, res) => {
  const { id } = req.params; // Get the employee ID from the URL

  try {
    const deletedEmployee = await Employee.findByIdAndDelete(id);
    if (!deletedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json({ message: "Employee deleted successfully!" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res
      .status(500)
      .json({ message: "Error deleting employee", error: error.message });
  }
});

// TIME IN
router.post("/time-in", async (req, res) => {
  const { employee_username, time_in } = req.body;

  try {
    const newTimeTracking = new TimeTracking({
      employee_username,
      time_in,
    });

    await newTimeTracking.save();
    res.status(200).json({ message: "Time in successful!" });
  } catch (error) {
    console.error("Error in time in:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// TIME OUT
router.post("/time-out", async (req, res) => {
  const { employee_username, time_out } = req.body;

  try {
    const timeTrackingRecord = await TimeTracking.findOne({
      employee_username,
      time_out: null, // Ensure this is the latest time in record without a time out
    });

    if (!timeTrackingRecord) {
      return res
        .status(404)
        .json({ message: "No active time in record found" });
    }

    timeTrackingRecord.time_out = time_out;

    // Calculate total hours in seconds
    const totalMilliseconds =
      new Date(time_out) - new Date(timeTrackingRecord.time_in);
    const totalSeconds = Math.floor(totalMilliseconds / 1000);

    // Save total seconds instead of HH:MM:SS
    timeTrackingRecord.total_hours = totalSeconds;

    await timeTrackingRecord.save();

    res.status(200).json({ message: "Time out successful!" });
  } catch (error) {
    console.error("Time out error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Fetch all time tracking records
router.get("/time-tracking", async (req, res) => {
  try {
    const records = await TimeTracking.find(); // Fetch all records
    res.status(200).json(records);
  } catch (error) {
    console.error("Error fetching all time tracking records:", error);
    res.status(500).json({ message: "Error fetching time tracking records" });
  }
});

// Fetch time tracking records for a specific employee
router.get("/time-tracking/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const records = await TimeTracking.find({ employee_username: username });
    res.status(200).json(records);
  } catch (error) {
    console.error("Error fetching time tracking records:", error);
    res.status(500).json({ message: "Error fetching time tracking records" });
  }
});

// Delete time tracking record
router.delete("/time-tracking/:id", async (req, res) => {
  const { id } = req.params; // Get the record ID from the URL

  try {
    const deletedRecord = await TimeTracking.findByIdAndDelete(id);
    if (!deletedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }
    res.status(200).json({ message: "Record deleted successfully!" });
  } catch (error) {
    console.error("Error deleting record:", error);
    res
      .status(500)
      .json({ message: "Error deleting record", error: error.message });
  }
});

// PROGRESS CHART
router.get("/summary/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const records = await TimeTracking.find({ employee_username: username });
    const groupedRecords = records.reduce((acc, record) => {
      const date = new Date(record.time_in).toDateString();
      if (!acc[date]) {
        acc[date] = { date, records: [] };
      }
      acc[date].records.push(record);
      return acc;
    }, {});

    const summary = Object.values(groupedRecords);
    res.json(summary);
  } catch (error) {
    console.error("Error fetching summary data:", error);
    res.status(500).json({ error: "Failed to fetch summary data" });
  }
});

// Update employee profile by username
router.put("/employee/:username", async (req, res) => {
  try {
    const username = req.params.username;

    const updatedEmployee = await Employee.findOneAndUpdate(
      { employee_username: username },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    return res.status(200).json({
      message: "Employee profile updated successfully!",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Error updating employee profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Update employee password route
router.put("/employee/:username/change-password", async (req, res) => {
  const { username } = req.params;
  const { currentPassword, newPassword } = req.body;

  try {
    const employee = await Employee.findOne({ employee_username: username });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, employee.employee_password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    employee.employee_password = hashedNewPassword;

    await employee.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});


// Update employee profile by username
router.put("/:username", async (req, res) => {
  try {
    const username = req.params.username;

    const updatedEmployee = await Employee.findOneAndUpdate(
      { employee_username: username },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    return res.status(200).json({
      message: "Employee profile updated successfully!",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Error updating employee profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});



module.exports = router;
