const Employee = require("../models/Employee");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.loginEmployee = async (req, res) => {
  console.log("Login request received");
  const { employee_username, employee_password } = req.body;

  try {
    const employee = await Employee.findOne({ employee_username });
    console.log("Fetched employee data:", employee);

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    const isMatch = await bcrypt.compare(
      employee_password,
      employee.employee_password
    );

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: employee._id, username: employee.employee_username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    // Update online status and timestamps
    employee.isOnline = true;
    employee.lastLogin = new Date();
    employee.lastActive = new Date();
    await employee.save();

    res.json({
      success: true,
      token,
      employeeEmail: employee.employee_email,
      employeeFirstName: employee.employee_firstname,
      employeeLastName: employee.employee_lastname,
      employeeUsername: employee.employee_username,
      employeeId: employee.employee_id,
      employeeProfile: employee.profile_picture,
      employeeDepartment: employee.employee_department,
      lastLogin: employee.lastLogin,
      isOnline: employee.isOnline,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.logoutEmployee = async (req, res) => {
  res.clearCookie("employeeToken");
  res.json({ message: "Employee logged out" });
};