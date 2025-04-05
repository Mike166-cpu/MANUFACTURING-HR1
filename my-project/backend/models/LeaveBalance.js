const mongoose = require("mongoose");

const LeaveBalanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },

  // Standard Leaves
  vacation_leave: { type: Number, default: 15 }, 
  sick_leave: { type: Number, default: 10 }, 
  service_incentive_leave: { type: Number, default: 5 }, 

  // Special Leaves
  maternity_leave: { type: Number, default: 0 }, // 105 days (if applicable)
  paternity_leave: { type: Number, default: 0 }, // 7 days (if applicable)
  solo_parent_leave: { type: Number, default: 0 }, // 7 days (if applicable)
  special_leave_for_women: { type: Number, default: 0 }, // 60 days (if applicable)
  bereavement_leave: { type: Number, default: 5 }, // Common practice: 3-5 days
  pwd_parental_leave: { type: Number, default: 7 }, // 7 days (if applicable)

  // Total Leave Calculation
  total_remaining_leaves: {
    type: Number,
    default: function () {
      return (
        this.vacation_leave +
        this.sick_leave +
        this.service_incentive_leave +
        this.bereavement_leave +
        this.pwd_parental_leave +
        this.maternity_leave +
        this.paternity_leave +
        this.solo_parent_leave +
        this.special_leave_for_women
      );
    },
  },
}, { timestamps: true });

module.exports = mongoose.model("LeaveBalance", LeaveBalanceSchema);
