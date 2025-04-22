const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "Employee" },
    employeeId: { type: String, required: true },
    faceImageUrl: { type: String, default: null },
    faceDescriptor: { 
      type: [Number], 
      default: null,
      validate: {
        validator: function(v) {
          return !v || (Array.isArray(v) && v.length === 128);
        },
        message: 'Face descriptor must be an array of 128 numbers'
      }
    },
    lastFaceUpdate: { 
      type: Date, 
      default: null 
    },
    active: { type: Boolean, default: true },
    otp: String,
    otpExpires: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmployeeLoginAccount", UserSchema);
