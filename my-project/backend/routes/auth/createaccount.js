const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../../models/User");

const router = express.Router();

router.post("/", async (req, res) => {
  const { username, email, password, role, firstName, lastName } = req.body;

  if (!username || !email || !password || !role || !firstName || !lastName) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // Ensure that the role is either 'admin' or 'superadmin'
  if (!["admin", "superadmin"].includes(role)) {
    return res
      .status(400)
      .json({ error: "Invalid role. Must be 'admin' or 'superadmin'." });
  }

  try {
    // Check if a user already exists with this username or email
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this username or email already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user (admin or superadmin based on the role)
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role, // Set role as provided (either 'admin' or 'superadmin')
      firstName,
      lastName
    });
    await newUser.save();

    res.status(201).json({ message: `${role} account created successfully!` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create account." });
  }
});

module.exports = router;
