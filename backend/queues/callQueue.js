const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null
});

const callQueue = new Queue("call-processing", {
  connection,
  defaultJobOptions: {
    attempts: Number(process.env.CALL_JOB_ATTEMPTS || 2),
    backoff: {
      type: "exponential",
      delay: Number(process.env.CALL_JOB_BACKOFF_MS || 5000)
    },
    removeOnComplete: {
      age: 60 * 60 * 24,
      count: 500
    },
    removeOnFail: {
      age: 60 * 60 * 24 * 7,
      count: 500
    }
  }
});

async function addCallJob(call) {
  return callQueue.add(
    "process-call",
    {
      callId: call.callId,
      agentId: call.agentId,
      filename: call.audioUrl?.split(/[\\/]/).pop(),
      audioUrl: call.audioUrl
    },
    {
      jobId: call.callId
    }
  );
}

module.exports = {
  addCallJob,
  callQueue,
  connection,
  redisUrl
};
