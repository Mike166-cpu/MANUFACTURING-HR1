const LeaveBalance = require("../models/LeaveBalance");

// Create a new leave balance entry for an employee
exports.setLeaveBalance = async (req, res) => {
  try {
    const { employee_id, vacation_leave, sick_leave } = req.body;

    const existingLeaveBalance = await LeaveBalance.findOne({ employeeId });

    if (existingLeaveBalance) {
      return res.status(400).json({ message: "Leave balance already exists for this employee" });
    }

    const total_remaining_leaves = parseInt(vacation_leave, 10) + parseInt(sick_leave, 10);

    const newLeaveBalance = new LeaveBalance({
      employee_id,
      vacation_leave: parseInt(vacation_leave, 10),
      sick_leave: parseInt(sick_leave, 10),
      total_remaining_leaves,
    });

    await newLeaveBalance.save();
    res.status(201).json({ message: "Leave balance set successfully", newLeaveBalance });
  } catch (error) {
    res.status(500).json({ message: "Error setting leave balance", error: error.message });
  }
};


// Update leave balances for an employee
exports.updateLeaveBalance = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { vacation_leave, sick_leave } = req.body;

    const leaveBalance = await LeaveBalance.findOne({ employeeId});

    if (!leaveBalance) {
      return res.status(404).json({ message: "Leave balance not found" });
    }

    if (vacation_leave !== undefined) leaveBalance.vacation_leave = parseInt(vacation_leave, 10);
    if (sick_leave !== undefined) leaveBalance.sick_leave = parseInt(sick_leave, 10);

    // Recalculate total remaining leaves
    leaveBalance.total_remaining_leaves = leaveBalance.vacation_leave + leaveBalance.sick_leave;

    await leaveBalance.save();

    res.status(200).json({ message: "Leave balances updated successfully", leaveBalance });
  } catch (error) {
    res.status(500).json({ message: "Error updating leave balance", error: error.message });
  }
};


// Get leave balance for a specific employee
exports.getLeaveBalance = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const leaveBalance = await LeaveBalance.findOne({ employeeId: employee_id });

    if (!leaveBalance) {
      return res.status(404).json({ message: "Leave balance not found" });
    }

    res.status(200).json({ leaveBalance });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving leave balance", error: error.message });
  }
};

// Delete leave balance for a specific employee
exports.deleteLeaveBalance = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const result = await LeaveBalance.findOneAndDelete({ employeeId: employee_id });

    if (!result) {
      return res.status(404).json({ message: "Leave balance not found" });
    }

    res.status(200).json({ message: "Leave balance deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting leave balance", error: error.message });
  }
};