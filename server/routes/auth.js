const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

// Login or Register (Upsert) - Using MongoDB
router.post('/login', async (req, res) => {
  try {
    const { phone, name } = req.body;
    
    if (!phone || !name) {
      return res.status(400).json({ message: 'Phone and name are required' });
    }

    // Create or update user in MongoDB
    const user = await User.findOneAndUpdate(
      { phone },
      { name, joinedAt: Date.now() },
      { upsert: true, new: true, runValidators: true }
    );

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      user,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user (Verify Token) - Protected route with JWT validation
router.get('/me', auth, async (req, res) => {
  try {
    // Find user by ID from the request object (set by auth middleware)
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;