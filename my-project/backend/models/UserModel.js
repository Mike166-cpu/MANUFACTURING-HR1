const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, 
    role: { type: String, default: "Employee" },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserEmployee", UserSchema);
