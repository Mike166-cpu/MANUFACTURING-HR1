const mongoose = require("mongoose");

const UserLogSchema = new mongoose.Schema({
  userId: { type: String, required: true }, 
  email: { type: String, required: true },
  action: { type: String, required: true }, 
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String }, 
  userAgent: { type: String }, 
});

module.exports = mongoose.model("UserLog", UserLogSchema);
