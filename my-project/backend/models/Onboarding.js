const mongoose = require("mongoose");

const onboardingSchema = new mongoose.Schema({
  employeeId: String,
  fullname: String,
  email: String,
  department: String,
  position: String,
  experience: String,
  gender: String,
  nationality: String,
  civilStatus: String,
  role: { type: String, default: "Employee" },
  skills: [String],
  documents: [
    {
      name: String,
      url: String,  
      uploadedAt: Date,
    },
  ],
  userId: mongoose.Schema.Types.ObjectId,
  onboardingSteps: {
    submittedDocuments: { type: Boolean, default: false },
    signedContract: { type: Boolean, default: false },
    orientationCompleted: { type: Boolean, default: false },
  },
  status: { type: String, default: "In Progress" },
  onboardingStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  completionSteps: {
    personalInfo: { type: Boolean, default: false },
    documentation: { type: Boolean, default: false },
    setupComplete: { type: Boolean, default: false }
  },
  notes: String,
  rejectedAt: Date,
  rejectionReason: String,
}, { timestamps: true }
);

module.exports = mongoose.model("Onboarding", onboardingSchema);
