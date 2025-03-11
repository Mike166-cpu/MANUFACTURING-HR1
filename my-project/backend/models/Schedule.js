const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  employeeId: {
    type: String,  // Changed to String to match EmployeeLoginModel _id
    ref: "EmployeeLogin",  // Updated reference to EmployeeLoginModel
    required: true,
  },
  firstName: {  // Updated to match EmployeeLoginModel
    type: String,
    required: true,
  },
  lastName: {  // Updated to match EmployeeLoginModel
    type: String,
    required: true,
  },
  email: {  // Added to match EmployeeLoginModel
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  days: {
    type: [String],
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    required: true,
  },
  startTime: {
    type: String,
    required: true,
    default: "08:00",
    validate: {
      validator: (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value),
      message: "Invalid time format (HH:mm required)",
    },
  },
  endTime: {
    type: String,
    required: true,
    default: "17:00",
    validate: {
      validator: (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value),
      message: "Invalid time format (HH:mm required)",
    },
  },
});

// Add this temporary debug code at the top of your schema:
scheduleSchema.pre('find', function() {
  console.log('Finding with query:', this.getQuery());
});

// Prevent duplicate schedules for the same employee on the same days
scheduleSchema.index({ employeeId: 1, days: 1 }, { unique: true });

const Schedule = mongoose.model("Schedule", scheduleSchema);

module.exports = Schedule;
