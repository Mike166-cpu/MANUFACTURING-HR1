const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leaveController");

// Route for filing a leave request
router.post("/file-leave", leaveController.fileLeave);
router.get("/get-user-leave/:id", leaveController.getLeaveById); 
router.get("/get-employees-leave", leaveController.getAllLeaves);
router.put("/update-leave-status/:leaveId", leaveController.updateLeaveStatus); // Ensure this route is cor
router.get("/get-employee-leaves/:id", leaveController.getEmployeeLeaves); 

module.exports = router;
