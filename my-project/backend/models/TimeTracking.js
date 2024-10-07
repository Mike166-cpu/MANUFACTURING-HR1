const mongoose = require('mongoose');

const timeTrackingSchema = new mongoose.Schema({
  employee_username: { type: String, required: true },
  time_in: { type: Date, required: true },
  time_out: { type: Date },
  total_hours: { type: Number },
});

const TimeTracking = mongoose.model('TimeTracking', timeTrackingSchema);

module.exports = TimeTracking;
