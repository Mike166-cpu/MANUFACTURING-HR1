const express = require("express");
const router = express.Router();
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");
const Employees = require("../models/EmployeeModel");
const EmployeeLogin = require("../models/EmployeeLoginModel");
const { generateServiceToken } = require("../middleware/gatewayTokenGenerator");
const UserLogs = require("../models/UserLogsModels");
const UAParser = require("ua-parser-js");

const verifyToken = (req, res, next) => {
  const token = req.header("Authorization").replace("Bearer ", "");
  if (!token)
    return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.GATEWAY_JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// GET DATA OF OF HIRED EMPLOYEE IN HR2
router.get("/employees", verifyToken, async (req, res) => {
  try {
    const serviceToken = generateServiceToken();
    const response = await axios.get(
      `${process.env.API_GATEWAY_URL}/hr2/api/employees`,
      {
        headers: { Authorization: `Bearer ${serviceToken}` },
      }
    );

    const employees = response.data;
    console.log("Fetched employees:", employees);

    const validEmployees = employees.filter((emp) => emp._id && emp.email);

    const employeesWithDefaults = validEmployees.map((employee) => ({
      employee_id: employee._id,
      firstName: employee.firstName || "Unknown",
      lastName: employee.lastName || "Unknown",
      middleName: employee.middleName || "N/A",
      email: employee.email || `${employee._id}@placeholder.com`,
      age: employee.age ? parseInt(employee.age, 10) : 0,
      birthday: employee.birthday ? new Date(employee.birthday) : new Date(),
      gender: employee.gender || "N/A",
      address: employee.address || "N/A",
      department: employee.department || "N/A",
      role: employee.role || "N/A",
    }));

    if (employeesWithDefaults.length === 0) {
      return res.status(400).json({ message: "No valid employees to insert." });
    }

    // Process in smaller batches to handle errors better
    const batchSize = 100;
    for (let i = 0; i < employeesWithDefaults.length; i += batchSize) {
      const batch = employeesWithDefaults.slice(i, i + batchSize);
      const bulkOps = batch.map((emp) => ({
        updateOne: {
          filter: {
            $and: [
              { employee_id: { $exists: true, $ne: null } },
              { employee_id: emp.employee_id },
            ],
          },
          update: { $set: emp },
          upsert: true,
        },
      }));

      try {
        await Employees.bulkWrite(bulkOps, { ordered: false });
      } catch (bulkError) {
        console.warn("Some operations in batch failed:", bulkError.message);
      }
    }

    res.status(200).json({
      message: "Employees synchronized successfully",
      processedCount: employeesWithDefaults.length,
    });
  } catch (err) {
    console.error("Error syncing employees:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

// GET THE DATA OF HR2 THAT SAVE TO MY DB
router.get("/all-employee", verifyToken, async (req, res) => {
  try {
    const employees = await Employees.find();
    res.status(200).json(employees);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// FETCH ALL DATA ON ADMIN
router.get("/getData", verifyToken, async (req, res) => {
  try {
    const serviceToken = generateServiceToken();

    const response = await axios.get(
      `${process.env.API_GATEWAY_URL}/admin/get-accounts`,
      {
        headers: { Authorization: `Bearer ${serviceToken}` },
      }
    );

    console.log("Fetched data:", response.data);
    res.status(200).json(response.data);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//FETCH FROM ADMIN EMPLOYEE ACCOUNT
const syncEmployeeAccounts = async () => {
  try {
    console.log("🔄 Running Employee Sync Job...");

    const serviceToken = generateServiceToken();

    const response = await axios.get(
      `${process.env.API_GATEWAY_URL}/admin/get-accounts`,
      {
        headers: { Authorization: `Bearer ${serviceToken}` },
      }
    );

    const accounts = Array.isArray(response.data)
      ? response.data
      : response.data.accounts;

    const existingEmployees = await EmployeeLogin.find({}, "_id status");
    const employeeStatusMap = new Map(
      existingEmployees.map((emp) => [emp._id, emp.status])
    );

    const employeeData = await Promise.all(
      accounts
        .filter((user) => user.role?.toLowerCase() === "employee")
        .map(async (user) => {
          const hashedPassword = await bcrypt.hash(user.password, 10);
          return {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: hashedPassword,
            role: user.role,
            Hr: user.Hr,
            position: user.position,
            status: employeeStatusMap.get(user._id) || "active",
          };
        })
    );

    for (const emp of employeeData) {
      await EmployeeLogin.updateOne(
        { _id: emp._id },
        { $set: emp },
        { upsert: true }
      );
    }

    console.log("✅ Employee accounts synced successfully.");
  } catch (error) {
    console.error("❌ Error syncing employee accounts:", error);
  }
};

// CRON JOB FOR SYCNCING DATA
cron.schedule("0 */6 * * *", () => {
  syncEmployeeAccounts();
  console.log("Employee Sync.");
});

module.exports = { syncEmployeeAccounts };

//FETCH USERS ON EMPLOYEELOGINMODEL.js
router.get("/employee-data", async (req, res) => {
  try {
    const users = await EmployeeLogin.find();
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//FETCH SPECIFIC USER
router.get("/user/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;
    const user = await EmployeeLogin.findById(employee_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//LOGIN ADMIN FETCHED DATA
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const serviceToken = generateServiceToken();

    // Fetch users from API Gateway
    const response = await axios.get(
      `${process.env.API_GATEWAY_URL}/admin/get-accounts`,
      { headers: { Authorization: `Bearer ${serviceToken}` } }
    );

    const users = response.data;
    const user = users.find((u) => u.email === email);

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Standardize role naming
    const userRole = user.role.trim().toLowerCase(); // Normalize input
    const allowedRoles = ["admin", "superadmin", "super admin"];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }


    const expiresInSeconds = 15 * 60;
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: expiresInSeconds }
    );
    const expirationTime = Date.now() + expiresInSeconds * 1000;

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.GATEWAY_JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token,
      refreshToken,
      user,
      expirationTime,
      message: `Welcome ${user.role}!`,
    });
  } catch (err) {
    console.error("Error during login:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// LOGIN FOR EMPLOYEE
router.post("/employee-login", async (req, res) => {
  try {
    const { employee_email: email, employee_password: password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

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

    if (user.role !== "Employee") {
      return res
        .status(403)
        .json({ message: "Access denied. Employees only." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.GATEWAY_JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userAgentString = req.headers["user-agent"];
    const parser = new UAParser();
    parser.setUA(userAgentString);
    const browserName = parser.getBrowser().name; // Get real browser name

    await UserLogs.create({
      userId: user._id,
      email: user.email,
      action: "Logged In",
      ipAddress: req.ip,
      userAgent: browserName, // Store the actual browser name
    });

    return res.status(200).json({ token, refreshToken, user });
  } catch (err) {
    console.error("Error during login:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

//UPDATE PROFILE PICTURE
router.put("/update-profile-picture/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { profile_picture } = req.body;

    if (!profile_picture) {
      return res
        .status(400)
        .json({ message: "Profile picture URL is required" });
    }

    const updatedEmployee = await EmployeeLogin.findByIdAndUpdate(
      employee_id,
      { profilePicture: profile_picture },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePicture: updatedEmployee.profilePicture,
    });
  } catch (err) {
    console.error("Error updating profile picture:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//FETCH LOG USER
router.get("/logs", async (req, res) => {
  try {
    const logs = await UserLogs.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

const API_URL =
  "https://backend-core2.jjm-manufacturing.com/api/auditRequestHr1";
const AUDIT_COMPLETED_TASKS_URL =
  "https://backend-core2.jjm-manufacturing.com/api/auditCompletedTasksHr1";

router.post("/audit-request", async (req, res) => {
  try {
    const serviceToken = generateServiceToken();
    const { department, description, task } = req.body;

    if (!department || !description || !Array.isArray(task)) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    const response = await axios.post(
      API_URL,
      { department, description, task },
      { headers: { Authorization: `Bearer ${serviceToken}` } }
    );

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/audit-request", async (req, res) => {
  try {
    const serviceToken = generateServiceToken();
    const response = await axios.get(AUDIT_COMPLETED_TASKS_URL, {
      headers: { Authorization: `Bearer ${serviceToken}` },
    });

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch audit requests." });
  }
});

// GET: Fetch Completed Audit Tasks
router.get("/audit-completed-tasks", async (req, res) => {
  try {
    const serviceToken = generateServiceToken();
    const response = await axios.get(AUDIT_COMPLETED_TASKS_URL, {
      headers: { Authorization: `Bearer ${serviceToken}` },
    });

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch completed audit tasks." });
  }
});


router.put("/terminate/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await EmployeeLogin.findByIdAndUpdate(
      id,
      { status: "terminated" },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({ message: "Employee terminated successfully", employee });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
