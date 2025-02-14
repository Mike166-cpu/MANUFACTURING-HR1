const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const Employee = require("../models/Employee");

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profile-pictures"); // Folder for profile pictures
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Multer middleware
const upload = multer({ storage });

// Route to upload profile picture
router.post(
  "/upload-profile-picture",
  upload.single("profile_picture"),
  async (req, res) => {
    const { employeeId, username } = req.body; // Access both employeeId and username

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = `/uploads/profile-pictures/${req.file.filename}`;

    try {
      // Update the profile picture field in the database using the employeeId
      const updatedEmployee = await Employee.findOneAndUpdate(
        { employee_id: employeeId }, // Use the employeeId from the request body
        { profile_picture: filePath },
        { new: true }
      );

      if (!updatedEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.status(200).json({
        message: "Profile picture updated successfully",
        profilePicture: updatedEmployee.profile_picture,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating profile picture" });
    }
  }
);

// Backend Route to Fetch Profile Picture
router.get("/profile-picture", async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    console.log(`Fetching profile for employeeId: ${employeeId}`); // Log employeeId

    const user = await Employee.findOne({ employee_id: employeeId });
    if (!user || !user.profile_picture) {
      return res.status(404).json({ message: "Profile picture not found" });
    }

    const profilePicturePath = `${req.protocol}://${req.get("host")}${
      user.profile_picture
    }`;
    console.log(`Returning profile picture: ${profilePicturePath}`); // Log profile picture path

    res.json({ profilePicture: profilePicturePath });
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    res.status(500).json({ message: "Error fetching profile picture" });
  }
});

module.exports = router;
