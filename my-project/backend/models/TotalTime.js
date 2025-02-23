const mongoose = require("mongoose");

const totalTimeSchema = new mongoose.Schema({
  employee_username: { type: String, required: true },
  employee_id: { type: String,required: true},      // <================
  time_in: { type: Date, required: true},         // <================
  time_out: { type: Date},                        // <================
  work_duration: { type: String},                   // <================
  break_start: { type: Date},
  break_end: { type: Date},
  break_duration: { type: Number, default: 0},         // <================
  is_on_break: { type: Boolean, default: false},
  date: { type: Date, required: true, default: Date.now },  // <================
  label: { type: String, default: "Work"},       // <================
  overtime_duration: { type: Number},                  
  status: { type: String, 
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  remarks: { type: String, default: ""},
  session_id: { type: String, required: true, unique: true },
  entry_type: { type: String, 
    enum: ["System Entry", "Manual Entry"], default: "System Entry",
    required: true,  
    set: v => v || "System Entry" 
  },
});

// Add pre-save middleware to ensure entry_type is set
totalTimeSchema.pre('save', function(next) {
  if (!this.entry_type) {
    this.entry_type = this.label === 'OB' ? 'Manual Entry' : 'System Entry';
  }
  next();
});

// Add toJSON transform to always include entry_type
totalTimeSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.entry_type = ret.entry_type || 'System Entry';
    return ret;
  }
});

module.exports = mongoose.model("TotalTime", totalTimeSchema);
