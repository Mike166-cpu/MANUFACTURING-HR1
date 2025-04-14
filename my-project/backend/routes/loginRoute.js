const express = require("express");
const router = express.Router();
const { loginUser, employeeLogin, verifyOtp, employeeFaceLogin } = require("../controllers/loginController");

// ...existing routes...
router.post("/face-login", employeeFaceLogin);

module.exports = router;
