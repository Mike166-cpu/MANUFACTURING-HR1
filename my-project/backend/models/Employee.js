const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employee_firstname: { type: String, required: true },
  employee_middlename: { type: String },
  employee_lastname: { type: String, required: true },
  employee_suffix: { type: String },
  employee_username: { type: String, required: true, unique: true },
  employee_email: { type: String, required: true, unique: true },
  employee_password: { type: String, required: true },
  employee_phone: { type: String, required: true },
  employee_address: { type: String, required: true },
  employee_dateOfBirth: { type: Date, required: true },
  employee_gender: { type: String, required: true },
  employee_department: { type: String, required: true },
  time_in: { type: Date },
  time_out: { type: Date },
  total_hours: { type: Number },
}, { timestamps: true });

employeeSchema.pre('save', async function(next) {
  if (!this.isModified('employee_password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.employee_password = await bcrypt.hash(this.employee_password, salt);
    next();
  } catch(err) {
    next(err);
  }
});

employeeSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.employee_password);
};

module.exports = mongoose.model('Employee', employeeSchema, 'employee');