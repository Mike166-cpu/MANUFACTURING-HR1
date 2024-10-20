const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();
const incidentReportRoute = require("./routes/incidentReport");
const employeeRoutes = require("./routes/employee");
const corsMiddleware = require("./middleware/corsMiddleware");
const jsonParserMiddleware = require("./middleware/jsonParserMiddleware");
const policyRoutes = require("./routes/policyRoutes");

const app = express();
app.use(express.json()); // Use JSON parsing
const PORT = process.env.PORT || 5000;

app.use(corsMiddleware());
app.use(jsonParserMiddleware());

app.use("/api/employee", employeeRoutes);
app.use("/api/incidentreport", incidentReportRoute);
app.use("/api/policies", policyRoutes);

const cors = require("cors");

const allowedOrigins = [
  "http://localhost:3000",
  "https://hr1.jjm-manufacturing.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const User = require("./models/User");

app.get("/", (req, res) => {
  res.send("Hello world ");
});

// Signup route for Admin
app.post("/signup", async (req, res) => {
  const {
    firstName,
    lastName,
    middleName,
    nickname,
    suffix,
    birthday,
    address,
    contactNumber,
    username,
    password,
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
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
    res.status(201).json({ message: "User created successfully!" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error creating user", error });
  }
});

// Login route for Admin
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
      lastName: user.lastName,
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
