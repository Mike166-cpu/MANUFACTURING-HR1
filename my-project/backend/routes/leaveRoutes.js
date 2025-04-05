const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const leaveController = require("../controllers/leaveController");
const {trainLeaveModel} = require("../services/predictiveAnalytics")

const tokenVerify = (req, res, next) => {
  const token = req.header("Authorization").replace("Bearer ", "");
  if (!token)
    return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.GATEWAY_SERVICE_TOKEN);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

router.post("/file-leave", leaveController.fileLeave);
router.get("/get-user-leave/:id", leaveController.getLeaveById);
router.get("/get-employees-leave", leaveController.getAllLeaves);
router.put("/update-leave-status/:leaveId", leaveController.updateLeaveStatus); 
router.get("/get-employee-leaves/:id", leaveController.getEmployeeLeaves);
router.get("/get-approved-leaves",tokenVerify,leaveController.getApprovedLeaves);
router.get('/check-active-leaves/:id', leaveController.checkActiveLeaves);
router.get('/employee-leave-status', leaveController.getEmployeeLeaveStatus);
router.get("/latest-leave/:employee_id", leaveController.getLatestLeaveRequest);


module.exports = router;
