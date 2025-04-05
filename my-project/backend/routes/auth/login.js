const express = require("express");
const rateLimit = require("express-rate-limit");
const { loginUser, employeeLogin } = require("../../controllers/loginController");
const {generateServiceToken} = require("../../middleware/gatewayTokenGenerator");
const router = express.Router();
const LoginData = require("../../models/LoginAccount");

// Rate limiter for login attempts
// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: { status: 429, error: "Too many login attempts. Please try again after 15 minutes." },
// });

router.get ("/employee-data", async (req, res) => {
  try {
    const employeeData = await LoginData.find({});
    res.status(200).json(employeeData);
  } catch (error) {
    console.error("Error fetching employee data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.post("/emp-login", employeeLogin);
router.post("/", loginUser);
router.post("/userLogin", loginUser);

module.exports = router;