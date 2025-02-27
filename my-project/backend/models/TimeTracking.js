const mongoose = require("mongoose");

const TimeTrackingSchema = new mongoose.Schema({
    employee_id: { type: String, required: true },
    employee_username: { type: String, required: true }, // Add this field
    time_in: { type: Date, default: null },
    time_out: { type: Date, default: null },
    total_hours: { type: Number, default: 0 },
    overtime_hours: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'pending', 'approved', 'rejected'], default: 'active' },
    remarks: { type: String, default: '' },
    purpose: { type: String, default: '' }, // Add this field
    entry_type: { type: String, enum: ['System Entry', 'Manual Entry'], required: true }, // Add this field
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    approved_at: { type: Date, default: null }
});

module.exports = mongoose.model("TimeTracking", TimeTrackingSchema);
