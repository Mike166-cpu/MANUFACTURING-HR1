const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../../models/User");

const router = express.Router();

router.post("/", async (req, res) => {
  const { firstName, lastName, middleName, suffix, address, birthday, contactNumber, username, password, email } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      middleName,
      suffix,
      contactNumber,
      username,
      password: hashedPassword,
      email,
      address,
      birthday,
    });
    await newUser.save();
    res.status(201).json({ message: "User created successfully!" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error creating user", error });
  }
});

module.exports = router;
