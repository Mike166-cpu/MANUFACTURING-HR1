const express = require("express");
const Employee = require("../models/Employee");
const PromotionRequest = require("../models/Promotion");

const router = express.Router();

// Admin creates a promotion request for an employee by employeeId
router.post("/request/:employeeId", async (req, res) => {
  const { employeeId } = req.params;
  const { newPosition, newRole, remarks, requestedBy } = req.body;

  console.log("🔍 Incoming promotion request:");
  console.log("Params - employeeId:", employeeId);
  console.log(
    "Body - newPosition:",
    newPosition,
    "| newRole:",
    newRole,
    "| remarks:",
    remarks,
    "| requestedBy:",
    requestedBy
  );

  try {
    const employee = await Employee.findOne({ employeeId });

    if (!employee) {
      console.log("❌ Employee not found with ID:", employeeId);
      return res.status(404).json({ message: "Employee not found." });
    }

    console.log("✅ Found Employee:", {
      fullname: employee.fullname,
      position: employee.position,
      role: employee.role,
      hiredDate: employee.createdAt, // debug
    });
    
    const now = new Date();

    const promotion = new PromotionRequest({
      employeeId: employee.employeeId,
      oldPosition: employee.position,
      newPosition,
      oldRole: employee.role,
      remarks,
      requestedBy,
      hiredDate: employee.createdAt, 
      positionEndedAt: now,
      positionEffectiveAt: now,
    });

    await promotion.save();

    console.log("📦 Promotion request saved:", promotion);

    res.status(201).json({ message: "Promotion request created.", promotion });
  } catch (error) {
    console.error("🔥 Error requesting promotion:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// PUT approval using promotion ID and updates Employee by `employeeId`
router.put("/promotion/approve/:promotionId", async (req, res) => {
  const { promotionId } = req.params;
  const { reviewedBy, reviewRemarks } = req.body;

  try {
    const promotion = await PromotionRequest.findById(promotionId);

    if (!promotion)
      return res.status(404).json({ message: "Promotion request not found." });
    if (promotion.status !== "Pending")
      return res.status(400).json({ message: "Request already handled." });

    const employee = await Employee.findOne({
      employeeId: promotion.employeeId,
    });
    if (!employee)
      return res
        .status(404)
        .json({ message: "Associated employee not found." });

    // Update employee position and role
    employee.position = promotion.newPosition;
    employee.role = promotion.newRole;
    await employee.save();

    // Approve the promotion request
    promotion.status = "Approved";
    promotion.reviewedAt = new Date();
    promotion.reviewedBy = reviewedBy;
    promotion.reviewRemarks = reviewRemarks;
    await promotion.save();

    res
      .status(200)
      .json({ message: "Promotion approved and employee updated." });
  } catch (error) {
    console.error("Error approving promotion:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// GET all promotion requests
router.get("/", async (req, res) => {
  try {
    const promotions = await PromotionRequest.find().sort({ requestedAt: -1 });
    res.json(promotions);
  } catch (err) {
    console.error("Error fetching promotions:", err);
    res
      .status(500)
      .json({ message: "Server error fetching promotion requests" });
  }
});

router.put("/review/:promotionId", async (req, res) => {
  const { promotionId } = req.params;
  const { status, reviewedBy, remarks } = req.body;

  console.log("[DEBUG] Received request to review promotion:", {
    promotionId,
    status,
    reviewedBy,
    remarks,
  });

  const normalizedStatus = status.toLowerCase();
  if (!["approved", "rejected"].includes(normalizedStatus)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const formattedStatus =
    normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

  try {
    const promotion = await PromotionRequest.findById(promotionId);
    if (!promotion) {
      console.warn("[WARN] Promotion request not found:", promotionId);
      return res.status(404).json({ error: "Promotion request not found" });
    }

    if (promotion.status !== "Pending") {
      console.warn("[WARN] Promotion already reviewed:", {
        promotionId,
        currentStatus: promotion.status,
      });
      return res.status(400).json({ error: "Promotion already reviewed" });
    }

    // Update the promotion request
    promotion.status = formattedStatus;
    promotion.reviewedBy = reviewedBy;
    promotion.reviewedAt = new Date();
    promotion.reviewRemarks = remarks;

    console.log("[DEBUG] Promotion request updated fields:", {
      status: formattedStatus,
      reviewedBy,
      remarks,
    });

    // If approved, update the employee's position and role
    if (formattedStatus === "Approved") {
    const employee = await Employee.findOne({ employeeId: promotion.employeeId });
      if (!employee) {
        console.warn(
          "[WARN] Employee not found for promotion:",
          promotion.employeeId
        );
        return res.status(404).json({ error: "Employee not found" });
      }

      console.log("[DEBUG] Before updating employee:", {
        employeeId: employee._id,
        currentPosition: employee.position,
        currentRole: employee.role,
      });

      employee.position = promotion.newPosition;
      if (promotion.newRole) {
        employee.role = promotion.newRole;
      }

      await employee.save();

      console.log("[DEBUG] Employee updated:", {
        newPosition: employee.position,
        newRole: employee.role,
      });
    }

    await promotion.save();

    console.log("[SUCCESS] Promotion reviewed and saved:", {
      promotionId,
      newStatus: promotion.status,
    });

    res.json({ message: `Promotion ${formattedStatus}`, promotion });
  } catch (error) {
    console.error("[ERROR] Error reviewing promotion request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/history/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const history = await PromotionRequest.find({ employeeId }).sort({ requestedAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch promotion history" });
  }
});

module.exports = router;
