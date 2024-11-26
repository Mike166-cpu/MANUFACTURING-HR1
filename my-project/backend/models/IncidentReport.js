const mongoose = require('mongoose');

const incidentReportSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  status: { type: String, required: true },
  employeeUsername: { type: String, required: true },
  location: { type: String, required: true },
  reportType: { type: String, required: true }, 
  archived: { type: Boolean, default: false }, 
});

const IncidentReport = mongoose.model('IncidentReport', incidentReportSchema, 'incidentReports');

module.exports = IncidentReport;
