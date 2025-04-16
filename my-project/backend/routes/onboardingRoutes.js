const express = require("express");
const router = express.Router();
const axios = require("axios");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const { generateServiceToken } = require("../middleware/gatewayTokenGenerator");
const Employee = require("../models/Employee");
const User = require("../models/LoginAccount");

router.get("/employee", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/employee/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Use findOne with the correct field name
    const employee = await Employee.findOne({ employeeId });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/getEmployee/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findOne({ employeeId });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json(employee);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

router.get("/applicant", async (req, res) => {
  try {
    const serviceToken = await generateServiceToken();

    // Fetch applicants from HR2 via API Gateway
    const response = await axios.get(
      `${process.env.API_GATEWAY_URL}/hr2/api/employees`,
      {
        headers: { Authorization: `Bearer ${serviceToken}` },
      }
    );

    // Get onboarded employees (fetch only emails and archived status)
    const onboardedEmployees = await Employee.find({}, "email archived status");

    // Separate onboarded emails and archived emails
    const onboardedEmails = new Set(onboardedEmployees.map((emp) => emp.email));
    
    // Create a map of email to archived status
    const archivedStatusMap = new Map(
      onboardedEmployees.map(emp => [emp.email, emp.archived])
    );

    // Add onboarded and archived status to all applicants
    const processedApplicants = response.data.map((applicant) => ({
      ...applicant,
      onboarded: onboardedEmails.has(applicant.email),
      archived: archivedStatusMap.get(applicant.email) || false,
      rejected: onboardedEmployees.find(emp => emp.email === applicant.email)?.status === "Rejected" || false
    }));

    res.status(200).json(processedApplicants);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/accept", async (req, res) => {
  try {
    const { applicant } = req.body;
    if (!applicant || !applicant.fullname) {
      return res.status(400).json({ message: "Applicant data is missing." });
    }

    console.log("Received applicant data:", applicant);

    const existingEmployee = await Employee.findOne({ email: applicant.email });
    if (existingEmployee) {
      return res
        .status(400)
        .json({ message: "Applicant is already onboarded." });
    }

    const lastEmployee = await Employee.findOne().sort({ createdAt: -1 });
    let newEmployeeNumber = 1;

    if (lastEmployee && lastEmployee.employeeId) {
      const lastNumber = parseInt(lastEmployee.employeeId.split("-")[1], 10);
      newEmployeeNumber = lastNumber + 1;
    }

    const employeeId = `EMP-${String(newEmployeeNumber).padStart(3, "0")}`;

    const nameParts = applicant.fullname.trim().split(" ");
    const lastName = nameParts[nameParts.length - 1];

    const generatedPassword = `#${lastName.charAt(0).toUpperCase()}${lastName
      .charAt(1)
      .toLowerCase()}8080`;

    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Construct documents array
    const documents = [];

    if (applicant.resume) {
      documents.push({
        name: "Resume",
        url: applicant.resume,
        uploadedAt: new Date(),
      });
    }

    // Create Employee record
    const newEmployee = new Employee({
      employeeId,
      fullname: applicant.fullname,
      email: applicant.email,
      department: applicant.department,
      position: applicant.role,
      experience: applicant.experience,
      education: applicant.education,
      gender: applicant.gender,
      nationality: applicant.nationality,
      civilStatus: applicant.civilStatus,
      role: "Employee",
      skills: applicant.skills || [],
      documents, 
      status: "Active",
    });

    await newEmployee.save();

    //CREATE LOGIN ACCOUNT
    const newUser = new User({
      email: applicant.email,
      password: hashedPassword,
      role: "Employee",
      employeeId: employeeId,
    });

    await newUser.save();
    newEmployee.userId = newUser._id;
    await newEmployee.save();

    // Send login details via email
    await sendLoginEmail(applicant.email, generatedPassword, employeeId);

    res.status(201).json({
      message:
        "Applicant onboarded successfully. Login credentials sent via email.",
      employee: newEmployee,
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

async function sendLoginEmail(email, password) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: '"No-Reply" <no-reply@jjmmanufacturing.ph>',
    to: email,
    subject: "Welcome to the Company - Your Login Details",
    text: `Hello,\n\nYour account has been created.\n\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after logging in.\n\nBest regards, HR Team`,
    replyTo: "no-reply@yourdomain.com",
  };

  await transporter.sendMail(mailOptions);
}

router.post("/archive", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is missing." });
    }

    const employee = await Employee.findOneAndUpdate(
      { email: email },
      { archived: true },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    res.status(200).json({ message: "Employee archived successfully." });
  } catch (error) {
    console.error("Archiving error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/unarchive", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is missing." });
    }

    const employee = await Employee.findOneAndUpdate(
      { email: email },
      { archived: false },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    res.status(200).json({ message: "Employee unarchived successfully." });
  } catch (error) {
    console.error("Unarchiving error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reject", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is missing." });
    }

    const employee = await Employee.findOneAndUpdate(
      { email: email },
      { status: "Rejected" },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    res.status(200).json({ message: "Employee rejected successfully." });
  } catch (error) {
    console.error("Rejection error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
