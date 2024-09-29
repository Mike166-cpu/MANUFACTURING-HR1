const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const corsMiddleware = require("./middleware/corsMiddleware");
const jsonParserMiddleware = require("./middleware/jsonParserMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(corsMiddleware());        // Apply CORS middleware
app.use(jsonParserMiddleware());  // Apply body parsers

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// User schema and model
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  middleName: String,
  suffix: String,
  birthday: Date,
  address: String,
  contactNumber: String,
  username: { type: String, unique: true },
  password: String,
});

const User = mongoose.model("User", userSchema);

// Signup route
app.post("/signup", async (req, res) => {
  const { firstName, lastName, middleName, suffix, birthday, address, contactNumber, username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ firstName, lastName, middleName, suffix, birthday, address, contactNumber, username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User created successfully!" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error creating user", error });
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Respond with first name and last name
    res.status(200).json({ 
      message: "Login successful!", 
      firstName: user.firstName, 
      lastName: user.lastName 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging in", error });
  }
});



app.get("/getAllUsers", async (req, res) => {
  try {
    const users = await User.find({});
    if (!users) {
      return res.status(400).json({ success: false, message: "Not found" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.log(error.message);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
