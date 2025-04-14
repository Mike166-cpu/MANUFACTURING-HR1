const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: false, 
  },
  email: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  position: {
    type: String,
  },
  role: {
    type: String,
    required: true,
  },
  days: {
    type: [String],
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    required: true,
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Days array cannot be empty'
    }
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
  shiftType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: true
  },
  shiftname: {
    type: String,
    required: true,
  },
  breakStart: String,
  breakEnd: String,
  flexibleStartTime: String,
  flexibleEndTime: String,
}, { 
  timestamps: true,
  strict: false 
});

scheduleSchema.pre('find', function() {
  console.log('Finding with query:', this.getQuery());
});


const Schedule = mongoose.model("Schedule", scheduleSchema);

module.exports = Schedule;
