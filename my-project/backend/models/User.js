const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  middleName: { type: String },
  nickname: { type: String },
  suffix: { type: String },
  birthday: { type: Date, required: true },
  address: { type: String, required: true },
  contactNumber: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
