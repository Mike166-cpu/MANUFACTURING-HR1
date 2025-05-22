const express = require("express");
const router = express.Router();
const axios = require("axios");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { generateServiceToken } = require("../middleware/gatewayTokenGenerator");
const Employee = require("../models/Employee");
const Onboarding = require("../models/Onboarding");
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
    const response = await axios.get(
      `${process.env.API_GATEWAY_URL}/hr2/api/employees`,
      {
        headers: { Authorization: `Bearer ${serviceToken}` },
      }
    );

    // Get all onboarding records
    const onboardingRecords = await Onboarding.find({}, "email status");
    const onboardingEmails = new Set(onboardingRecords.map(record => record.email));

    // Get employee records
    const employees = await Employee.find({}, "email archived status");
    const employeeEmails = new Set(employees.map(emp => emp.email));

    // Process applicants with updated status
    const processedApplicants = response.data.map((applicant) => ({
      ...applicant,
      inOnboarding: onboardingEmails.has(applicant.email),
      onboarded: employeeEmails.has(applicant.email),
      archived: employees.find(emp => emp.email === applicant.email)?.archived || false,
      rejected: employees.find(emp => emp.email === applicant.email)?.status === "Rejected" || false,
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

    // Prevent onboarding if applicant was previously rejected
    const rejectedEmployee = await Employee.findOne({ email: applicant.email, status: "Rejected" });
    if (rejectedEmployee) {
      return res.status(400).json({ message: "This applicant has been rejected and cannot be onboarded again." });
    }

    // Check for existing records
    const existingEmployee = await Employee.findOne({ email: applicant.email });
    const existingOnboarding = await Onboarding.findOne({ email: applicant.email });
    const existingUser = await User.findOne({ email: applicant.email });

    if (existingEmployee || existingOnboarding || existingUser) {
      return res.status(400).json({ message: "Applicant is already onboarded or in process." });
    }

    // Get the last employee's employeeId
    const lastEmployee = await Onboarding.findOne().sort({ _id: -1 });

    let newEmployeeNumber = 1;
    if (lastEmployee && lastEmployee.employeeId) {
      const lastNumber = parseInt(lastEmployee.employeeId.split("-")[1], 10);
      newEmployeeNumber = lastNumber + 1;
    }
    

    const employeeId = `EMP-${String(newEmployeeNumber).padStart(3, "0")}`;

    // Generate initial password
    const lastName = applicant.fullname.trim().split(" ").slice(-1)[0];
    const generatedPassword = `#${lastName.charAt(0).toUpperCase()}${lastName.charAt(1).toLowerCase()}8080`;
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Create user account first
    const newUser = new User({
      email: applicant.email,
      password: hashedPassword,
      role: "Employee",
      employeeId,
    });
    await newUser.save();

    // Create onboarding record
    const onboardingRecord = new Employee({
      employeeId,
      fullname: applicant.fullname,
      email: applicant.email,
      department: applicant.department,
      position: applicant.role,
      experience: applicant.experience,
      gender: applicant.gender,
      nationality: applicant.nationality,
      civilStatus: applicant.civilStatus,
      role: "Employee",
      skills: applicant.skills || [],
      documents: applicant.resume ? [{ name: "Resume", url: applicant.resume, uploadedAt: new Date() }] : [],
      userId: newUser._id,
      onboardingStatus: "Pending",
      completionSteps: {
        personalInfo: false,
        documentation: false,
        setupComplete: false,
      },
    });

    await onboardingRecord.save();

    await sendLoginEmail(applicant.email, generatedPassword);

    res.status(201).json({
      message: "Account created and onboarding process initiated. Login credentials sent via email.",
      onboarding: onboardingRecord,
      employeeId,
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.get("/onboard", async (req, res) => {
  try {
    const onboardingRecords = await Onboarding.find();
    res.status(200).json(onboardingRecords);
  } catch (error) {
    console.error("Error fetching onboarding records:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/onboard/:employeeId", async (req, res) => {
  const { employeeId } = req.params;

  try {
    const onboardingRecord = await Onboarding.findOne({ employeeId });

    if (!onboardingRecord) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json(onboardingRecord);
  } catch (error) {
    console.error("Error fetching onboarding record:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/onboarding-status/:id", async (req, res) => {
  try {
    const onboarding = await Onboarding.findById(req.params.id);
    if (!onboarding) {
      return res.status(404).json({ message: "Onboarding record not found" });
    }
    res.status(200).json(onboarding);
  } catch (error) {
    res.status(500).json({ message: "Error fetching onboarding status" });
  }
});

router.put("/update-onboarding/:id", async (req, res) => {
  try {
    const { completionSteps, notes, onboardingStatus } = req.body;
    const updatedOnboarding = await Onboarding.findByIdAndUpdate(
      req.params.id,
      {
        completionSteps,
        notes,
        onboardingStatus,
      },
      { new: true }
    );
    res.status(200).json(updatedOnboarding);
  } catch (error) {
    res.status(500).json({ message: "Error updating onboarding status" });
  }
});

router.get("/status/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const onboarding = await Onboarding.findOne({ employeeId });
    
    if (!onboarding) {
      return res.status(404).json({ message: "Onboarding record not found" });
    }
    
    res.status(200).json(onboarding);
  } catch (error) {
    res.status(500).json({ message: "Error fetching onboarding status" });
  }
});

router.put("/status/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { completionSteps, onboardingStatus, notes } = req.body;
    
    const onboarding = await Onboarding.findOneAndUpdate(
      { employeeId },
      { completionSteps, onboardingStatus, notes },
      { new: true }
    );
    
    if (!onboarding) {
      return res.status(404).json({ message: "Onboarding record not found" });
    }

    // Check if all steps are completed
    const allStepsCompleted = Object.values(completionSteps).every(step => step === true);
    
    if (allStepsCompleted && onboardingStatus === "Completed") {
      // Create employee record only (account already exists)
      const existingEmployee = await Employee.findOne({ employeeId });
      
      if (!existingEmployee) {
        const newEmployee = new Employee({
          employeeId,
          email: onboarding.email,
          fullname: onboarding.fullname,
          department: onboarding.department,
          position: onboarding.position,
          experience: onboarding.experience,
          education: onboarding.education,
          gender: onboarding.gender,
          nationality: onboarding.nationality,
          civilStatus: onboarding.civilStatus,
          role: onboarding.role,
          skills: onboarding.skills,
          userId: onboarding.userId,
          documents: onboarding.documents, // Copy documents from onboarding
          status: "Active",
          onboardingCompletedAt: new Date(),
          onboardingDetails: {
            completionSteps,
            completedAt: new Date(),
            notes
          }
        });
        await newEmployee.save();
        
        return res.status(200).json({
          message: "Onboarding completed and employee record created",
          onboarding,
          employeeCreated: true
        });
      }
    }
    
    res.status(200).json({ message: "Onboarding status updated", onboarding });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Error updating onboarding status" });
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

    // Update or create employee record with rejected status
    const employee = await Onboarding.findOneAndUpdate(
      { email: email },
      { 
        status: "Rejected",
        rejectedAt: new Date()
      },
      { new: true, upsert: true }
    );

    // Deactivate user account
    await User.findOneAndUpdate(
      { email: email },
      { active: false }
    );

    // Delete onboarding record if exists
    await Onboarding.findOneAndDelete({ email: email });

    // Send rejection email
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
      subject: "Onboarding Status Update",
      text: `Dear Applicant,\n\nWe regret to inform you that your onboarding process has been unsuccessful. Your account has been deactivated.\n\nBest regards,\nHR Team`,
      replyTo: "no-reply@yourdomain.com",
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: "Employee rejected and account deactivated successfully.",
      employee
    });
  } catch (error) {
    console.error("Rejection error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reject-onboarding", async (req, res) => {
  try {
    const { employeeId, email, reason } = req.body;
    console.log("[POST] /reject-onboarding - Payload received:", { employeeId, email, reason });

    // Validate required fields
    if (!email || !employeeId || !reason) {
      console.warn("Validation failed: missing required fields", {
        email: !email ? "Email is required" : "Provided",
        employeeId: !employeeId ? "Employee ID is required" : "Provided",
        reason: !reason ? "Reason is required" : "Provided"
      });

      return res.status(400).json({ 
        message: "Missing required fields",
        details: {
          email: !email ? "Email is required" : null,
          employeeId: !employeeId ? "Employee ID is required" : null,
          reason: !reason ? "Reason is required" : null
        }
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    console.log("MongoDB session started, transaction initiated.");

    try {
      // Only update the Onboarding record, do not touch Employee model
      const onboarding = await Onboarding.findOneAndUpdate(
        { employeeId, email },
        {
          status: "Rejected",
          onboardingStatus: "Rejected",
          rejectedAt: new Date(),
          rejectionReason: reason
        },
        { new: true, session }
      );
      if (!onboarding) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Onboarding record not found." });
      }
      console.log("Onboarding status update result:", onboarding);

      // Deactivate user account
      await User.findOneAndUpdate(
        { $or: [{ employeeId }, { email }] },
        { 
          active: false,
          lastModifiedAt: new Date(),
          deactivationReason: reason
        },
        { new: true, session }
      );

      await session.commitTransaction();
      console.log("Transaction committed successfully.");

      // Send rejection email
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
        subject: "Onboarding Process Terminated",
        text: `Dear Applicant,\n\nWe regret to inform you that your onboarding process has been discontinued.\n\nReason: ${reason}\n\nYour account has been deactivated.\n\nBest regards,\nHR Team`,
        replyTo: "no-reply@yourdomain.com",
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({ 
        message: "Onboarding rejected and account deactivated successfully",
        onboarding,
        accountDeactivated: true
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Transaction aborted due to error:", error);
      throw error;
    } finally {
      session.endSession();
      console.log("MongoDB session ended.");
    }
  } catch (error) {
    console.error("Unexpected error in /reject-onboarding:", error);
    res.status(500).json({ 
      message: "Failed to reject onboarding",
      error: error.message 
    });
  }
});

const sendRejectionEmail = async (email, reason) => {
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
    subject: "Onboarding Process Update",
    text: `Dear Applicant,\n\nWe regret to inform you that your onboarding process has been discontinued.\n\nReason: ${reason}\n\nYour account has been deactivated.\n\nBest regards,\nHR Team`,
    replyTo: "no-reply@yourdomain.com",
  };

  await transporter.sendMail(mailOptions);
};

router.post("/reject-employee", async (req, res) => {
  try {
    const { employeeId, email, reason } = req.body;
    if (!employeeId || !email || !reason) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Update employee status to Rejected
    const employee = await Employee.findOneAndUpdate(
      { employeeId, email },
      {
        status: "Rejected",
        rejectedAt: new Date(),
        rejectionReason: reason
      },
      { new: true }
    );
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    // Deactivate user account
    await User.findOneAndUpdate(
      { employeeId, email },
      { active: false }
    );

    // Send rejection email
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
      subject: "Employment Status Update",
      text: `Dear Employee,\n\nWe regret to inform you that your employment has been terminated.\n\nReason: ${reason}\n\nYour account has been deactivated.\n\nBest regards,\nHR Team`,
      replyTo: "no-reply@yourdomain.com",
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Employee rejected and account deactivated.", employee });
  } catch (error) {
    console.error("Reject employee error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
