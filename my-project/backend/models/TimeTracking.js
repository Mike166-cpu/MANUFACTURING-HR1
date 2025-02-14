const mongoose = require('mongoose');

const timeTrackingSchema = new mongoose.Schema({
  employee_username: { type: String, required: true },
  employee_firstname: { type: String, require: true},
  employee_lastname: { type: String, require: true},
  profile_picture: { type: String, default: "" },
  time_in: { type: Date, required: true },
  time_out: { type: Date },
  total_hours: { type: String },
  attendance: { type: Boolean, default: true },
});

const TimeTracking = mongoose.model('TimeTracking', timeTrackingSchema);

module.exports = TimeTracking;
