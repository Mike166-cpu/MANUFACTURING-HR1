const mongoose = require("mongoose");

const PromotionRequestSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    oldPosition: String,
    newPosition: String,
    oldRole: String,
    hiredDate: { type: Date },
    positionEndedAt: Date,
    positionEffectiveAt: Date,
    remarks: String,
    requestedBy: { type: String },
    requestedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    reviewedBy: { type: String },
    reviewedAt: Date,
    reviewRemarks: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("PromotionRequest", PromotionRequestSchema);
