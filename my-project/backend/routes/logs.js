const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const User = require('../models/User');

// Create new log entry
router.post('/user-logs', async (req, res) => {
    try {
      const { adminEmail } = req.body;

      console.log("📝 Received request to create a user log.");
      console.log("📧 Admin Email:", adminEmail);
  
      const admin = await User.findOne({ email: adminEmail });
  
      if (!admin) {
        console.warn("❌ No admin found with the provided email.");
        return res.status(400).json({ message: 'Invalid admin credentials' });
      }
  
      console.log("✅ Admin verified:", admin.email);
  
      const log = new Log(req.body);
      await log.save();
  
      console.log("📦 Log entry created:", log);
  
      res.status(201).json(log);
    } catch (error) {
      console.error("🔥 Error creating user log:", error);
      res.status(400).json({ message: error.message });
    }
  });
  

// Get all logs (superadmin only)
router.get("/user-logs", async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email });

    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const logs = await Log.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
