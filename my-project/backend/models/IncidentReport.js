const mongoose = require('mongoose');

const incidentReportSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  description: { type: String, required: true },
  status: { type: String, required: true },
});

// Specify the collection name as 'incidentReports'
const IncidentReport = mongoose.model('IncidentReport', incidentReportSchema, 'incidentReports');

module.exports = IncidentReport;
