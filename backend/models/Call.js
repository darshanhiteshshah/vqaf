const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
  callId: { type: String, unique: true },
  agentId: String,
  audioUrl: String,
  status: { type: String, default: "uploaded" },
  transcript: mongoose.Schema.Types.Mixed,
  scores: mongoose.Schema.Types.Mixed,
  metrics: {
    totalDuration: Number,
    agentSeconds: Number,
    customerSeconds: Number,
    confidence: Number
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Call", CallSchema);
