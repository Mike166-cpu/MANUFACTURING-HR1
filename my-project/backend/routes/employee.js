const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const axios = require("axios");
// const TimeTracking = require("../models/TimeTracking");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { forgotPassword } = require("../controllers/passwordController");
const jwt = require("jsonwebtoken");
const { loginEmployee } = require("../controllers/authController");
const { generateServiceToken } = require("../middleware/gatewayTokenGenerator");

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
    const { employee_password, ...employeeData } = req.body;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(employee_password, salt);

    // Generate unique employee ID
    const lastEmployee = await Employee.findOne().sort({ employee_id: -1 });
    const newId = lastEmployee
      ? parseInt(lastEmployee.employee_id.slice(1)) + 1
      : 1;
    const employee_id = `E${newId.toString().padStart(3, "0")}`;

    const newEmployee = new Employee({
      ...employeeData,
      employee_password: hashedPassword, // Save the hashed password
      employee_id,
    });

    await newEmployee.save();

    res.status(201).json({
      message: "Employee added successfully!",
      employee: newEmployee,
    });
  } catch (error) {
    console.error("Error while adding employee:", error);
    res
      .status(500)
      .json({ message: "Error adding employee", error: error.message });
  }
});

// Employee login route
router.post("/login-employee", loginEmployee);

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

// Verify Token Middleware
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization").replace("Bearer ", "");
  if (!token)
    return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// =======================================================================

// Protected Route
router.get("/protected", verifyToken, async (req, res) => {
  try {
    // Generate the service token for API authentication
    const serviceToken = generateServiceToken();

    // Make the API call to fetch real data from the API Gateway
    const response = await axios.get(
      `${process.env.API_GATEWAY_URL}/admin/get-accounts`,
      {
        headers: { Authorization: `Bearer ${serviceToken}` },
      }
    );

    // Log the fetched data to the server console
    console.log("Fetched data:", response.data);

    // Return the fetched data to the client instead of a static message
    res.status(200).json(response.data);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch all employees route
router.get("/employee-data", verifyToken, async (req, res) => {
  try {
    // Generate the service token for API authentication
    const serviceToken = generateServiceToken();

    // Make the API call to fetch real data from the API Gateway
    const response = await axios.get(
      `${process.env.API_GATEWAY_URL}/admin/get-accounts`,
      {
        headers: { Authorization: `Bearer ${serviceToken}` },
      }
    );

    // Log the fetched data to the server console
    console.log("Fetched data:", response.data);

    // Ensure response.data contains an array of user accounts
    if (!Array.isArray(response.data)) {
      return res.status(500).json({ message: "Invalid data format received" });
    }

    // Filter only employees (assuming role field exists)
    const employees = response.data.filter(user => user.role === "Employee");

    // Return the filtered employee data
    res.status(200).json(employees);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------------------------------------------------------------------------------

//LOGIN ADMIN FETCHED DATA
router.post("/testLog", async (req, res) => {
  try {
    const { email, password } = req.body;

    const serviceToken = generateServiceToken();

    const response = await axios.get(
      `${process.env.API_GATEWAY_URL}/admin/get-accounts`,
      {
        headers: { Authorization: `Bearer ${serviceToken}` },
      }
    );

    const users = response.data;

    const user = users.find((u) => u.email === email);

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ token, user });
  } catch (err) {
    console.error("Error during login:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});


// EMPLOYEE LOGIN ROUTE FROM ADMIN DATA
router.post("/employeeTestLog", async (req, res) => {
  try {
    const { email, password } = req.body;

    const serviceToken = generateServiceToken();

    // Fetch all user accounts from the API gateway
    const response = await axios.get(
      `${process.env.API_GATEWAY_URL}/admin/get-accounts`,
      {
        headers: { Authorization: `Bearer ${serviceToken}` },
      }
    );

    const users = response.data;

    // Find the user by email
    const user = users.find((u) => u.email === email);

    // Check if user exists and has role "Employee"
    if (!user || user.role !== "Employee") {
      return res
        .status(400)
        .json({ message: "Invalid email, password, or role" });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid email, password, or role" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ token, user });
  } catch (err) {
    console.error("Error during login:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
