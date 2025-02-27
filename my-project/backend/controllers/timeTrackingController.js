const TimeTracking = require('../models/TimeTracking');

// ...existing code...

exports.createManualEntry = async (req, res) => {
  try {
    const {
      employee_id,
      employee_username,
      time_in,
      time_out,
      total_hours,
      overtime_hours,
      purpose,
      remarks
    } = req.body;

    const newTimeEntry = new TimeTracking({
      employee_id,
      employee_username,
      time_in: new Date(time_in),
      time_out: new Date(time_out),
      total_hours,
      overtime_hours,
      status: 'pending',
      purpose,
      remarks,
      entry_type: 'Manual Entry'
    });

    const savedEntry = await newTimeEntry.save();
    res.status(201).json({ 
      success: true, 
      message: 'Manual entry created successfully',
      data: savedEntry 
    });
  } catch (error) {
    console.error('Error creating manual entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create manual entry', 
      error: error.message 
    });
  }
};

// ...existing code...
