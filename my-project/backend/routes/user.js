const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');


const router = express.Router();

// User Registration
router.post('/register', async (req, res) => {
  const { firstName, lastName, middleName, nickname, suffix, birthday, address, contactNumber, username, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      middleName,
      nickname,
      suffix,
      birthday,
      address,
      contactNumber,
      username,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


router.post("/adminLogin", async (req, res) => {
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
