const express = require("express");
const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const router = express.Router();

router.get("/current", async (req, res) => {
  const username = req.query.username;

  try {
    const user = await Employee.findOne({ employee_username: username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const formattedDateOfBirth = user.employee_dateOfBirth
      ? new Date(user.employee_dateOfBirth).toISOString().split("T")[0]
      : null;

    res.status(200).json({
      employee_id: user.employee_id || "",
      employee_firstname: user.employee_firstname || "",
      employee_lastname: user.employee_lastname || "",
      employee_middlename: user.employee_middlename || "",
      employee_username: user.employee_username || "",
      employee_email: user.employee_email || "",
      employee_suffix: user.employee_suffix || "",
      employee_address: user.employee_address || "",
      employee_phone: user.employee_phone || "",
      employee_gender: user.employee_gender || "",
      employee_dateOfBirth: formattedDateOfBirth || "",
      employee_department: user.employee_department || "",
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Error fetching user data" });
  }
});

//Update Profile
router.put("/update", async (req, res) => {
  // Use 'router.put' instead of 'app.put'
  const { username } = req.query;
  const updateData = req.body;

  try {
    const updatedEmployee = await Employee.findOneAndUpdate(
      { employee_username: username },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedEmployee);
  } catch (error) {
    console.error("Error updating user data:", error); // Added logging for debugging
    res.status(500).json({ message: error.message });
  }
});

router.put("/change-password", async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find employee by username
    const employee = await Employee.findOne({ employee_username: username });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Compare current password with hashed password in database
    const isMatch = await bcrypt.compare(
      currentPassword,
      employee.employee_password
    );
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in the database
    employee.employee_password = hashedPassword;
    await employee.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
