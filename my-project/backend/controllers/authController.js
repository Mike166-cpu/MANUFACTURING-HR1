const Employee = require("../models/Employee");
const bcrypt = require("bcrypt");
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

    const token = jwt.sign({ id: employee._id }, "your_jwt_secret_key", {
      expiresIn: "1h",
    });

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
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
