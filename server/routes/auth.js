const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

// Login or Register (Upsert)
router.post('/login', async (req, res) => {
  try {
    const { phone, name } = req.body;
    
    if (!phone || !name) {
      return res.status(400).json({ message: 'Phone and name are required' });
    }

    let user = await User.findOne({ phone });

    if (!user) {
      user = new User({ phone, name });
      await user.save();
    } else if (user.name !== name) {
      // Update name if changed
      user.name = name;
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        joinedAt: user.joinedAt
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user (Verify Token)
router.get('/me', require('../middleware/auth'), async (req, res) => {
  res.json({
    id: req.user._id,
    phone: req.user.phone,
    name: req.user.name,
    joinedAt: req.user.joinedAt
  });
});

module.exports = router;