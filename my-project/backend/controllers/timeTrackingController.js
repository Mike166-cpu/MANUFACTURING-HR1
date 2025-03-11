const TimeTracking = require("../models/TimeTracking");
const axios = require("axios");
const {isHoliday} = require("../utils/holiday");

exports.createManualEntry = async (req, res) => {
  try {
    const {
      employee_id,
      employee_firstname,
      position,
      employee_lastname,
      time_in,
      time_out,
      total_hours,
      overtime_hours,
      purpose,
      remarks,
    } = req.body;

    const formattedDate = new Date(time_in).toISOString().split("T")[0];

    // ✅ Check if the date is a holiday
    const holiday = isHoliday(formattedDate);
    const is_holiday = holiday ? true : false;
    const holiday_name = holiday ? holiday.name : null;

    console.log("Detected Holiday:", is_holiday, "Holiday Name:", holiday_name);

    const newTimeEntry = new TimeTracking({
      employee_id,
      position,
      employee_firstname,
      employee_lastname,
      time_in: new Date(time_in),
      time_out: new Date(time_out),
      total_hours,
      overtime_hours,
      status: "pending",
      purpose,
      remarks,
      entry_type: "Manual Entry",
      is_holiday,   
      holiday_name, 
    });

    const savedEntry = await newTimeEntry.save();
    res.status(201).json({
      success: true,
      message: "Manual entry created successfully",
      data: savedEntry,
      is_holiday,
      holiday_name,
    });
  } catch (error) {
    console.error("Error creating manual entry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create manual entry",
      error: error.message,
    });
  }
};

