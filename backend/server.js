const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// Shared uploads dir at repo root
const uploadDir = path.resolve(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({ dest: uploadDir });
const analyticsRoutes = require('./routes/analytics');

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/uploads", express.static(uploadDir));
app.use('/api/analytics', analyticsRoutes);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch((err) => console.error("❌ MongoDB:", err));

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
    confidence: Number,
  },
  createdAt: { type: Date, default: Date.now },
});

const Call = mongoose.model("Call", CallSchema);

// 🚀 Upload + process pipeline (WhisperX + Real Metrics)
app.post("/api/uploads", upload.single("audioFile"), async (req, res) => {
  try {
    const { callId = `call_${Date.now()}`, agentId = "agent-001" } = req.body;

    const filename = req.file.filename;
    const audioUrl = filename; // will be resolved by Python backend from ../uploads/
    console.log(`📞 New call: ${callId} → ${req.file.path}`);

    // 1️⃣ Create call record
    const call = new Call({ callId, agentId, audioUrl });
    await call.save();

    // 2️⃣ STT with WhisperX (Python backend)
    console.log("🎤 Calling WhisperX STT...");
    const sttResponse = await axios.post(
      "http://localhost:8000/transcribe",
      {
        audio_url: audioUrl, // Reads from ../uploads/filename.wav
        callId,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 600000, // 5min timeout for diarization
      }
    );

    const transcript = sttResponse.data.transcript || [];

    // Real metrics from WhisperX diarization
    const {
      duration: totalDuration,
      agentSeconds,
      customerSeconds,
      confidence,
    } = sttResponse.data;

    console.log(
      `✅ STT complete: ${transcript.length} segments, ${
        totalDuration?.toFixed(1) || 0
      }s real duration`
    );

    // 3️⃣ Save transcript + metrics
    await call.updateOne({
      status: "transcribed",
      transcript: sttResponse.data, // full STT response
      metrics: {
        totalDuration: totalDuration || 0,
        agentSeconds: agentSeconds || 0,
        customerSeconds: customerSeconds || 0,
        confidence: confidence || 0,
      },
    });

    // 4️⃣ QA scoring (Node/other backend)
    console.log("⚖️ Calling enhanced QA...");
    const qaResponse = await axios.post(
      "http://localhost:8001/score",
      {
        transcript,
        metrics: {
          totalDuration: totalDuration || 0,
          agentSeconds: agentSeconds || 0,
          customerSeconds: customerSeconds || 0,
        },
        callId,
        agentId,
      },
      { timeout: 30000 }
    );

    // 5️⃣ Finalize with scores
    await call.updateOne({
      status: "scored",
      scores: qaResponse.data,
    });

    const agentTalkPct =
      totalDuration > 0 ? (agentSeconds / totalDuration) * 100 : 0;

    console.log(
      `✅ COMPLETE: ${callId} | Score: ${
        qaResponse.data.overallScore
      }/100 | Agent talk: ${agentTalkPct.toFixed(1)}%`
    );

    // Response for frontend
    res.json({
      jobId: call._id.toString(),
      status: "complete",
      scores: qaResponse.data,
      callId,
      filename,
      metrics: {
        totalDuration: totalDuration || 0,
        agentSeconds: agentSeconds || 0,
        customerSeconds: customerSeconds || 0,
        agentTalkPct: agentTalkPct.toFixed(1),
        confidence: confidence || 0,
      },
    });
  } catch (error) {
    console.error("❌ Pipeline Error:", error.response?.data || error.message);

    // Update call status on error
    try {
      if (req.file && (req.body.callId || req.body.callId === undefined)) {
        await Call.updateOne(
          { callId: req.body.callId || `call_${Date.now()}` },
          {
            status: "failed",
            error: error.response?.data?.detail || error.message,
          }
        );
      }
    } catch (e) {
      console.error("Error updating failed call:", e.message);
    }

    res.status(500).json({
      error:
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message,
    });
  }
});

// Single call details (with full transcript)
app.get("/api/calls/:callId", async (req, res) => {
  const call = await Call.findOne({ callId: req.params.callId });
  if (!call) return res.status(404).json({ error: "Call not found" });
  res.json(call);
});

// Recent calls list
app.get("/api/calls", async (req, res) => {
  const calls = await Call.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .select("callId agentId status scores metrics createdAt");
  res.json(calls);
});

// 📊 Dashboard metrics (last N scored calls)
app.get("/api/metrics", async (req, res) => {
  try {
    const lastN = Number(req.query.limit) || 50;
    const calls = await Call.find({ status: "scored" })
      .sort({ createdAt: -1 })
      .limit(lastN);

    if (!calls.length) {
      return res.json({
        totalCalls: 0,
        avgOverall: null,
        flaggedPct: 0,
      });
    }

    let sum = 0;
    let flagged = 0;
    let countWithScores = 0;

    for (const c of calls) {
      const overall = c.scores?.overallScore;
      if (typeof overall === "number") {
        sum += overall;
        countWithScores++;
      }
      const flags = c.scores?.flags || [];
      if (flags.length > 0) flagged++;
    }

    res.json({
      totalCalls: calls.length,
      avgOverall:
        countWithScores > 0
          ? Number((sum / countWithScores).toFixed(1))
          : null,
      flaggedPct: Number(((flagged / calls.length) * 100).toFixed(1)),
    });
  } catch (e) {
    console.error("Metrics error:", e);
    res.status(500).json({ error: "metrics_failed" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend ready: http://localhost:${PORT}`);
  console.log(`📡 STT: http://localhost:8000`);
  console.log(`⚖️ QA: http://localhost:8001`);
  console.log(`📁 Uploads: http://localhost:${PORT}/uploads`);
});
