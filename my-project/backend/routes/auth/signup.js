const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const router = express.Router();
const axios = require("axios");

router.get("/getData", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
  

router.post("/create-account", async (req, res) => {
  const { email, password, role, firstName, lastName } = req.body;

  if (!email || !password || !role || !firstName || !lastName) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Find the last registered user and get the highest employee ID
    const lastUser = await User.findOne().sort({ employeeId: -1 });

    let employeeId;
    if (lastUser && lastUser.employeeId) {
      const lastIdNumber = parseInt(lastUser.employeeId.replace("EMP-", ""), 10);
      employeeId = `EMP-${lastIdNumber + 1}`;
    } else {
      employeeId = "EMP-1000"; // Start from EMP-1000 if no users exist
    }

    const newUser = new User({
      employeeId,
      email,
      firstName,
      lastName,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully!",
      employeeId,
      user: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Error during user creation:", error);
    res.status(500).json({
      error: "Error creating user",
      details: error.message,
    });
  }
});

module.exports = router;
