const mongoose = require('mongoose');

const HoldingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 0
  },
  avgPrice: {
    type: Number,
    default: 0
  },
  currentPrice: {
    type: Number,
    default: 0
  },
  profit: {
    type: Number,
    default: 0
  },
  profitPercent: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Number,
    default: Date.now
  }
});

module.exports = mongoose.model('Holding', HoldingSchema);