const Leave = require("../models/Leave");
const LeaveBalance = require("../models/LeaveBalance");
const { v4: uuidv4 } = require("uuid");
const { generateServiceToken } = require("../middleware/gatewayTokenGenerator");

// Add this helper function at the top
const hasActiveLeave = async (employeeId) => {
  const today = new Date();
  const activeLeave = await Leave.findOne({
    employeeId,
    status: "Approved",
    end_date: { $gte: today },
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
      endDate: activeLeave ? activeLeave.end_date.toLocaleDateString() : null,
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
      end_date: { $gte: today },
    });

    // Create a map of employee IDs to their leave status
    const leaveStatusMap = employees.reduce((acc, leave) => {
      acc[leave.employeeId] = {
        onLeave: true,
        leaveType: leave.leave_type,
        endDate: leave.end_date,
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

    const activeLeave = await hasActiveLeave(employeeId);
    if (activeLeave) {
      return res.status(400).json({
        message: `You have an active approved leave that ends on ${new Date(
          activeLeave.end_date
        ).toLocaleDateString()}`,
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const leaveDays = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;

    const leaveBalance = await LeaveBalance.findOne({ employeeId });
    if (!leaveBalance) {
      return res.status(404).json({ message: "Leave balance not found" });
    }

    let paid_days = 0;
    let unpaid_days = leaveDays;

    if (leave_type === "Vacation Leave") {
      paid_days = Math.min(leaveDays, leaveBalance.vacation_leave);
      unpaid_days = leaveDays - paid_days;
      leaveBalance.vacation_leave -= paid_days;
    } else if (leave_type === "Sick Leave") {
      paid_days = Math.min(leaveDays, leaveBalance.sick_leave);
      unpaid_days = leaveDays - paid_days;
      leaveBalance.sick_leave -= paid_days;
    } else if (leave_type === "Service Incentive Leave") {
      paid_days = Math.min(leaveDays, leaveBalance.service_incentive_leave);
      unpaid_days = leaveDays - paid_days;
      leaveBalance.service_incentive_leave -= paid_days;
    } else if (leave_type === "Bereavement Leave") {
      paid_days = Math.min(leaveDays, leaveBalance.bereavement_leave);
      unpaid_days = leaveDays - paid_days;
      leaveBalance.bereavement_leave -= paid_days;
    } else if (leave_type === "PWD Parental Leave") {
      paid_days = Math.min(leaveDays, leaveBalance.pwd_parental_leave);
      unpaid_days = leaveDays - paid_days;
      leaveBalance.pwd_parental_leave -= paid_days;
    } else if (leave_type === "Maternity Leave") {
      paid_days = Math.min(leaveDays, leaveBalance.maternity_leave);
      unpaid_days = leaveDays - paid_days;
      leaveBalance.maternity_leave -= paid_days;
    } else if (leave_type === "Paternity Leave") {
      paid_days = Math.min(leaveDays, leaveBalance.paternity_leave);
      unpaid_days = leaveDays - paid_days;
      leaveBalance.paternity_leave -= paid_days;
    } else if (leave_type === "Solo Parent Leave") {
      paid_days = Math.min(leaveDays, leaveBalance.solo_parent_leave);
      unpaid_days = leaveDays - paid_days;
      leaveBalance.solo_parent_leave -= paid_days;
    } else if (leave_type === "Special Leave for Women") {
      paid_days = Math.min(leaveDays, leaveBalance.special_leave_for_women);
      unpaid_days = leaveDays - paid_days;
      leaveBalance.special_leave_for_women -= paid_days;
    } else {
      unpaid_days = leaveDays;
      paid_days = 0;
    }

    let payment_status = "Unpaid";
    if (paid_days === 0) {
      payment_status = "Unpaid";
    } else if (paid_days > 0 && unpaid_days > 0) {
      payment_status = "Partially Paid";
    } else if (paid_days === leaveDays) {
      payment_status = "Paid";
    }

    leaveBalance.total_remaining_leaves =
      leaveBalance.vacation_leave +
      leaveBalance.sick_leave +
      leaveBalance.service_incentive_leave +
      leaveBalance.bereavement_leave +
      leaveBalance.pwd_parental_leave +
      leaveBalance.maternity_leave +
      leaveBalance.paternity_leave +
      leaveBalance.solo_parent_leave +
      leaveBalance.special_leave_for_women;

    await leaveBalance.save();

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const shortId = uuidv4().split("-")[0]; // Only take first segment of UUID
    const leave_id = `LV-${year}${month}${day}-${shortId}`;

    const newLeave = new Leave({
      leave_id: leave_id,
      employeeId,
      employee_name,
      employee_department,
      leave_type,
      start_date,
      end_date,
      reason,
      status: "Pending",
      days_requested: leaveDays,
      remaining_leaves: leaveBalance.total_remaining_leaves,
      paid_days,
      unpaid_days,
      payment_status,
    });

    await newLeave.save();

    global.io.emit("notification-admin", {
      message: `Employee requested a leave.`,
      employeeId: employeeId,
      leave_id: leave_id,
      dashboard: "admin",
    });

    res.status(201).json({
      message: "Leave request submitted successfully",
      leave: newLeave,
    });
  } catch (error) {
    console.error("Error filing leave request:", error);
    res.status(500).json({
      message: "Error filing leave request",
      error: error.message,
    });
  }
};

// Make sure updateLeaveStatus function properly deducts balance on approval
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status, updatedBy } = req.body;

    const leave = await Leave.findOne({ leave_id: leaveId });
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Calculate the actual number of days between dates
    const startDate = new Date(leave.start_date);
    const endDate = new Date(leave.end_date);
    const daysDifference =
      Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Validate maternity leave duration
    if (leave.leave_type === "Maternity Leave" && daysDifference > 105) {
      return res.status(400).json({
        message: `Requested leave duration (${daysDifference} days) exceeds maximum allowed maternity leave (105 days)`,
      });
    }

    const leaveBalance = await LeaveBalance.findOne({
      employeeId: leave.employeeId,
    });
    if (!leaveBalance) {
      return res.status(404).json({ message: "Leave balance not found" });
    }

    if (status === "Approved") {
      const balanceField = getBalanceField(leave.leave_type);

      // Special handling for maternity leave
      if (leave.leave_type === "Maternity Leave") {
        if (daysDifference <= 105) {
          leave.paid_days = daysDifference;
          leave.unpaid_days = 0;
          leave.payment_status = "Paid";
          leaveBalance.maternity_leave = Math.max(
            0,
            leaveBalance.maternity_leave - daysDifference
          );
        }
      } else {
        // Handle other leave types
        const availableBalance = leaveBalance[balanceField];
        if (daysDifference <= availableBalance) {
          leave.paid_days = daysDifference;
          leave.unpaid_days = 0;
          leave.payment_status = "Paid";
          leaveBalance[balanceField] -= daysDifference;
        } else {
          leave.paid_days = availableBalance;
          leave.unpaid_days = daysDifference - availableBalance;
          leave.payment_status =
            availableBalance > 0 ? "Partially Paid" : "Unpaid";
          leaveBalance[balanceField] = 0;
        }
      }

      await leaveBalance.save();
    }

    leave.status = status;
    leave.updated_by = updatedBy;
    leave.updated_at = new Date();
    await leave.save();

    res.status(200).json({
      message: `Leave request ${status.toLowerCase()} successfully`,
      leave,
      paymentDetails: {
        paidDays: leave.paid_days,
        unpaidDays: leave.unpaid_days,
        paymentStatus: leave.payment_status,
        totalDays: daysDifference,
      },
    });
  } catch (error) {
    console.error("Error updating leave status:", error);
    res.status(500).json({
      message: "Error updating leave status",
      error: error.message,
    });
  }
};

// 🧠 Helper function to map leave types to balance fields
function getBalanceField(leaveType) {
  const map = {
    "Vacation Leave": "vacation_leave",
    "Sick Leave": "sick_leave",
    "Service Incentive Leave": "service_incentive_leave",
    "Bereavement Leave": "bereavement_leave",
    "PWD Parental Leave": "pwd_parental_leave",
    "Maternity Leave": "maternity_leave",
    "Paternity Leave": "paternity_leave",
    "Solo Parent Leave": "solo_parent_leave",
    "Special Leave for Women": "special_leave_for_women",
  };
  return map[leaveType] || null;
}

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
    const leavesWithActiveStatus = leaves.map((leave) => ({
      ...leave.toObject(),
      isActive: isLeaveActive(leave),
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
        paid_days: 1,
        unpaid_days: 1,
        days_requested: 1,
        _id: 0,
      }
    );

    if (!approvedLeaves || approvedLeaves.length === 0) {
      return res.status(404).json({ message: "No approved leaves found" });
    }

    res.status(200).json({
      success: true,
      data: approvedLeaves,
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
