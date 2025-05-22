const mongoose = require("mongoose");

const LeaveBalanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },

  vacation_leave: { type: Number, default: 15 }, 
  sick_leave: { type: Number, default: 10 }, 
  service_incentive_leave: { type: Number, default: 5 }, 

  maternity_leave: { type: Number, default: 105 }, 
  paternity_leave: { type: Number, default: 7 }, 
  solo_parent_leave: { type: Number, default: 7 }, 
  special_leave_for_women: { type: Number, default: 0 }, 
  bereavement_leave: { type: Number, default: 5 }, 
  pwd_parental_leave: { type: Number, default: 7 }, 

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
