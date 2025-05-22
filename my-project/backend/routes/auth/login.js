const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  loginUser,
  employeeLogin,
  verifyOtp,
  employeeFaceLogin,
  verifyFaceOnly,
  verifyOtpEmployee,
} = require("../../controllers/loginController");
const {
  generateServiceToken,
} = require("../../middleware/gatewayTokenGenerator");
const router = express.Router();
const LoginData = require("../../models/LoginAccount");
const faceId = require("../faceId");
const User = require("../../models/User");
const bcrypt = require("bcryptjs");

const Employee = require("../../models/Employee");
// Rate limiter for login attempts
// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: { status: 429, error: "Too many login attempts. Please try again after 15 minutes." },
// });

const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

// Setup 2FA endpoint
router.post("/2fa/setup", async (req, res) => {
  const { userId } = req.body;
  console.log("2FA Setup Requested for employeeId:", userId); // Debug log

  try {
    // 🔍 STEP 1: Find the user using employeeId
    const user = await User.findOne({ employeeId: userId });
    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // 🔍 STEP 2: Generate the secret
    const secret = speakeasy.generateSecret({
      name: `JJM Manufacturing (${user.email})`,
    });
    console.log("🔐 Secret generated:", secret);

    // 🔍 STEP 3: Save the secret
    user.twoFactorSecret = secret.base32;
    await user.save();
    console.log("✅ Secret saved to user");

    // 🔍 STEP 4: Generate QR code
    const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url);
    console.log("🧾 QR Code generated");

    return res.status(200).json({
      qrCode: qrCodeDataURL,
      manualCode: secret.base32,
    });
  } catch (err) {
    console.error("🔥 2FA Setup Error:", err); // Catch the full error
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
});

router.post("/2fa/verify", async (req, res) => {
  const { userId, token } = req.body;
  console.log("Verifying 2FA for user:", userId, "with token:", token); // Debug log

  try {
    const user = await User.findOne({ employeeId: userId });

    // Validate user and secret
    if (!user) {
      console.log("User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.twoFactorSecret) {
      console.log("No 2FA secret found for user:", userId);
      return res.status(400).json({ message: "2FA setup not initialized" });
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token.toString(), // Ensure token is string
      window: 2, // Allow 30 seconds window before/after
    });

    console.log("Token verification result:", verified); // Debug log

    if (!verified) {
      return res.status(400).json({ message: "Invalid 2FA token" });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();

    return res.status(200).json({ message: "2FA successfully enabled" });
  } catch (err) {
    console.error("2FA Verification Error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

router.post("/2fa/disable", async (req, res) => {
  const { userId, token } = req.body;

  try {
    await User.findOne({ employeeId: userId });
    if (!userId || !userId.twoFactorEnabled) {
      222;
      return res.status(400).json({ message: "2FA is not enabled" });
    }

    const verified = speakeasy.totp.verify({
      secret: userId.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid 2FA token" });
    }

    userId.twoFactorEnabled = false;
    userId.twoFactorSecret = undefined;
    await user.save();

    return res.status(200).json({ message: "2FA has been disabled" });
  } catch (err) {
    console.error("Disable 2FA Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/2fa/status/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ employeeId: req.params.userId });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      enabled: user.twoFactorEnabled,
      isSetup: !!user.twoFactorSecret
    });
  } catch (err) {
    console.error("2FA Status Check Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/status/:id", async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        status,
        $push: {
          statusHistory: {
            status,
            remarks,
            updatedAt: new Date(),
            updatedBy: req.user?._id,
          },
        },
      },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/verify-password", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    res.json({ success: isMatch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/verify-face", verifyFaceOnly);

router.get("/check-face-id/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const user = await LoginData.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const hasFaceId =
      Array.isArray(user.faceDescriptor) && user.faceDescriptor.length === 128;

    res.status(200).json({
      hasFaceId,
      lastUpdate: user.lastFaceUpdate || null,
    });
  } catch (err) {
    console.error("Error checking face ID:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/employee-data", async (req, res) => {
  try {
    const employeeData = await LoginData.find({});
    res.status(200).json(employeeData);
  } catch (error) {
    console.error("Error fetching employee data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.post("/verify-otp", verifyOtp);
router.post("/face-login", employeeFaceLogin);

router.post("/emp-login", employeeLogin);
router.post("/verify-otp-employee", verifyOtpEmployee);

router.post("/", loginUser);
router.post("/userLogin", loginUser);

module.exports = router;
