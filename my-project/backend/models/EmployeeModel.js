const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  employee_id: {
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return v != null && v.length > 0;
      },
      message: 'Employee ID cannot be null or empty'
    }
  },
  firstName: {type: String, required: true  },
  lastName: { type: String, required: true },
  middleName: { type: String},
  email: { type: String, required: true, unique: true },
  age : { type: Number, required: true },
  birthday: { type: Date, required: true },
  gender: { type: String, required: true },
  address: { type: String, required: true },
  department: { type: String, required: true },
  role: { type: String, required: true },
}, {
  timestamps: true,
  versionKey: false
});

// Add pre-save middleware for validation
EmployeeSchema.pre('save', function(next) {
  if (!this.employee_id) {
    return next(new Error('Employee ID is required'));
  }
  if (!this.email) {
    return next(new Error('Email is required'));
  }
  next();
});

// Add index with partial filter
EmployeeSchema.index(
  { employee_id: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { employee_id: { $exists: true, $type: "string" } }
  }
);

module.exports = mongoose.model("EmployeeModel", EmployeeSchema);
