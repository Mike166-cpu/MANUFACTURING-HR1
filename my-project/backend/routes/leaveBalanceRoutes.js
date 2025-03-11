const express = require("express");
const router = express.Router();
const leaveBalanceController = require("../controllers/leaveBalanceController");

router.post("/set-leave-balance", leaveBalanceController.setLeaveBalance);
router.put("/update-leave-balance/:employee_id", leaveBalanceController.updateLeaveBalance);
router.get("/get-leave-balance/:employee_id", leaveBalanceController.getLeaveBalance);
router.delete("/delete-leave-balance/:employee_id", leaveBalanceController.deleteLeaveBalance);

module.exports = router;
