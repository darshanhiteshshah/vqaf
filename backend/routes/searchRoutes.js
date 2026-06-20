const express = require("express");
const axios = require("axios");

const Call = require("../models/call");
const cosineSimilarity = require("../utils/cosineSimilarity");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        error: "Query required"
      });
    }

    const embeddingResponse = await axios.post(
      "http://localhost:8001/embedding",
      { query }
    );

    const queryEmbedding = embeddingResponse.data.embedding;

    const calls = await Call.find({
      "scores.embedding.0": {
        $exists: true
      }
    });

    const results = calls.map((call) => {
      const similarity = cosineSimilarity(
        queryEmbedding,
        call.scores.embedding
      );

      return {
        callId: call.callId,
        agentId: call.agentId,
        score: call.scores.overallScore,
        category: call.scores.category,
        sentiment: call.scores.sentiment,
        summary: call.scores.summary,
        similarity
      };
    });

    results.sort((a, b) => b.similarity - a.similarity);

    res.json(results.slice(0, 10));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;
