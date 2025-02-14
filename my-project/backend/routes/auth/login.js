const express = require("express");
const rateLimit = require("express-rate-limit");
const { loginUser } = require("../../controllers/loginController");

const router = express.Router();

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { status: 429, error: "Too many login attempts. Please try again after 15 minutes." },
});

router.post("/", loginLimiter, loginUser);
router.post("/userLogin", loginLimiter, loginUser);

module.exports = router;