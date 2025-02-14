const mongoose = require("mongoose");

const totalTimeSchema = new mongoose.Schema({
  employee_username: { type: String, required: true,
  },
  employee_id: {
    type: String,
    required: true, 
  },
  time_in: {
    type: Date,
    required: true,
  },
  time_out: {
    type: Date,
  },
  work_duration: {
    type: String, // Store in seconds
  },
  break_start: {
    type: Date,
  },
  break_end: {
    type: Date,
  },
  break_duration: {
    type: Number, // Store in seconds
    default: 0,
  },
  is_on_break: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  label: {
    type: String,
    default: "Work",
  },
});

module.exports = mongoose.model("TotalTime", totalTimeSchema);
