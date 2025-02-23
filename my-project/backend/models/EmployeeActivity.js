const mongoose = require('mongoose');

const employeeActivitySchema = new mongoose.Schema({
  isOnline: { type: Boolean, default: false },
  lastLogin: { type: Date },
  lastActive: { type: Date }
}, { discriminatorKey: 'kind' });

// This will add these fields to the existing Employee collection
const EmployeeActivity = mongoose.model('Employee').discriminator(
  'EmployeeActivity',
  employeeActivitySchema
);

module.exports = EmployeeActivity;
