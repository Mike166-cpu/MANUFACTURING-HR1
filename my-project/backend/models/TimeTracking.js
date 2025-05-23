const mongoose = require("mongoose");

const TimeTrackingSchema = new mongoose.Schema({
    time_tracking_id: { type: String, required: true, unique: true },
    employee_id: { type: String, required: true },
    employee_fullname: { type: String, required: true },
    position: {type: String},
    time_in: { type: Date, default: null },
    time_out: { type: Date, default: null },
    total_hours: { type: String, default: "0H" }, 
    overtime_hours: { type: String, default: "0H" }, 
    status: { type: String, enum: ['active', 'pending', 'approved', 'rejected'], default: 'active' },
    remarks: { type: String, default: '' },
    purpose: { type: String, default: '' }, 
    entry_type: { type: String, enum: ['System Entry', 'Manual Entry'], required: true }, 
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    approved_at: { type: Date, default: null },
    entry_status: { type: String, enum: ['on_time', 'late', 'absent'], default: 'on_time' },
    minutes_late: { type: Number, default: 0 },
    is_holiday: { type: Boolean, default: false },
    holiday_name: { type: String, default: null },
    shift_period: { type: String, enum: ['morning', 'afternoon']},
    shift_name: { type: String, default: null },
    break_duration: { type: Number, default: 0 }, // in minutes
    break_start: { type: Date, default: null },
    break_end: { type: Date, default: null },
}
, { timestamps: true });

module.exports = mongoose.model("TimeTracking", TimeTrackingSchema);
