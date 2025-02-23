const express = require("express");
const router = express.Router();
const totalTimeController = require("../controllers/totalTimeController");

// Define routes and map them to controller functions
router.post("/time-tracking", totalTimeController.createTimeTrackingEntry);
router.get("/time-tracking", totalTimeController.getAllTimeTrackingEntries);
router.get("/time-tracking/:username", totalTimeController.getTimeTrackingEntriesByUsername);
router.put("/time-tracking/:id", totalTimeController.updateTimeTrackingEntry);
router.post("/time-tracking/start", totalTimeController.startTimeTracking);
router.put("/update-break/:id", totalTimeController.updateBreakDuration);
router.post("/time-tracking/pause", totalTimeController.pauseTimeTracking);
router.post("/time-tracking/resume", totalTimeController.resumeTimeTracking);


module.exports = router;
