const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const fs = require("fs");
const socketIo = require("socket.io");
const cors = require("cors");
require("dotenv").config();



const incidentRoutes = require("./routes/incidentReport");
const employeeRoutes = require("./routes/employee");
const policyRoutes = require("./routes/policyRoutes");
const userProfile = require("./routes/userProfile");
const signupRoutes = require("./routes/auth/signup");
const loginRoutes = require("./routes/auth/login");
const uploadRoutes = require("./routes/uploadRoutes");
const profilePictureRoutes = require("./routes/profilePicture");
const createSuperadminRoutes = require("./routes/auth/createaccount");
const timeTrackingRoutes = require("./routes/totalTime");
const scheduleRoutes = require("./routes/createSchedule");
const leaveRoutes = require("./routes/leaveRoutes");
const obRoutes = require("./routes/obRoutes");
const path = require("path");
const leaveBalanceRoutes = require("./routes/leaveBalanceRoutes");
const logoutRoutes = require("./routes/auth/logout");
const documentRequest = require("./routes/documentRoutes");
const uploadedDocument = require("./routes/uploadedDocumentRoutes");
const timeTracking = require("./routes/timeTrackingRoutes");
const integrationRoutes = require("./routes/integrationRoutes");
const resignationRoutes = require("./routes/resignationRoutes");
const { initializeLeaveBalances, initializeEmployeeLeaveBalance, cronjob } = require("./controllers/leave");
const model = require("./routes/predictiveAnalyticsRoutes");
const onboard = require("./routes/onboardingRoutes");
const faceIdRoutes = require("./routes/faceId");

const app = express();
app.set("trust proxy", true);
app.use(express.json());

app.use((req, res, next) => {
  next();
});

// CORS CONFIG
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:5173",
  "http://localhost:7687",
  "https://hr1.jjm-manufacturing.com",
  "https://hr3.jjm-manufacturing.com",
  "https://backend-hr1.jjm-manufacturing.com",
  "https://backend-hr3.jjm-manufacturing.com",
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = "The CORS policy does not allow access from this.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

// Create HTTP server and set up Socket.IO
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Serve static files for face-api models
app.use('/models', express.static(path.join(__dirname, 'public/models')));

// Routes
app.use("/api/employee", employeeRoutes);
app.use("/api/incidentreport", incidentRoutes(io));
app.use("/api/policies", policyRoutes);
app.use("/api/user", userProfile);
app.use("/api/admin", signupRoutes);
app.use("/api/login-admin", loginRoutes);
app.use("/api", uploadRoutes);
app.use("/api", profilePictureRoutes);
app.use("/api/create-account", createSuperadminRoutes);
app.use("/api", timeTrackingRoutes); //totalTime.js
app.use("/api/schedule", scheduleRoutes);
app.use("/api/time-tracking", require("./routes/totalTimeRoutes"));
app.use("/api/leave", leaveRoutes);
app.use("/api/ob", obRoutes);
app.use("/api/leave-balance", leaveBalanceRoutes);
app.use("/api/auth", logoutRoutes);
app.use("/api/document-request", documentRequest);
app.use("/api/uploaded-documents", uploadedDocument);
app.use("/api/timetrack", timeTracking);
app.use("/api/resignation", resignationRoutes);
app.use("/api/analytics", model);
app.use("/api/onboarding", onboard);
app.use("/api/hr", integrationRoutes);
app.use("/api/faceid", faceIdRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));



mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
    cronjob();
    await initializeLeaveBalances();
  
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Basic route
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HR1 </title>
        <style>
            body {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background-color: black;
                margin: 0;
                color: white;
                font-family: Arial, sans-serif;
                text-align: center;
            }
            h1 {
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <div>
            <iframe src="https://giphy.com/embed/pEYYpt8vuoFQBJzo38" width="480" height="302" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>
          
        </div>
    </body>
    </html>
  `);
});

global.io = io;

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
