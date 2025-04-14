const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shiftType: { type: String, required: true, enum: ['Fixed', 'Rotating', 'Split', 'Flexible'] },
  days: { type: [String], required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one day must be selected'
    }
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  breakStart: { type: String },
  breakEnd: { type: String, },
  flexibleStartTime: { type: String },
  flexibleEndTime: { type: String},
});

const Shift = mongoose.model("Shift", shiftSchema);

module.exports = Shift;
