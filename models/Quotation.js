const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  fullEmail: { type: String, required: true },
  message: { type: String, required: true },
  service: { type: String, required: true },
  city: { type: String, required: true },
  budget: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quotation', quotationSchema);
