const express = require("express");
const rateLimit = require("express-rate-limit");
const { loginUser, employeeLogin, verifyOtp, employeeFaceLogin, verifyFaceOnly } = require("../../controllers/loginController");
const {generateServiceToken} = require("../../middleware/gatewayTokenGenerator");
const router = express.Router();
const LoginData = require("../../models/LoginAccount");
const faceId = require("../faceId");

// Rate limiter for login attempts
// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: { status: 429, error: "Too many login attempts. Please try again after 15 minutes." },
// });

router.post("/verify-face", verifyFaceOnly)

router.get("/check-face-id/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const user = await LoginData.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const hasFaceId = Array.isArray(user.faceDescriptor) && user.faceDescriptor.length === 128;

    res.status(200).json({
      hasFaceId,
      lastUpdate: user.lastFaceUpdate || null
    });
  } catch (err) {
    console.error("Error checking face ID:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get ("/employee-data", async (req, res) => {
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
router.post("/", loginUser);
router.post("/userLogin", loginUser);

module.exports = router;