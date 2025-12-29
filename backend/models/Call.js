const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
  callId: { type: String, unique: true, required: true },
  agentId: { type: String, required: true },
  audioUrl: String,
  status: { 
    type: String, 
    default: "uploaded",
    enum: ["uploaded", "transcribed", "scored", "failed"]
  },
  transcript: mongoose.Schema.Types.Mixed,
  scores: mongoose.Schema.Types.Mixed,
  metrics: {
    totalDuration: Number,
    agentSeconds: Number,
    customerSeconds: Number,
    confidence: Number
  },
  error: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ✅ Remove or fix the pre-save hook
// Just let Mongoose handle timestamps automatically
CallSchema.set('timestamps', true); // This auto-manages createdAt and updatedAt

// ✅ Safe export
module.exports = mongoose.models.Call || mongoose.model("Call", CallSchema);
