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
const {
  initializeLeaveBalances,
  initializeEmployeeLeaveBalance,
  cronjob,
} = require("./controllers/leave");
const onboard = require("./routes/onboardingRoutes");
const faceIdRoutes = require("./routes/faceId");
const logs = require("./routes/logs");

const employeeData = require("./routes/employeeDataRoutes");
const promotion = require("./routes/promotionRoutes");
const test = require("./routes/testAzureAI");
const ml = require("./routes/renderRoutes");



const app = express();
app.set("trust proxy", true);
app.use(express.json());

app.use((req, res, next) => {
  next();
});

// CORS CONFIG
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
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
app.use("/models", express.static(path.join(__dirname, "public/models")));

// Routes
app.use("/api/employee", employeeRoutes);
app.use("/api/incidentreport", incidentRoutes(io));
app.use("/api/policies", policyRoutes); //in use
app.use("/api/user", userProfile);
app.use("/api/admin", signupRoutes);
app.use("/api/login-admin", loginRoutes);  //IN-USE
app.use("/api", uploadRoutes);
app.use("/api", profilePictureRoutes);
app.use("/api/create-account", createSuperadminRoutes);
app.use("/api", timeTrackingRoutes); //totalTime.js
app.use("/api/schedule", scheduleRoutes); //in use
app.use("/api/time-tracking", require("./routes/totalTimeRoutes"));
app.use("/api/leave", leaveRoutes);  //inuse
app.use("/api/ob", obRoutes);
app.use("/api/leave-balance", leaveBalanceRoutes); // in use
app.use("/api/auth", logoutRoutes);
app.use("/api/document-request", documentRequest); //in use
app.use("/api/uploaded-documents", uploadedDocument);  // in use
app.use("/api/timetrack", timeTracking);  //in-sue
app.use("/api/resignation", resignationRoutes); //in use
app.use("/api/onboarding", onboard);  //in-use
app.use("/api/hr", integrationRoutes);  //in use
app.use("/api/faceid", faceIdRoutes);
app.use("/api/logs", logs);  // in use
app.use("/api/promotion", promotion); //in use
app.use("/api/test", test);
app.use("/api", ml);
app.use("/api/employeeData", employeeData);  //inuse

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json({ limit: '50mb' }));


app.use(express.urlencoded({ limit: '50mb', extended: true }));


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

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

global.io = io;



console.log("MONGO_URI from env:", process.env.MONGO_URI);


const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
