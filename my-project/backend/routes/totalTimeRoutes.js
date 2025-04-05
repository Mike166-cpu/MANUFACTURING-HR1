const express = require('express');
const router = express.Router();
const totalTimeController = require('../controllers/totalTimeController');
const authenticateToken = require("../middleware/dataMiddlewareToken");

// Get time tracking entries by employee ID
router.get('/employee/:employee_id', totalTimeController.getTimeTrackingEntriesByEmployeeId);

// Approve time tracking entry
router.put('/approve/:id', totalTimeController.approveTimeTrackingEntry);

// Other routes
router.post('/start', totalTimeController.startTimeTracking);
router.put('/:id', totalTimeController.updateTimeTrackingEntry);
router.get('/', authenticateToken, totalTimeController.getAllTimeTrackingEntries);

module.exports = router;
