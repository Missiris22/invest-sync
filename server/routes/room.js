const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Room = require('../models/Room');
const User = require('../models/User');

// Helper to generate unique 4 digit code
const generateCode = async () => {
  let code;
  let isUnique = false;
  while (!isUnique) {
    code = Math.floor(1000 + Math.random() * 9000).toString();
    // Check if code is already used in any room in MongoDB
    const existing = await Room.findOne({ code });
    if (!existing) isUnique = true;
  }
  return code;
};

// Create Room - Protected route
router.post('/', auth, async (req, res) => {
  try {
    const code = await generateCode();
    const room = new Room({
      code,
      host: req.user._id,
      members: [req.user._id],
    });
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Join Room - Protected route
router.post('/join', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const room = await Room.findOne({ code });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user already in room
    if (!room.members.includes(req.user._id)) {
      room.members.push(req.user._id);
      await room.save();
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Current User's Active Room - Protected route
router.get('/active', auth, async (req, res) => {
  try {
    // Find the first room where user is a member
    const userRoom = await Room.findOne({ members: req.user._id })
      .populate('members', 'id name phone')
      .populate('host', 'id name phone');
    
    if (!userRoom) {
      return res.json(null); // No active room
    }
    
    res.json(userRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Leave Room - Protected route
router.post('/leave', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const room = await Room.findOne({ code });

    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Remove user from members
    room.members = room.members.filter(memberId => memberId.toString() !== req.user._id.toString());
    
    if (room.members.length === 0) {
      // If room is empty, delete it
      await room.deleteOne();
      return res.json({ message: 'Left room and room deleted' });
    }
    
    // If user was host, transfer host to another member
    if (room.host.toString() === req.user._id.toString()) {
      room.host = room.members[0];
    }
    
    await room.save();
    res.json({ message: 'Left room successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Kick Member (Host Only) - Protected route
router.post('/kick', auth, async (req, res) => {
  try {
    const { code, userIdToKick } = req.body;
    const room = await Room.findOne({ code });

    if (!room) return res.status(404).json({ message: 'Room not found' });
    
    if (room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only host can kick members' });
    }

    // Remove user from members
    room.members = room.members.filter(memberId => memberId.toString() !== userIdToKick);
    
    await room.save();
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;