const LeaveBalance = require("../models/LeaveBalance");
const Employee = require("../models/Employee");
const cron = require("node-cron");

// Default Leave Balances (Non-Government, Philippines)
const DEFAULT_VACATION_LEAVE = 15; // Common practice
const DEFAULT_SICK_LEAVE = 10;
const SERVICE_INCENTIVE_LEAVE = 5;
const MATERNITY_LEAVE = 105;
const PATERNITY_LEAVE = 7;
const SOLO_PARENT_LEAVE = 7;
const SPECIAL_LEAVE_FOR_WOMEN = 60;
const BEREAVEMENT_LEAVE = 5;
const PWD_PARENTAL_LEAVE = 7;

const initializeLeaveBalances = async () => {
  try {
    const employees = await Employee.find({});

    for (const employee of employees) {
      const existingLeaveBalance = await LeaveBalance.findOne({
        employeeId: employee.employeeId,
      });

      if (!existingLeaveBalance) {
        const total_remaining_leaves =
          DEFAULT_VACATION_LEAVE +
          DEFAULT_SICK_LEAVE +
          SERVICE_INCENTIVE_LEAVE +
          BEREAVEMENT_LEAVE +
          PWD_PARENTAL_LEAVE +
          (employee.gender === "Female" ? MATERNITY_LEAVE + SPECIAL_LEAVE_FOR_WOMEN : 0) +
          (employee.gender === "Male" ? PATERNITY_LEAVE : 0) +
          (employee.civilStatus === "Solo Parent" ? SOLO_PARENT_LEAVE : 0);

        const newLeaveBalance = new LeaveBalance({
          employeeId: employee.employeeId,
          vacation_leave: DEFAULT_VACATION_LEAVE,
          sick_leave: DEFAULT_SICK_LEAVE,
          service_incentive_leave: SERVICE_INCENTIVE_LEAVE,
          maternity_leave: employee.gender === "Female" ? MATERNITY_LEAVE : 0,
          paternity_leave: employee.gender === "Male" ? PATERNITY_LEAVE : 0,
          solo_parent_leave: employee.civilStatus === "Solo Parent" ? SOLO_PARENT_LEAVE : 0,
          special_leave_for_women: employee.gender === "Female" ? SPECIAL_LEAVE_FOR_WOMEN : 0,
          bereavement_leave: BEREAVEMENT_LEAVE,
          pwd_parental_leave: PWD_PARENTAL_LEAVE,
          total_remaining_leaves,
        });

        await newLeaveBalance.save();
        console.log(`✅ Leave balance initialized for employee: ${employee.fullname} (ID: ${employee.employeeId})`);
      }
    }
  } catch (error) {
    console.error("❌ Error initializing leave balances:", error);
  }
};

const cronjob = () => {
  cron.schedule("0 0 1 1 *", async () => {
    console.log("🔄 Running yearly leave balance reset...");
    await initializeLeaveBalances();
    console.log("✅ Leave balances updated for the new year.");
  });

  console.log("✅ Yearly leave balance cron job scheduled.");
};

module.exports = { initializeLeaveBalances, cronjob };
