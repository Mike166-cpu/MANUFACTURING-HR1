const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['employee', 'admin', 'superadmin'], // Allowed roles
    default: 'employee', // Default role
  },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;




// const mongoose = require('mongoose');

// const UserSchema = new mongoose.Schema({
//   firstName: { type: String, required: true },
//   lastName: { type: String, required: true },
//   middleName: { type: String },
//   email: { type: String, required: true, unique: true},
//   nickname: { type: String },
//   suffix: { type: String },
//   birthday: { type: Date, required: true },
//   address: { type: String, required: true },
//   contactNumber: { type: String, required: true },
//   username: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
// });

// const User = mongoose.model('User', UserSchema);

// module.exports = User;
