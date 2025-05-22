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
  const { email, password, role, firstName, lastName, position } = req.body;

  console.log("Received request to create account with data:", { email, role, firstName, lastName, position });

  if (!email || !password || !role || !firstName || !lastName || !position) {
    console.log("Validation failed: Missing required fields.");
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    console.log("Checking if email already exists:", email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already registered:", email);
      return res.status(400).json({ error: "Email already registered" });
    }

    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Fetching last registered user to determine employeeId...");
    const lastUser = await User.findOne().sort({ employeeId: -1 });

    let employeeId;
    if (lastUser && lastUser.employeeId) {
      const lastIdNumber = parseInt(lastUser.employeeId.replace("EMP-", ""), 10);
      employeeId = `EMP-${lastIdNumber + 1}`;
      console.log("Generated new employeeId based on last user:", employeeId);
    } else {
      employeeId = "EMP-1000"; // Start from EMP-1000 if no users exist
      console.log("No existing users found. Starting employeeId at:", employeeId);
    }

    console.log("Creating new user document...");
    const newUser = new User({
      employeeId,
      email,
      firstName,
      lastName,
      password: hashedPassword,
      role,
      position, // add position
    });

    console.log("Saving new user to database...");
    await newUser.save();

    console.log("User created successfully:", {
      employeeId: newUser.employeeId,
      email: newUser.email,
    });

    res.status(201).json({
      message: "User created successfully!",
      employeeId,
      user: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        position: newUser.position, // add position to response
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
