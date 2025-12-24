const express = require('express');
const router = express.Router();
const Call = require('../models/call');

// Single call details (with full transcript)
router.get('/:callId', async (req, res) => {
  try {
    const call = await Call.findOne({ callId: req.params.callId });
    if (!call) return res.status(404).json({ error: "Call not found" });
    res.json(call);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recent calls list
router.get('/', async (req, res) => {
  try {
    const calls = await Call.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select("callId agentId status scores metrics createdAt transcript");
    res.json(calls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
