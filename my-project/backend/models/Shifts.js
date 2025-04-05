const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  shiftType: {
    type: String,
    required: true,
    enum: ['Fixed', 'Rotating', 'Split', 'Flexible']
  },
  days: {
    type: [String], // Array of strings for multiple days (e.g., ["Monday", "Tuesday"])
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one day must be selected'
    }
  },
  startTime: {
    type: String, // Time format (HH:MM)
    required: true,
  },
  endTime: {
    type: String, // Time format (HH:MM)
    required: true,
  },
  
  breakStart: {
    type: String, // Optional, time format (HH:MM)
  },
  breakEnd: {
    type: String, // Optional, time format (HH:MM)
  },
  flexibleStartTime: {
    type: String, // Optional, time format (HH:MM)
  },
  flexibleEndTime: {
    type: String, // Optional, time format (HH:MM)
  },
});

const Shift = mongoose.model("Shift", shiftSchema);

module.exports = Shift;
