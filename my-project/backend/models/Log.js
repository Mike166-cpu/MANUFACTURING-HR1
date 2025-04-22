const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  adminEmail: { type: String, required: true },
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: String }
});

module.exports = mongoose.model('Log', LogSchema);
