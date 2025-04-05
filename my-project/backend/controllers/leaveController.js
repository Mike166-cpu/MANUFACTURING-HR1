const Leave = require("../models/Leave");
const LeaveBalance = require("../models/LeaveBalance");
const { v4: uuidv4 } = require("uuid");
const {generateServiceToken} = require('../middleware/gatewayTokenGenerator');

// Add this helper function at the top
const hasActiveLeave = async (employeeId) => {
  const today = new Date();
  const activeLeave = await Leave.findOne({
    employeeId,
    status: "Approved",
    end_date: { $gte: today }
  });
  return activeLeave;
};

// Add this helper function at the top
const isLeaveActive = (leave) => {
  const today = new Date();
  const endDate = new Date(leave.end_date);
  return leave.status === "Approved" && endDate >= today;
};

// Add this new endpoint
exports.checkActiveLeaves = async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date();
    
    const activeLeave = await Leave.findOne({
      employeeId: id,
      status: "Approved",
      end_date: { $gte: today },
    });

    res.json({
      hasActiveLeave: !!activeLeave,
      endDate: activeLeave ? activeLeave.end_date.toLocaleDateString() : null
    });
  } catch (error) {
    console.error("Error checking active leaves:", error);
    res.status(500).json({ message: "Error checking active leaves" });
  }
};

// Add this new endpoint
exports.getEmployeeLeaveStatus = async (req, res) => {
  try {
    const today = new Date();
    const employees = await Leave.find({
      status: "Approved",
      start_date: { $lte: today },
      end_date: { $gte: today }
    });

    // Create a map of employee IDs to their leave status
    const leaveStatusMap = employees.reduce((acc, leave) => {
      acc[leave.employeeId] = {
        onLeave: true,
        leaveType: leave.leave_type,
        endDate: leave.end_date
      };
      return acc;
    }, {});

    res.json({ leaveStatusMap });
  } catch (error) {
    console.error("Error fetching employee leave status:", error);
    res.status(500).json({ message: "Error fetching employee leave status" });
  }
};

// Modify the fileLeave function
exports.fileLeave = async (req, res) => {
  try {
    const {
      employeeId,
      employee_name,
      employee_department,
      leave_type,
      start_date,
      end_date,
      reason,
    } = req.body;

    // Check for active approved leaves
    const activeLeave = await hasActiveLeave(employeeId);
    if (activeLeave) {
      return res.status(400).json({
        message: `You have an active approved leave that ends on ${new Date(activeLeave.end_date).toLocaleDateString()}`
      });
    }

    // Calculate days
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const leaveDays = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;

    // Only check if balance exists and is sufficient (without deducting)
    const leaveBalance = await LeaveBalance.findOne({ employeeId });
    if (!leaveBalance) {
      return res.status(404).json({ message: "Leave balance not found" });
    }

    // Just check if there's enough balance
    if (leave_type === "Vacation Leave" && leaveBalance.vacation_leave < leaveDays) {
      return res.status(400).json({ message: "Insufficient vacation leave balance" });
    } else if (leave_type === "Sick Leave" && leaveBalance.sick_leave < leaveDays) {
      return res.status(400).json({ message: "Insufficient sick leave balance" });
    }

    // Create leave request
    const leave_id = uuidv4();
    const newLeave = new Leave({
      leave_id,
      employeeId,
      employee_name,
      employee_department,
      leave_type,
      start_date,
      end_date,
      reason,
      status: "Pending",
      days_requested: leaveDays
    });

    await newLeave.save();

    // Notify admin
    global.io.emit('notification-admin', {
      message: `Employee requested a leave.`,
      employeeId,
      leave_id,
      dashboard: "admin"
    });

    res.status(201).json({
      message: "Leave request submitted successfully",
      leave: newLeave
    });
  } catch (error) {
    console.error("Error filing leave request:", error);
    res.status(500).json({ message: "Error filing leave request", error: error.message });
  }
};

