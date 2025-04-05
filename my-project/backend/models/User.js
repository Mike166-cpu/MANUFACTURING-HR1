const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  employeeId: {type: String, required: true, unique: true, index: true},
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['employee', 'admin', 'superadmin'], 
    default: 'employee', 
  },
});
const User = mongoose.model('User', UserSchema);

module.exports = User;
