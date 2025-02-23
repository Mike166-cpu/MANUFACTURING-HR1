const mongoose = require("mongoose");

const LeaveBalanceSchema = new mongoose.Schema({
  employee_id: { type: String, required: true, unique: true },
  vacation_leave: { type: Number, default: 0 }, 
  sick_leave: { type: Number, default: 0 },
  total_remaining_leaves: {
    type: Number,
    default: function () {
      return this.vacation_leave + this.sick_leave;
    },
  },
});

module.exports = mongoose.model("LeaveBalance", LeaveBalanceSchema);
