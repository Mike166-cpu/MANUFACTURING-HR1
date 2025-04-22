const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");

// Update the base route to match frontend
router.get("/employees", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:employeeId", async (req, res) => {
   try {
     const { employeeId } = req.params;
 
     const employee = await Employee.findOne({ employeeId });
 
     if (!employee) {
       return res.status(404).json({ message: "Employee not found" });
     }
 
     res.status(200).json(employee);
   } catch (error) {
     console.error("Error fetching employee:", error);
     res.status(500).json({ message: "Server error" });
   }
});


//EMPLOYEE DASHBOARD UPDATE THEIR OWN PROFILE
router.put("/update-profile-picture/:employeeId", async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { profile_picture } = req.body;
  
      if (!profile_picture) {
        return res
          .status(400)
          .json({ message: "Profile picture URL is required" });
      }
  
      const updatedEmployee = await Employee.findOneAndUpdate(
        { employeeId: employeeId },  
        { profilePicture: profile_picture },
        { new: true }
      );
  
      if (!updatedEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
  
      res.status(200).json({
        message: "Profile picture updated successfully",
        profilePicture: updatedEmployee.profilePicture,
      });
    } catch (err) {
      console.error("Error updating profile picture:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

router.put("/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const updateData = req.body;

    const employee = await Employee.findOneAndUpdate(
      { employeeId: employeeId },
      updateData,
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:employeeId/position", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { position } = req.body;

    const employee = await Employee.findOneAndUpdate(
      { employeeId },
      { position },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error("Error updating employee position:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
