const express = require('express');
const router = express.Router();
const obController = require('../controllers/obRequestController');

// Create new OB request
router.post('/request', obController.createOBRequest);

// Get all OB requests
router.get('/requests', obController.getAllOBRequests);

// Get OB requests by employee
router.get('/requests/:employee_id', obController.getEmployeeOBRequests);

// Update OB request status
router.patch('/request/:id/status', obController.updateOBRequestStatus);

// Fetch only manual entry for specific employee
router.get('/manual-entries/:employee_id', obController.getManualEntries);

module.exports = router;
