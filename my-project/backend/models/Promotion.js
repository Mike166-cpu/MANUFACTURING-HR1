const mongoose = require("mongoose");

const PromotionRequestSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    oldPosition: String,
    newPosition: String,
    oldRole: String,
    hiredDate: { type: Date },
    oldSalary: { type: Number },
    newSalary: { type: Number },
    positionEndedAt: Date,
    positionEffectiveAt: Date,
    remarks: String,
    requestedBy: { type: String },
    requestedAt: { type: Date, default: Date.now },
    reviewedBy: { type: String },
    reviewedAt: Date,
    reviewRemarks: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("PromotionRequest", PromotionRequestSchema);
