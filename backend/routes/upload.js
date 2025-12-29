const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const Call = require('../models/call');

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

const upload = multer({ storage });

// Upload endpoint
router.post('/', upload.single('audioFile'), async (req, res) => {
  let callId = null;
  
  try {
    callId = req.body.callId;
    const agentId = req.body.agentId;
    const audioPath = req.file.path;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📞 NEW UPLOAD: ${callId}`);
    console.log(`📂 File: ${audioPath}`);
    console.log(`👤 Agent: ${agentId}`);
    console.log(`${'='.repeat(60)}\n`);

    // 1. Save to MongoDB
    const call = await Call.create({
      callId,
      agentId,
      audioUrl: audioPath,
      status: "uploaded"
    });
    console.log('✅ Saved to MongoDB\n');

    // 2. Call STT Service
    console.log('🎤 Calling WhisperX STT service at http://localhost:8000/transcribe');
    const sttResponse = await axios.post(
      'http://localhost:8000/transcribe',
      { audio_path: audioPath },
      { timeout: 300000 }
    );

    console.log('\n' + '='.repeat(60));
    console.log('🔍 FULL STT RESPONSE:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(sttResponse.data, null, 2));
    console.log('='.repeat(60) + '\n');

    const sttData = sttResponse.data;
    
    // Check structure
    console.log('📊 STT Data Structure Check:');
    console.log(`   - Has 'segments' key: ${!!sttData.segments}`);
    console.log(`   - Has 'metadata' key: ${!!sttData.metadata}`);
    console.log(`   - Segments count: ${sttData.segments?.length || 0}`);
    console.log(`   - Duration: ${sttData.metadata?.total_duration || 0}s\n`);

    if (!sttData.segments || sttData.segments.length === 0) {
      throw new Error('❌ No segments returned from STT service');
    }

    // 3. Prepare QA Payload
    const qaPayload = {
      transcript: sttData.segments,
      metrics: {
        total_duration: sttData.metadata?.total_duration || 0,
        agent_speaking_time: sttData.metadata?.agent_speaking_time || 0,
        customer_speaking_time: sttData.metadata?.customer_speaking_time || 0,
        avg_confidence: sttData.metadata?.avg_confidence || 0
      },
      callId: callId,
      agentId: agentId
    };

    console.log('='.repeat(60));
    console.log('🔍 QA PAYLOAD BEING SENT:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(qaPayload, null, 2));
    console.log('='.repeat(60) + '\n');

    // 4. Call QA Service
    console.log('⚖️ Calling QA service at http://localhost:8001/evaluate\n');
    const qaResponse = await axios.post(
      'http://localhost:8001/evaluate',
      qaPayload,
      { 
        timeout: 60000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const qaData = qaResponse.data;
    console.log(`✅ QA Complete! Score: ${qaData.overall_score}/100\n`);

    // 5. Update MongoDB
    await Call.findOneAndUpdate(
      { callId },
      {
        status: "scored",
        transcript: sttData,
        scores: qaData,
        metrics: {
          totalDuration: sttData.metadata?.total_duration,
          agentSeconds: sttData.metadata?.agent_speaking_time,
          customerSeconds: sttData.metadata?.customer_speaking_time,
          confidence: sttData.metadata?.avg_confidence
        }
      }
    );

    console.log(`${'='.repeat(60)}`);
    console.log(`✅ PIPELINE COMPLETE: ${callId}`);
    console.log(`   Score: ${qaData.overall_score}/100`);
    console.log(`   Agent Time: ${sttData.metadata?.agent_speaking_time}s`);
    console.log(`${'='.repeat(60)}\n`);

    res.json({
      success: true,
      callId,
      transcript: sttData,
      scores: qaData,
      message: "Analysis complete"
    });

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ PIPELINE ERROR');
    console.error('='.repeat(60));
    console.error('Error Details:', error.response?.data || error.message);
    console.error('='.repeat(60) + '\n');

    // Save error to DB
    const errorMsg = error.response?.data 
      ? (typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data))
      : error.message;

    if (callId) {
      try {
        await Call.findOneAndUpdate(
          { callId },
          { 
            status: "failed", 
            error: errorMsg
          }
        );
        console.log('✅ Error saved to database\n');
      } catch (dbError) {
        console.error('❌ Failed to save error to DB:', dbError.message);
      }
    }

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

module.exports = router;
