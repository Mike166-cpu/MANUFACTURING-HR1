//##ADMIN SIDE
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Employee = require("../models/LoginAccount");
const EmployeeData = require("../models/Employee");

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const response = {
      message: "Login successful!",
      token,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        accessLevel:
          user.role === "superadmin"
            ? "Super Admin"
            : user.role === "admin"
            ? "Admin"
            : "User",
        department: user.department || "General",
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

//EMPLOYEE LOGIN
const employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await Employee.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const employeeDetails = await EmployeeData.findOne({
      employeeId: user.employeeId,
    });
    const fullName = employeeDetails ? employeeDetails.fullname : "";

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        name: fullName,
        employeeId: user.employeeId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } //
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        email: user.email,
        name: fullName,
        role: user.role,
        employeeId: user.employeeId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
module.exports = { loginUser, employeeLogin };
