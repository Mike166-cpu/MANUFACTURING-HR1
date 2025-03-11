const mongoose = require("mongoose");

const employeeScheduleSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee", // References Employee model
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  Hr: {
    type: Number,
    required: true,
  },
  days: {
    type: [String],
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("EmployeeSchedule", employeeScheduleSchema);
