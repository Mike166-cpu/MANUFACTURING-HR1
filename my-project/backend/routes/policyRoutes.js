const express = require("express");
const router = express.Router();
const Policy = require("../models/Policy");
const Acknowledgement = require("../models/Acknowledgement");

// Route: Create a new policy
router.post("/create", async (req, res) => {
  const { title, description } = req.body;

  try {
    const newPolicy = new Policy({
      title,
      description,
    });

    await newPolicy.save();
    res
      .status(201)
      .json({ message: "Policy created successfully", policy: newPolicy });
  } catch (error) {
    res.status(500).json({ message: "Error creating policy", error });
  }
});

// Route: Fetch all policies
router.get("/fetch", async (req, res) => {
  try {
    const policies = await Policy.find();
    res.status(200).json(policies);
  } catch (error) {
    res.status(500).json({ message: "Error fetching policies", error });
  }
});

// Route: Update a policy by ID
router.put("/update/:id", async (req, res) => {
  const { title, description } = req.body;
  const { id } = req.params;

  try {
    const updatedPolicy = await Policy.findByIdAndUpdate(
      id,
      { title, description },
      { new: true } // Return the updated policy
    );
    res
      .status(200)
      .json({ message: "Policy updated successfully", policy: updatedPolicy });
  } catch (error) {
    res.status(500).json({ message: "Error updating policy", error });
  }
});

// Route: Delete a policy by ID
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await Policy.findByIdAndDelete(id);
    res.status(200).json({ message: "Policy deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting policy", error });
  }
});

router.post("/acknowledge/:id", async (req, res) => {
  const { id } = req.params; // policy ID
  const employee_username = req.body.employee_username;

  try {
    // Check if the acknowledgment already exists
    const existingAcknowledgement = await Acknowledgement.findOne({
      employee_username,
      policy_id: id,
    });

    if (existingAcknowledgement) {
      return res.status(400).json({ message: "Policy already acknowledged." });
    }

    // Create a new acknowledgment
    const newAcknowledgement = new Acknowledgement({
      employee_username,
      policy_id: id,
    });

    await newAcknowledgement.save();
    res.status(201).json({ message: "Policy acknowledged successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error acknowledging policy.", error });
  }
});

router.get("/acknowledged/:username", async (req, res) => {
    try {
      const { username } = req.params;
      
      // Fetch acknowledged policies for the user
      const acknowledgedPolicies = await Acknowledgement.find({
        employee_username: username,
      });
  
      res.status(200).json(acknowledgedPolicies);
    } catch (error) {
      res.status(500).json({ message: "Error fetching acknowledged policies", error });
    }
  });
  

module.exports = router;
