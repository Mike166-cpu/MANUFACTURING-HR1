const mongoose = require("mongoose");

const AcknowledgementSchema = new mongoose.Schema({
  employee_username: {
    type: String,
    required: true,
  },
  policy_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Policy",
    required: true,
  },
  acknowledgedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Acknowledgement", AcknowledgementSchema);
