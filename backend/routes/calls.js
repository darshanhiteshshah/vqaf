const express = require('express');
const router = express.Router();
const Call = require('../models/call');

// Get single call details (with full transcript)
router.get('/:callId', async (req, res) => {
  try {
    const call = await Call.findOne({ callId: req.params.callId });
    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }
    res.json(call);
  } catch (error) {
    console.error('Error fetching call:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent calls list
router.get('/', async (req, res) => {
  try {
    const { limit = 20, status, agentId } = req.query;
    
    // Build query filters
    const query = {};
    if (status) query.status = status;
    if (agentId) query.agentId = agentId;
    
    const calls = await Call.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('callId agentId status scores metrics createdAt transcript');
    
    res.json(calls);
  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a call
router.delete('/:callId', async (req, res) => {
  try {
    const result = await Call.deleteOne({ callId: req.params.callId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Call not found" });
    }
    res.json({ message: "Call deleted successfully" });
  } catch (error) {
    console.error('Error deleting call:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
