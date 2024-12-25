const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const User = mongoose.model('usersses', UserSchema)
module.exports = User
