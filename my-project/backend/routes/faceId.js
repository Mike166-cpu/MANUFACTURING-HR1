// routes/faceId.js
const router = require("express").Router();
const EmployeeLoginAccount = require("../models/LoginAccount");

router.post("/register-face-id", async (req, res) => {
  try {
    const { email, descriptor } = req.body;

    if (!email || !descriptor) {
      return res.status(400).json({ 
        error: "Email and face descriptor are required" 
      });
    }

    if (!Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.status(400).json({ 
        error: "Invalid face descriptor format" 
      });
    }

    const user = await EmployeeLoginAccount.findOneAndUpdate(
      { email },
      { 
        faceDescriptor: descriptor,
        lastFaceUpdate: new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        error: "User not found" 
      });
    }

    return res.status(200).json({ 
      message: "Face ID registered successfully!",
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Face registration error:", error);
    return res.status(500).json({ 
      error: "Internal server error during face registration" 
    });
  }
});

router.get("/check-face-id/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const user = await EmployeeLoginAccount.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const hasDescriptor = Array.isArray(user.faceDescriptor) && user.faceDescriptor.length === 128;
    const hasImage = Boolean(user.faceImageUrl);

    res.status(200).json({
      hasFaceDescriptor: hasDescriptor,
      hasFaceImage: hasImage,
      faceImageUrl: user.faceImageUrl || null,
      lastFaceUpdate: user.lastFaceUpdate || null
    });
  } catch (err) {
    console.error("Error checking face ID:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
