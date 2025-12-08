const express = require('express');
const router = express.Router();
const Holding = require('../models/Holding');
const Room = require('../models/Room');
const auth = require('../middleware/auth');

// Get Holdings
// Query param: ?scope=mine OR ?scope=room&roomCode=XXXX
router.get('/', auth, async (req, res) => {
  try {
    const { scope, roomCode } = req.query;

    if (scope === 'room' && roomCode) {
      // Get all holdings for members in the room
      const room = await Room.findOne({ code: roomCode });
      if (!room) return res.status(404).json({ message: 'Room not found' });

      // Check if requester is in the room
      if (!room.members.includes(req.user._id)) {
        return res.status(403).json({ message: 'Not a member of this room' });
      }

      const holdings = await Holding.find({ user: { $in: room.members } });
      return res.json(holdings);
    } 
    
    // Default: Get only my holdings
    const holdings = await Holding.find({ user: req.user._id });
    res.json(holdings);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add Holding
router.post('/', auth, async (req, res) => {
  try {
    const holding = new Holding({
      ...req.body,
      user: req.user._id,
      updatedAt: Date.now()
    });
    await holding.save();
    res.status(201).json(holding);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Batch Add (Import)
router.post('/batch', auth, async (req, res) => {
  try {
    const { holdings } = req.body; // Array of holding objects
    if (!Array.isArray(holdings)) return res.status(400).json({ message: 'Holdings must be an array' });

    const holdingsToSave = holdings.map(h => ({
      ...h,
      user: req.user._id,
      updatedAt: Date.now()
    }));

    const result = await Holding.insertMany(holdingsToSave);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Holding
router.put('/:id', auth, async (req, res) => {
  try {
    const holding = await Holding.findOne({ _id: req.params.id, user: req.user._id });
    if (!holding) return res.status(404).json({ message: 'Holding not found' });

    Object.assign(holding, req.body);
    holding.updatedAt = Date.now();
    await holding.save();
    
    res.json(holding);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Holding
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Holding.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Holding not found' });
    res.json({ message: 'Holding deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;