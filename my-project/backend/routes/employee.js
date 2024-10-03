const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee"); // Ensure this path is correct
const bcrypt = require("bcrypt"); // Import bcrypt for password comparison

// Add Employee Route
// Add Employee Route
router.post("/add", async (req, res) => {
  try {
    const employeeData = req.body;

    // Hash the password before saving
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

router.post("/login-employee", async (req, res) => {
  const { employee_username, employee_password } = req.body;

  try {
    const isPasswordValid = await bcrypt.compare(
      employee_password,
      employee.employee_password
    );
    if (!isPasswordValid) {
      console.log("Invalid password");
      return res.status(401).json({ message: "Invalid password" });
    }

    res.status(200).json({ message: "Login successful!" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
