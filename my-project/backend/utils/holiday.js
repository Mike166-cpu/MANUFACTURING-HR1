const holidays = [
  { date: "2025-01-01", name: "New Year's Day", type: "Regular Holiday" },
  { date: "2025-04-17", name: "Maundy Thursday", type: "Regular Holiday" },
  { date: "2025-04-18", name: "Good Friday", type: "Regular Holiday" },
  { date: "2025-04-09", name: "Araw ng Kagitingan", type: "Regular Holiday" },
  { date: "2025-05-01", name: "Labor Day", type: "Regular Holiday" },
  { date: "2025-06-12", name: "Independence Day", type: "Regular Holiday" },
  { date: "2025-08-25", name: "National Heroes Day", type: "Regular Holiday" },
  { date: "2025-11-30", name: "Bonifacio Day", type: "Regular Holiday" },
  { date: "2025-12-25", name: "Christmas Day", type: "Regular Holiday" },
  { date: "2025-12-30", name: "Rizal Day", type: "Regular Holiday" },

  // Special Non-Working Holidays
  { date: "2025-01-29", name: "Chinese New Year", type: "Special Non-Working" },
  { date: "2025-04-19", name: "Black Saturday", type: "Special Non-Working" },
  { date: "2025-08-21", name: "Ninoy Aquino Day", type: "Special Non-Working" },
  { date: "2025-11-01", name: "All Saints' Day", type: "Special Non-Working" },
  {
    date: "2025-12-08",
    name: "Feast of the Immaculate Conception",
    type: "Special Non-Working",
  },

  // Special Working Holidays
  { date: "2025-11-02", name: "All Souls' Day", type: "Special Working" },
  { date: "2025-12-24", name: "Christmas Eve", type: "Special Working" },
  { date: "2025-12-31", name: "New Year's Eve", type: "Special Working" },
];

const isHoliday = (date) => {
  return holidays.find((holiday) => holiday.date === date);
};

module.exports = { holidays, isHoliday };
