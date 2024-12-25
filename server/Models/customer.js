const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
  number_asked: { type: Number },
  status: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  plan_type: { type: String, required: true },
  number_type: { type: String, required: true },
  toll_free_no: { type: Number },
  local_no: { type: Number },
  current_no: { type: Number, required: true },
  price: { type: Number, required: true },
  address: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  zip_code: { type: Number, required: true },
  temp: { type: String, required: true },
  no_of_users: { type: Number, required: true },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const CustomerList = mongoose.model('customers', customerSchema)
module.exports = CustomerList
