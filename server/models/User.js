const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  joinedAt: {
    type: Number,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);