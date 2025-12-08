const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const auth = require('../middleware/auth');

// Helper to generate unique 4 digit code
const generateCode = async () => {
  let code;
  let isUnique = false;
  while (!isUnique) {
    code = Math.floor(1000 + Math.random() * 9000).toString();
    const existing = await Room.findOne({ code });
    if (!existing) isUnique = true;
  }
  return code;
};

// Create Room
router.post('/', auth, async (req, res) => {
  try {
    const code = await generateCode();
    const room = new Room({
      code,
      host: req.user._id,
      members: [req.user._id]
    });
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Join Room
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

// Get Current User's Active Room (Simple logic: just return the last room they joined/created for now, or match specific ID)
// In a real app, users might be in multiple rooms, but per spec "enter A room".
router.get('/active', auth, async (req, res) => {
  try {
    // Find a room where the user is a member, sort by most recently created
    const room = await Room.findOne({ members: req.user._id })
      .sort({ createdAt: -1 })
      .populate('members', 'id name phone') // Populate member details
      .populate('host', 'id name');
      
    res.json(room); // Returns null if no room
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Leave Room
router.post('/leave', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const room = await Room.findOne({ code });

    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.members = room.members.filter(memberId => memberId.toString() !== req.user._id.toString());
    
    // If room is empty, optionally delete it
    if (room.members.length === 0) {
      await Room.deleteOne({ _id: room._id });
      return res.json({ message: 'Left room and room deleted' });
    }

    await room.save();
    res.json({ message: 'Left room successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Kick Member (Host Only)
router.post('/kick', auth, async (req, res) => {
  try {
    const { code, userIdToKick } = req.body;
    const room = await Room.findOne({ code });

    if (!room) return res.status(404).json({ message: 'Room not found' });
    
    if (room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only host can kick members' });
    }

    room.members = room.members.filter(memberId => memberId.toString() !== userIdToKick);
    await room.save();
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;