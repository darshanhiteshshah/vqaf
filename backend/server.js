const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// Import models and routes
const Call = require('./models/call');
const callsRoutes = require('./routes/calls');
const analyticsRoutes = require('./routes/analytics');

// Shared uploads dir at repo root
const uploadDir = path.resolve(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({ dest: uploadDir });

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch((err) => console.error("❌ MongoDB:", err));

// Register routes
app.use('/api/calls', callsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      stt: 'http://localhost:8000',
      qa: 'http://localhost:8001'
    }
  });
});

// Upload + process pipeline
app.post("/api/uploads", upload.single("audioFile"), async (req, res) => {
  try {
    const { callId = `call_${Date.now()}`, agentId = "agent-001" } = req.body;
    const filename = req.file.filename;
    const audioUrl = filename;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📞 NEW CALL: ${callId}`);
    console.log(`📂 File: ${req.file.path}`);
    console.log(`👤 Agent: ${agentId}`);
    console.log(`${'='.repeat(60)}\n`);

    // 1️⃣ Create call record
    const call = new Call({ callId, agentId, audioUrl });
    await call.save();
    console.log("✅ Saved to MongoDB\n");

    // 2️⃣ STT with WhisperX
    console.log("🎤 Calling WhisperX STT at http://localhost:8000/transcribe");
    const sttResponse = await axios.post(
      "http://localhost:8000/transcribe",
      {
        audio_url: audioUrl,
        callId
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 300000
      }
    );

    console.log('\n' + '='.repeat(60));
    console.log('🔍 STT RESPONSE:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(sttResponse.data, null, 2));
    console.log('='.repeat(60) + '\n');

    const transcript = sttResponse.data.transcript || [];
    const { 
      duration: totalDuration, 
      agentSeconds, 
      customerSeconds, 
      confidence,
      method 
    } = sttResponse.data;

    console.log(`✅ STT Complete: ${transcript.length} segments, ${totalDuration?.toFixed(1) || 0}s duration\n`);

    // 3️⃣ Save transcript + metrics
    await call.updateOne({
      status: "transcribed",
      transcript: sttResponse.data,
      metrics: {
        totalDuration: totalDuration || 0,
        agentSeconds: agentSeconds || 0,
        customerSeconds: customerSeconds || 0,
        confidence: confidence || 0
      },
    });

    // ✅ 4️⃣ QA scoring - FIXED PAYLOAD
    console.log("⚖️ Calling QA service at http://localhost:8001/score");
    
    const qaPayload = {
      transcript: transcript,  // ✅ Direct array, not nested in 'data'
      metrics: {
        total_duration: totalDuration || 0,
        agent_speaking_time: agentSeconds || 0,
        customer_speaking_time: customerSeconds || 0,
        avg_confidence: confidence || 0
      },
      callId: callId,
      agentId: agentId
    };

    console.log('\n' + '='.repeat(60));
    console.log('🔍 QA PAYLOAD:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(qaPayload, null, 2));
    console.log('='.repeat(60) + '\n');

    const qaResponse = await axios.post(
      "http://localhost:8001/score",
      qaPayload,
      { 
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log('\n' + '='.repeat(60));
    console.log('🔍 QA RESPONSE:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(qaResponse.data, null, 2));
    console.log('='.repeat(60) + '\n');

    // 5️⃣ Finalize with scores
    await call.updateOne({
      status: "scored",
      scores: qaResponse.data
    });

    const agentTalkPct = totalDuration > 0 ? (agentSeconds / totalDuration * 100) : 0;

    console.log(`${'='.repeat(60)}`);
    console.log(`✅ PIPELINE COMPLETE: ${callId}`);
    console.log(`   Score: ${qaResponse.data.overallScore || qaResponse.data.overall_score}/100`);
    console.log(`   Agent Talk: ${agentTalkPct.toFixed(1)}%`);
    console.log(`${'='.repeat(60)}\n`);

    // Return to frontend
    res.json({
      jobId: call._id.toString(),
      status: "complete",
      scores: qaResponse.data,
      callId,
      filename,
      method: method || "Energy",
      metrics: {
        totalDuration: totalDuration || 0,
        duration: totalDuration || 0,
        agentSeconds: agentSeconds || 0,
        customerSeconds: customerSeconds || 0,
        agentTalkPct: agentTalkPct.toFixed(1),
        confidence: confidence || 0
      },
    });

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ PIPELINE ERROR');
    console.error('='.repeat(60));
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    console.error('='.repeat(60) + '\n');

    // Update call status on error
    if (req.body.callId) {
      const errorMsg = error.response?.data 
        ? (typeof error.response.data === 'string' 
            ? error.response.data 
            : JSON.stringify(error.response.data))
        : error.message;

      await Call.updateOne(
        { callId: req.body.callId },
        {
          status: "failed",
          error: errorMsg
        }
      ).catch(err => console.error('Failed to update error status:', err.message));
    }

    res.status(500).json({
      error: error.response?.data?.detail || error.response?.data?.error || error.message
    });
  }
});

// Legacy metrics endpoint
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
      const overall = c.scores?.overallScore || c.scores?.overall_score;
      if (typeof overall === "number") {
        sum += overall;
        countWithScores++;
        const flags = c.scores?.flags || [];
        if (flags.length > 0) flagged++;
      }
    }

    res.json({
      totalCalls: calls.length,
      avgOverall: countWithScores > 0 ? Number((sum / countWithScores).toFixed(1)) : null,
      flaggedPct: Number(((flagged / calls.length) * 100).toFixed(1)),
    });
  } catch (e) {
    console.error("Metrics error:", e);
    res.status(500).json({ error: "metrics_failed" });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend ready: http://localhost:${PORT}`);
  console.log(`📡 STT: http://localhost:8000`);
  console.log(`⚖️ QA: http://localhost:8001`);
  console.log(`📁 Uploads: ${uploadDir}`);
  console.log(`\n📊 API Endpoints:`);
  console.log(`   POST   /api/uploads`);
  console.log(`   GET    /api/calls`);
  console.log(`   GET    /api/calls/:callId`);
  console.log(`   GET    /api/analytics/metrics/overview`);
  console.log(`   GET    /api/analytics/agents/leaderboard`);
  console.log(`   GET    /api/analytics/trends/scores`);
  console.log(`   GET    /api/analytics/distribution/scores`);
  console.log(`   GET    /api/health`);
});
