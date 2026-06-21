const axios = require("axios");
const Call = require("../models/Call");

const STT_URL = process.env.STT_URL || "http://localhost:8000";
const QA_URL = process.env.QA_URL || "http://localhost:8001";

function getOverallScore(scores) {
  return scores?.overallScore || scores?.overall_score || null;
}

async function processUploadedCall({ file, body }) {
  const { callId = `call_${Date.now()}`, agentId = "agent-001" } = body;
  const filename = file.filename;
  const audioUrl = file.path;

  const call = await createCallRecord({ callId, agentId, audioUrl });
  return processCallPipeline({ call, callId, agentId, filename, audioUrl });
}

async function createCallRecord({ callId, agentId, audioUrl }) {
  console.log(`New call: ${callId}`);
  console.log(`File: ${audioUrl}`);
  console.log(`Agent: ${agentId}`);

  const call = new Call({ callId, agentId, audioUrl });
  await call.save();
  return call;
}

async function processCallById({ callId }) {
  const call = await Call.findOne({ callId });
  if (!call) {
    throw new Error(`Call not found: ${callId}`);
  }

  await call.updateOne({ status: "processing", error: null });

  return processCallPipeline({
    call,
    callId: call.callId,
    agentId: call.agentId,
    filename: call.audioUrl?.split(/[\\/]/).pop(),
    audioUrl: call.audioUrl
  });
}

async function processCallPipeline({ call, callId, agentId, filename, audioUrl }) {
  try {
    const sttResponse = await axios.post(
      `${STT_URL}/transcribe`,
      { audio_url: audioUrl, callId },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 300000
      }
    );

    const transcript = sttResponse.data.transcript || [];
    const {
      duration: totalDuration,
      agentSeconds,
      customerSeconds,
      confidence,
      method
    } = sttResponse.data;

    await call.updateOne({
      status: "transcribed",
      transcript: sttResponse.data,
      metrics: {
        totalDuration: totalDuration || 0,
        agentSeconds: agentSeconds || 0,
        customerSeconds: customerSeconds || 0,
        confidence: confidence || 0
      }
    });

    const qaPayload = {
      transcript,
      metrics: {
        total_duration: totalDuration || 0,
        agent_speaking_time: agentSeconds || 0,
        customer_speaking_time: customerSeconds || 0,
        avg_confidence: confidence || 0
      },
      callId,
      agentId
    };

    const qaResponse = await axios.post(`${QA_URL}/score`, qaPayload, {
      timeout: 30000,
      headers: { "Content-Type": "application/json" }
    });

    await call.updateOne({
      status: "scored",
      scores: qaResponse.data
    });

    const agentTalkPct = totalDuration > 0 ? (agentSeconds / totalDuration) * 100 : 0;
    const score = getOverallScore(qaResponse.data);

    console.log(`Pipeline complete: ${callId}`);
    console.log(`Score: ${score ?? "N/A"}/100`);
    console.log(`Agent talk: ${agentTalkPct.toFixed(1)}%`);

    return {
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
      }
    };
  } catch (error) {
    const errorMsg = error.response?.data
      ? typeof error.response.data === "string"
        ? error.response.data
        : JSON.stringify(error.response.data)
      : error.message;

    await Call.updateOne(
      { callId },
      {
        status: "failed",
        error: errorMsg
      }
    ).catch((updateError) => {
      console.error("Failed to update error status:", updateError.message);
    });

    throw error;
  }
}

async function queueUploadedCall({ file, body }) {
  const { callId = `call_${Date.now()}`, agentId = "agent-001" } = body;
  const filename = file.filename;
  const audioUrl = file.path;
  const call = await createCallRecord({ callId, agentId, audioUrl });

  setImmediate(async () => {
    try {
      await processCallPipeline({ call, callId, agentId, filename, audioUrl });
    } catch (error) {
      console.error(`Background pipeline failed for ${callId}:`, error.response?.data || error.message);
    }
  });

  return {
    jobId: call._id.toString(),
    status: "processing",
    callId,
    filename
  };
}

module.exports = {
  createCallRecord,
  processCallById,
  processUploadedCall,
  queueUploadedCall
};
