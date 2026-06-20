// const mongoose = require('mongoose');

// const CallSchema = new mongoose.Schema({
//   callId: { type: String, unique: true, required: true },
//   agentId: { type: String, required: true },
//   audioUrl: String,
//   status: { 
//     type: String, 
//     default: "uploaded",
//     enum: ["uploaded", "transcribed", "scored", "failed"]
//   },
//   transcript: mongoose.Schema.Types.Mixed,
//   scores: mongoose.Schema.Types.Mixed,
//   metrics: {
//     totalDuration: Number,
//     agentSeconds: Number,
//     customerSeconds: Number,
//     confidence: Number
//   },
//   error: String,
//   summary: mongoose.Schema.Types.Mixed,
//           actionItems:[String],
//           strengths: [String],
//           weaknesses: [String],
//           coaching: [String],
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// // ✅ Remove or fix the pre-save hook
// // Just let Mongoose handle timestamps automatically
// CallSchema.set('timestamps', true); // This auto-manages createdAt and updatedAt

// // ✅ Safe export
// module.exports = mongoose.models.Call || mongoose.model("Call", CallSchema);

const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema(
{
  callId: {
    type: String,
    unique: true,
    required: true
  },

  agentId: {
    type: String,
    required: true
  },

  audioUrl: {
    type: String
  },

  status: {
    type: String,
    default: "uploaded",
    enum: [
      "uploaded",
      "transcribed",
      "scored",
      "failed"
    ]
  },

  // Whisper/STT output
  transcript: mongoose.Schema.Types.Mixed,

  // QA + Gemini output
  scores: {
    overallScore: Number,

    greeting: Number,
    professionalism: Number,
    empathy: Number,
    resolution: Number,

    clarity: Number,
    courtesy: Number,
    talkBalance: Number,
    efficiency: Number,

    category: String,
    sentiment: String,
    sentimentScore: Number,
    criticalIssues: [String],
    fullTranscript: String,
    embedding: [Number],
    summary: String,

    actionItems: [String],

    strengths: [String],

    weaknesses: [String],

    coaching: [String],

    flags: [String],

    customerSatisfaction: Number,
    customerFrustration: Boolean
  },

  // Call metrics
  metrics: {
    totalDuration: Number,
    agentSeconds: Number,
    customerSeconds: Number,
    confidence: Number
  },

  error: {
    type: String,
    default: null
  }
},
{
  timestamps: true
}
);

module.exports =
  mongoose.models.Call ||
  mongoose.model("Call", CallSchema);