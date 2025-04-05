const express = require("express");
const Resignation = require("../models/ResignationModel");

const router = express.Router();

// Submit a Resignation Request
router.post("/submit", async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      department,
      lastWorkingDay,
      reason,
      message,
    } = req.body;

    // Check if the employee already has a pending resignation request
    const existingRequest = await Resignation.findOne({
      employeeId,
      status: { $in: ["Pending"] }, // Only check for "Pending" requests
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ error: "You already have a pending resignation request." });
    }

    // Create a new resignation request
    const newResignation = new Resignation({
      employeeName,
      employeeId,
      department,
      lastWorkingDay,
      reason,
      message,
      status: "Pending",
    });

    await newResignation.save();
    res.status(201).json({ message: "Resignation submitted successfully!" });
  } catch (error) {
    console.error("Error submitting resignation:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// Get All Resignation Requests
router.get("/", async (req, res) => {
  try {
    const resignations = await Resignation.find();
    res.json(resignations);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get Resignation Request by Employee ID
router.get("/:employeeId", async (req, res) => {
  try {
    const resignation = await Resignation.findOne({
      employeeId: req.params.employeeId,
    });
    if (!resignation) {
      return res
        .status(404)
        .json({ message: "Resignation request not found!" });
    }
    res.json(resignation);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update Resignation Status (Approve/Reject)
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body; // Expected values: Approved, Rejected
    const resignation = await Resignation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!resignation) {
      return res
        .status(404)
        .json({ message: "Resignation request not found!" });
    }

    res.json({ message: `Resignation request ${status}`, resignation });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// RESIGNATION STATUS
router.get("/status/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Find the latest resignation request for the employee
    const resignation = await Resignation.findOne({ employeeId }).sort({
      createdAt: -1,
    });

    if (!resignation) {
      return res.status(404).json({ message: "No resignation request found." });
    }

    res.json({ status: resignation.status });
  } catch (error) {
    console.error("Error fetching resignation status:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

router.put("/update-status/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status update." });
    }

    const updatedResignation = await Resignation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedResignation) {
      return res.status(404).json({ error: "Resignation request not found." });
    }

    res.json({
      message: `Resignation ${status.toLowerCase()} successfully!`,
      updatedResignation,
    });
  } catch (error) {
    console.error("Error updating resignation status:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

router.get("/employee/:employeeId", async (req, res) => {
    try {
      const { employeeId } = req.params;
  
      const pendingResignation = await Resignation.findOne({
        employeeId,
        status: "Pending",
      });
  
      if (pendingResignation) {
        return res.json({ pending: true });
      }
  
      res.json({ pending: false });
    } catch (error) {
      console.error("Error checking resignation status:", error);
      res.status(500).json({ error: "Server error. Please try again later." });
    }
  });
  

module.exports = router;
