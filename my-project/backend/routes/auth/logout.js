const express = require("express");
const router = express.Router();
const authController = require("../../controllers/authController");

router.post("/logout", authController.logoutEmployee);

module.exports = router;