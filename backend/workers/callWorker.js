const { Worker } = require("bullmq");
const mongoose = require("mongoose");
require("dotenv").config();

const { connection, redisUrl } = require("../queues/callQueue");
const { processCallById } = require("../services/processCall");

async function start() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("Call worker connected to MongoDB");
  console.log(`Call worker connected to Redis: ${redisUrl}`);

  const worker = new Worker(
    "call-processing",
    async (job) => {
      console.log(`Processing call job ${job.id}`);
      return processCallById({ callId: job.data.callId });
    },
    {
      connection,
      concurrency: Number(process.env.CALL_WORKER_CONCURRENCY || 1),
      lockDuration: Number(process.env.CALL_JOB_LOCK_MS || 1000 * 60 * 10)
    }
  );

  worker.on("completed", (job) => {
    console.log(`Call job completed: ${job.id}`);
  });

  worker.on("failed", (job, error) => {
    console.error(`Call job failed: ${job?.id}`, error.message);
  });
}

start().catch((error) => {
  console.error("Call worker failed to start:", error);
  process.exit(1);
});
