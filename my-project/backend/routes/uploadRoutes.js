const express = require("express");
const multer = require("multer");
const path = require("path");
const Document = require("../models/Document");
const Employee = require("../models/Employee"); 

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

router.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// UPLOAD ROUTES //

router.post("/upload", upload.array("documents", 10), async (req, res) => {
  try {
    const uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      path: file.path,
      uploadedBy: req.body.employeeId || "Unknown User",
      employeeName: req.body.employeeFirstName || "Unknown User",
    }));

    await Document.insertMany(uploadedFiles);

    res
      .status(200)
      .json({ message: "Files uploaded successfully!", files: uploadedFiles });
  } catch (error) {
    console.error("Failed to save file data:", error);
    res.status(500).json({ message: "Failed to upload files.", error });
  }
});

// FETCH DATA //

router.get("/documents", async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required." });
    }

    const documents = await Document.find({ uploadedBy: employeeId });
    res.status(200).json(documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching documents" });
  }
});

// FETCH ALL EMPLOYEES
router.get("/employees", async (req, res) => {
  try {
    const employees = await Employee.find({}, "employeeId employeeName"); // Return specific fields only
    res.status(200).json(employees); // Ensure this is an array
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Failed to fetch employees." });
  }
});

module.exports = router;
