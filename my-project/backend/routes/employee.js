const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const TimeTracking = require("../models/TimeTracking");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { forgotPassword } = require("../controllers/passwordController");
const jwt = require("jsonwebtoken");

router.post("/forgot-password", async (req, res) => {
  const { employee_email } = req.body;

  try {
    const employee = await Employee.findOne({ employee_email });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const token = jwt.sign({ id: employee._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: employee_email,
      subject: "Password Reset",
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
      <h2 style="text-align: center; color: #333;">Password Reset Request</h2>
      <p style="font-size: 16px; color: #555;">Hello,</p>
      <p style="font-size: 16px; color: #555;">You requested a password reset for your account. Please click the button below to reset your password:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="https://hr1.jjm-manufacturing.com/reset-password/${token}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #007bff; border-radius: 4px; text-decoration: none;">Reset Password</a>
      </div>
      <p style="font-size: 16px; color: #555;">If you didn't request this, please ignore this email.</p>
      <p style="font-size: 14px; color: #999; text-align: center;">© 2024 Your Company. All rights reserved.</p>
    </div>
  `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Password reset email sent." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const employee = await Employee.findById(decoded.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    employee.employee_password = newPassword;
    await employee.save();

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
});

// Employee registration route
router.post("/add", async (req, res) => {
  try {
    const employeeData = req.body;

    const newEmployee = new Employee(employeeData); // No need to hash again
    await newEmployee.save();

    res.status(201).json({
      message: "Employee added successfully!",
      employee: newEmployee,
    });
  } catch (error) {
    console.error("Error while adding employee:", error);
    res.status(500).json({ message: "Error adding employee", error: error.message });
  }
});

// Employee login route
router.post('/login-employee', async (req, res) => {
  const { employee_username, employee_password } = req.body;

  try {
    const employee = await Employee.findOne({ employee_username });
    console.log("Fetched employee data:", employee); 

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const isMatch = await bcrypt.compare(employee_password, employee.employee_password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: employee._id }, 'your_jwt_secret_key', { expiresIn: '1h' });

    res.json({
      success: true,
      token,
      employeeEmail: employee.employee_email,
      employeeFirstName: employee.employee_firstname,
      employeeLastName: employee.employee_lastname,
      employeeUsername: employee.employee_username,
      employeeId: employee.employee_id, 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
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
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
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
  const { id } = req.params;

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
  const { employee_username, employee_firstname, employee_lastname, time_in } =
    req.body;

  try {
    const newTimeTracking = new TimeTracking({
      employee_username,
      employee_firstname,
      employee_lastname,
      time_in,
      attendance: true,
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
  const { employee_username, employee_firstname, employee_lastname, time_out } =
    req.body;

  try {
    const timeTrackingRecord = await TimeTracking.findOne({
      employee_username,
      employee_firstname,
      employee_lastname,
      time_out: null,
    });

    if (!timeTrackingRecord) {
      return res
        .status(404)
        .json({ message: "No active time in record found" });
    }

    timeTrackingRecord.time_out = time_out;

    const totalMilliseconds =
      new Date(time_out) - new Date(timeTrackingRecord.time_in);
    const totalSeconds = Math.floor(totalMilliseconds / 1000);

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
    const records = await TimeTracking.find();
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
  const { id } = req.params;

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

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      employee.employee_password
    );
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect." });
    }

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

// Fetch current user data
router.get("/current-user", async (req, res) => {
  console.log("req.user:", req.user);
  const { employee_username } = req.user; 

  try {
    const employee = await Employee.findOne({ employee_username });
    console.log("Fetched employee data:", employee); 

    if (!employee) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      employee_firstname: employee.employee_firstname,
      employee_lastname: employee.employee_lastname,
      employee_email: employee.employee_email,
      employee_phone: employee.employee_phone,
      employee_address: employee.employee_address,
      employee_department: employee.employee_department,
      employee_dateOfBirth: employee.employee_dateOfBirth,
      employee_gender: employee.employee_gender,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/profile/:username", async (req, res) => {
  try {
    const employee = await Employee.findOne({
      employee_username: req.params.username,
    });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