// Make sure updateLeaveStatus function properly deducts balance on approval
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status } = req.body;

    const leave = await Leave.findOne({ leave_id: leaveId });
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Only deduct balance if the status is being set to "Approved"
    if (status === "Approved") {
      const leaveBalance = await LeaveBalance.findOne({ employeeId: leave.employeeId });
      if (!leaveBalance) {
        return res.status(404).json({ message: "Leave balance not found" });
      }

      // Check current balance before deducting
      if (leave.leave_type === "Vacation Leave") {
        if (leaveBalance.vacation_leave < leave.days_requested) {
          return res.status(400).json({ message: "Insufficient vacation leave balance" });
        }
        leaveBalance.vacation_leave -= leave.days_requested;
      } else if (leave.leave_type === "Sick Leave") {
        if (leaveBalance.sick_leave < leave.days_requested) {
          return res.status(400).json({ message: "Insufficient sick leave balance" });
        }
        leaveBalance.sick_leave -= leave.days_requested;
      }

      // Update total remaining leaves
      leaveBalance.total_remaining_leaves = leaveBalance.vacation_leave + leaveBalance.sick_leave;
      await leaveBalance.save();
    }

    // Update leave status
    leave.status = status;
    await leave.save();

    // Notify employee
    if (global.io) {
      global.io.emit("notification-employee", {
        message: `Your leave request has been ${status.toLowerCase()}`,
        // employee_id: leave.employee_id,
        request_id: leaveId,
        type: "leave_status_update",
        status: status
      });
    }

    res.status(200).json({
      message: `Leave request ${status.toLowerCase()} successfully`,
      leave
    });
  } catch (error) {
    console.error("Error updating leave status:", error);
    res.status(500).json({ message: "Error updating leave status", error: error.message });
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
    const leaves = await Leave.find({ employeeId: id });

    if (!leaves) {
      return res.status(404).json({ message: "No leave requests found" });
    }

    // Add isActive field to each leave
    const leavesWithActiveStatus = leaves.map(leave => ({
      ...leave.toObject(),
      isActive: isLeaveActive(leave)
    }));

    res.status(200).json(leavesWithActiveStatus);
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
    const leaves = await Leave.find({ employeeId: id });
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
    const leave = await Leave.find({ employeeId: id });

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

exports.getApprovedLeaves = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const approvedLeaves = await Leave.find(
      { status: "Approved" },
      {
        leave_id: 1,
        employeeId: 1,
        employee_firstname: 1,
        employee_lastname: 1,
        employee_department: 1,
        leave_type: 1,
        start_date: 1,
        end_date: 1,
        reason: 1,
        status: 1,
        _id: 0
      }
    );
    
    if (!approvedLeaves || approvedLeaves.length === 0) {
      return res.status(404).json({ message: "No approved leaves found" });
    }

    res.status(200).json({
      success: true,
      data: approvedLeaves
    });
  } catch (error) {
    console.error("Error retrieving approved leaves:", error);
    res.status(500).json({
      message: "Error retrieving approved leave requests",
      error: error.message,
    });
  }
};


// GET LEAVE STATUS FOR EMPLOYEE DASHBOARD
exports.getLatestLeaveRequest = async (req, res) => {
  try {
    const { employee_id } = req.params;

    if (!employee_id) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const latestLeave = await Leave.findOne({ employeeId })
      .sort({ start_date: -1 }) 
      .limit(1); 

    if (!latestLeave) {
      return res.status(404).json({ message: "No leave request found." });
    }

    res.json({
      leave_id: latestLeave.leave_id,
      leave_type: latestLeave.leave_type,
      start_date: latestLeave.start_date,
      end_date: latestLeave.end_date,
      status: latestLeave.status,
    });

  } catch (error) {
    console.error("Error fetching latest leave request:", error);
    res.status(500).json({ message: "Failed to fetch leave request" });
  }
};
