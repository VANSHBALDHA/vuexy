const mongoose = require('mongoose');

const UsersSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  user_type: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const UserData = mongoose.model('users', UsersSchema);
module.exports = UserData;
