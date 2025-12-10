const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Holding = require("../models/Holding");
const Room = require("../models/Room");

// Get Holdings
// Query param: ?scope=mine OR ?scope=room&roomCode=XXXX
router.get("/", auth, async (req, res) => {
  try {
    const { scope, roomCode } = req.query;
    const user = req.user._id;

    if (scope === "room" && roomCode) {
      // Get all holdings for members in the room
      const room = await Room.findOne({ code: roomCode });
      if (!room) return res.status(404).json({ message: "Room not found" });

      // Check if requester is in the room
      if (!room.members.includes(user)) {
        return res.status(403).json({ message: "Not a member of this room" });
      }

      // Get holdings for all members in the room
      const holdings = await Holding.find({ user: { $in: room.members } });
      return res.json(holdings);
    }

    // Default: Get only my holdings
    const holdings = await Holding.find({ user });
    res.json(holdings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add Holding
router.post("/", auth, async (req, res) => {
  try {
    const holding = new Holding({
      ...req.body,
      user: req.user._id,
    });
    await holding.save();
    res.status(201).json(holding);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Batch Add (Import)
router.post("/batch", auth, async (req, res) => {
  try {
    const { holdings } = req.body; // Array of holding objects
    if (!Array.isArray(holdings))
      return res.status(400).json({ message: "Holdings must be an array" });

    const holdingsToSave = holdings.map((h) => ({
      ...h,
      user: req.user._id,
    }));

    const savedHoldings = await Holding.insertMany(holdingsToSave);
    res.status(201).json(savedHoldings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Holding
router.put("/:id", auth, async (req, res) => {
  try {
    const holding = await Holding.findById(req.params.id);
    if (!holding) return res.status(404).json({ message: "Holding not found" });

    // Check if this holding belongs to the current user
    if (holding.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only update your own holdings" });
    }

    // Update the holding with the new data
    holding.set({
      ...req.body,
      updatedAt: Date.now(),
    });
    
    await holding.save();
    res.json(holding);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Holding
router.delete("/:id", auth, async (req, res) => {
  try {
    const holding = await Holding.findById(req.params.id);
    if (!holding) return res.status(404).json({ message: "Holding not found" });

    // Check if this holding belongs to the current user
    if (holding.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own holdings" });
    }

    await holding.deleteOne();
    res.json({ message: "Holding deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
