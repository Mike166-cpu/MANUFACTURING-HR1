const Leave = require("../models/Leave");
const LeaveBalance = require("../models/LeaveBalance");
const { v4: uuidv4 } = require("uuid");

// File a new leave request
exports.fileLeave = async (req, res) => {
  try {
    const {
      employee_id,
      employee_username,
      employee_firstname,
      employee_lastname,
      employee_department,
      leave_type,
      start_date,
      end_date,
      reason,
    } = req.body;

    // Calculate the number of leave days requested
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const leaveDays = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1; // Convert to days

    // Fetch leave balance for the employee
    const leaveBalance = await LeaveBalance.findOne({ employee_id });

    if (!leaveBalance) {
      return res.status(404).json({ message: "Leave balance not found" });
    }

    // Check if the employee has enough leave balance
    if (leave_type === "Vacation Leave") {
      if (leaveBalance.vacation_leave < leaveDays) {
        return res
          .status(400)
          .json({ message: "Insufficient vacation leave balance" });
      }
      leaveBalance.vacation_leave -= leaveDays; // Deduct vacation leave
    } else if (leave_type === "Sick Leave") {
      if (leaveBalance.sick_leave < leaveDays) {
        return res
          .status(400)
          .json({ message: "Insufficient sick leave balance" });
      }
      leaveBalance.sick_leave -= leaveDays; // Deduct sick leave
    } else {
      return res.status(400).json({ message: "Invalid leave type" });
    }

    // Recalculate total remaining leaves
    leaveBalance.total_remaining_leaves =
      leaveBalance.vacation_leave + leaveBalance.sick_leave;

    // Save updated leave balance
    await leaveBalance.save();

    // Create a new leave request
    const leave_id = uuidv4();
    const newLeave = new Leave({
      leave_id,
      employee_id,
      employee_username,
      employee_firstname,
      employee_lastname,
      employee_department,
      leave_type,
      start_date,
      end_date,
      reason,
      status: "Pending",
    });

    await newLeave.save();

    res.status(201).json({
      message: "Leave request submitted successfully",
      leave: newLeave,
      updatedLeaveBalance: leaveBalance,
    });
  } catch (error) {
    console.error("Error filing leave request:", error);
    res
      .status(500)
      .json({ message: "Error filing leave request", error: error.message });
  }
};

// Get all leave requests
exports.getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find();
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving leave requests",
      error: error.message,
    });
  }
};

// Get leave requests for a specific employee
exports.getEmployeeLeaves = async (req, res) => {
  try {
    const { id } = req.params;
    const leaves = await Leave.find({ employee_id: id });

    if (!leaves) {
      return res.status(404).json({ message: "No leave requests found" });
    }

    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving employee leaves",
      error: error.message,
    });
  }
};

exports.getLeaveByUsername = async (req, res) => {
  try {
    const { id } = req.params;
    const leaves = await Leave.find({ employee_id: id });
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch leaves for the employee",
      error: error.message,
    });
  }
};

//GET LEAVE REQUEST BY ID
exports.getLeaveById = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.find({ employee_id: id });

    if (!leave)
      return res.status(404).json({ message: "Leave request not found" });

    res.status(200).json(leave);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving leave request",
      error: error.message,
    });
  }
};

// Approve or reject leave
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status } = req.body; // Accepts "Approved" or "Rejected"

    const leave = await Leave.findOne({ leave_id: leaveId }); // Use findOne()
    if (!leave)
      return res.status(404).json({ message: "Leave request not found" });

    leave.status = status;
    await leave.save();

    res.status(200).json({
      message: `Leave request ${status.toLowerCase()} successfully`,
      leave,
    });
  } catch (error) {
    console.error("Error updating leave status:", error); // Log the error
    res
      .status(500)
      .json({ message: "Error updating leave status", error: error.message });
  }
};
