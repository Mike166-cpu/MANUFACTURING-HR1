//##ADMIN SIDE
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Employee = require("../models/LoginAccount");
const EmployeeData = require("../models/Employee");
const transporter = require("../utils/mailer");

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your 2FA Verification Code",
      html: `<p>Your verification code is: <b>${otp}</b></p>`,
    });

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

    return res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

//veify otp
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "2FA successful!",
      token,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "OTP verification failed", error: error.message });
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

const employeeFaceLogin = async (req, res) => {
  try {
    const { email, faceDescriptor } = req.body;

    // Find user by email
    const user = await Employee.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if user has registered face
    if (!user.faceDescriptor) {
      return res.status(400).json({ message: "Face ID not registered for this user" });
    }

    // Compare face descriptors (you might want to add a threshold)
    const similarity = calculateSimilarity(faceDescriptor, user.faceDescriptor);
    if (similarity < 0.6) {
      return res.status(401).json({ message: "Face verification failed" });
    }

    const employeeDetails = await EmployeeData.findOne({
      employeeId: user.employeeId,
    });
    const fullName = employeeDetails ? employeeDetails.fullname : "";

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        name: fullName,
        employeeId: user.employeeId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Face login successful",
      token,
      user: {
        email: user.email,
        name: fullName,
        role: user.role,
        employeeId: user.employeeId,
      },
    });
  } catch (error) {
    console.error("Face login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const calculateSimilarity = (descriptor1, descriptor2) => {
  return 1 - Math.sqrt(
    descriptor1.reduce((sum, val, i) => sum + Math.pow(val - descriptor2[i], 2), 0)
  );
};

module.exports = { loginUser, employeeLogin, verifyOtp, employeeFaceLogin };
