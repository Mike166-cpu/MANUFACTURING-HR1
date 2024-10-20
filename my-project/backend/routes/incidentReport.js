const express = require('express');
const router = express.Router();
const IncidentReport = require('../models/IncidentReport');

// Fetch all incident reports
router.get('/', async (req, res) => {
  try {
    const incidents = await IncidentReport.find();
    res.status(200).json(incidents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Fetch incident reports by status
router.get('/status/:status', async (req, res) => {
  const { status } = req.params;

  try {
    const incidents = await IncidentReport.find({ status: status });
    res.status(200).json(incidents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new incident report
router.post('/', async (req, res) => {
  const { date, description, location, reportType, employeeUsername } = req.body;

  try {
    const newIncidentReport = new IncidentReport({
      date,
      description,
      location,
      reportType,
      status: 'Pending',
      employeeUsername,
    });

    await newIncidentReport.save();
    res.status(201).json({ message: 'Incident report submitted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update incident report status
router.patch('/:id', async (req, res) => {
  const { status } = req.body;

  try {
    const incident = await IncidentReport.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!incident) {
      return res.status(404).json({ error: 'Incident report not found' });
    }

    res.status(200).json({ message: 'Incident report updated successfully!', incident });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Fetch incident reports by employee username
router.get('/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const userReports = await IncidentReport.find({ employeeUsername: username });
    res.status(200).json(userReports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Archive incident report
router.put('/archive/:id', async (req, res) => {
  try {
    const incident = await IncidentReport.findByIdAndUpdate(req.params.id, { archived: true }, { new: true });

    if (!incident) {
      return res.status(404).json({ error: 'Incident report not found' });
    }

    res.status(200).json({ message: 'Incident report archived successfully!', incident });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
