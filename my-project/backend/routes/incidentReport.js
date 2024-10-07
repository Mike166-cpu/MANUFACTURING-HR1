const express = require('express');
const router = express.Router();
const IncidentReport = require('../models/IncidentReport');

// @route GET /api/incidentreport
// @desc Get all incident reports
router.get('/', async (req, res) => {
  try {
    const incidents = await IncidentReport.find(); // Fetch all incident reports
    res.status(200).json(incidents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route POST /api/incidentreport
// @desc Submit a new incident report
router.post('/', async (req, res) => {
  const { date, description } = req.body; // Remove status from here

  try {
    // Set default status to 'Pending'
    const newIncidentReport = new IncidentReport({
      date,
      description,
      status: 'Pending', // Automatically set status to 'Pending'
    });

    await newIncidentReport.save();
    res.status(201).json({ message: 'Incident report submitted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', async (req, res) => {
  const { status } = req.body;

  try {
    const incident = await IncidentReport.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({ error: 'Incident report not found' });
    }

    res.status(200).json({ message: 'Incident report updated successfully!', incident });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
