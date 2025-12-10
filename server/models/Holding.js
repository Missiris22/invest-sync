const mongoose = require("mongoose");

const HoldingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  symbol: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
  avgPrice: {
    type: Number,
    default: 0,
  },
  currentPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  profit: {
    type: Number,
    default: 0,
  },
  profitPercent: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
    trim: true,
    default: "",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Holding", HoldingSchema);
