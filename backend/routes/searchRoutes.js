const express = require("express");
const axios = require("axios");

const Call = require("../models/call");
const cosineSimilarity = require("../utils/cosineSimilarity");

const router = express.Router();

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "call",
  "calls",
  "for",
  "from",
  "has",
  "have",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "show",
  "that",
  "the",
  "to",
  "was",
  "were",
  "with"
]);

const SYNONYMS = {
  angry: ["angry", "frustrated", "upset", "annoyed", "irate", "furious"],
  bad: ["bad", "poor", "terrible", "awful", "negative", "low"],
  billing: ["billing", "bill", "invoice", "payment", "charge", "charged"],
  cancel: ["cancel", "cancellation", "terminate", "close account"],
  complaint: ["complaint", "issue", "problem", "concern", "critical"],
  empathy: ["empathy", "empathetic"],
  greeting: ["greeting", "hello", "hi", "opening", "welcome"],
  refund: ["refund", "return", "reimbursement", "money back"],
  rude: ["rude", "impolite", "unprofessional", "discourteous"],
  unresolved: ["unresolved", "not resolved", "failed", "pending", "escalated"]
};

const LOW_MODIFIERS = ["bad", "low", "lack", "lacking", "poor", "no", "not", "missing", "weak", "without"];
const HIGH_MODIFIERS = ["best", "good", "great", "high", "positive", "strong"];

function normalizeText(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(" ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function tokenize(text) {
  return normalizeText(text)
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((token) => token.length > 2 && !STOP_WORDS.has(token)) || [];
}

function expandTokens(tokens) {
  const expanded = new Set(tokens);

  for (const token of tokens) {
    const matches = SYNONYMS[token];
    if (matches) matches.forEach((match) => expanded.add(match));
  }

  return [...expanded];
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function scoreBelow(value, threshold) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  if (number >= threshold) return 0;
  return Math.min((threshold - number) / threshold, 1);
}

function scoreAbove(value, threshold) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  if (number <= threshold) return 0;
  return Math.min((number - threshold) / (100 - threshold), 1);
}

function buildSearchDocument(call) {
  const scores = call.scores || {};
  const transcriptSegments = call.transcript?.transcript || [];
  const transcriptText = transcriptSegments
    .map((segment) => `${segment.speaker || ""}: ${segment.text || ""}`)
    .join(" ");

  const fields = {
    callId: call.callId,
    agentId: call.agentId,
    category: scores.category,
    sentiment: scores.sentiment,
    summary: scores.summary,
    criticalIssues: scores.criticalIssues,
    weaknesses: scores.weaknesses,
    strengths: scores.strengths,
    coaching: scores.coaching,
    actionItems: scores.actionItems,
    flags: scores.flags,
    fullTranscript: scores.fullTranscript || transcriptText,
    searchText: scores.searchText
  };

  return {
    fields,
    text: Object.values(fields).map(normalizeText).join(" ")
  };
}

function calculateKeywordScore(query, queryTerms, document) {
  const fieldWeights = {
    callId: 0.6,
    agentId: 0.4,
    category: 1.2,
    sentiment: 1.1,
    summary: 1.4,
    criticalIssues: 1.8,
    weaknesses: 1.5,
    strengths: 1,
    coaching: 1.2,
    actionItems: 1.2,
    flags: 1.7,
    fullTranscript: 0.9,
    searchText: 1.3
  };

  let weightedHits = 0;
  let totalFieldWeight = 0;
  const matchedTerms = new Set();
  const normalizedQuery = query.toLowerCase().trim();

  for (const [field, value] of Object.entries(document.fields)) {
    const text = normalizeText(value).toLowerCase();
    if (!text) continue;

    const weight = fieldWeights[field] || 1;
    totalFieldWeight += weight;

    if (normalizedQuery.length > 3 && text.includes(normalizedQuery)) {
      weightedHits += weight;
      matchedTerms.add(normalizedQuery);
    }

    let fieldTermHits = 0;
    for (const term of queryTerms) {
      if (text.includes(term)) {
        fieldTermHits++;
        matchedTerms.add(term);
      }
    }

    if (queryTerms.length > 0) {
      weightedHits += weight * (fieldTermHits / queryTerms.length);
    }
  }

  if (totalFieldWeight === 0) {
    return { score: 0, matchedTerms: [] };
  }

  return {
    score: Math.min(weightedHits / totalFieldWeight, 1),
    matchedTerms: [...matchedTerms].slice(0, 8)
  };
}

function calculateConceptScore(query, call, document) {
  const scores = call.scores || {};
  const queryText = query.toLowerCase();
  const documentText = document.text.toLowerCase();
  const matchedTerms = new Set();
  let score = 0;
  let conceptCount = 0;

  const hasLowIntent = hasAny(queryText, LOW_MODIFIERS);
  const hasHighIntent = hasAny(queryText, HIGH_MODIFIERS);

  if (queryText.includes("empathy") || queryText.includes("empathetic")) {
    conceptCount++;

    if (hasLowIntent) {
      const numericMatch = scoreBelow(scores.empathy, 70);
      const textMatch = hasAny(documentText, [
        "lack of empathy",
        "low empathy",
        "no empathy",
        "not empathetic",
        "failed to empathize",
        "did not acknowledge",
        "didn't acknowledge"
      ]) ? 1 : 0;

      const conceptMatch = Math.max(numericMatch, textMatch);
      score += conceptMatch;
      if (conceptMatch > 0) matchedTerms.add("low empathy");
    } else if (hasHighIntent) {
      const conceptMatch = Math.max(scoreAbove(scores.empathy, 75), scoreAbove(scores.courtesy, 75));
      score += conceptMatch;
      if (conceptMatch > 0) matchedTerms.add("strong empathy");
    }
  }

  if (queryText.includes("greeting") || queryText.includes("greet")) {
    conceptCount++;

    if (hasLowIntent) {
      const conceptMatch = Math.max(
        scoreBelow(scores.greeting, 70),
        hasAny(documentText, [
          "no greeting",
          "lack of a professional greeting",
          "failed to greet",
          "did not greet",
          "missing greeting"
        ]) ? 1 : 0
      );

      score += conceptMatch;
      if (conceptMatch > 0) matchedTerms.add("missing greeting");
    } else {
      const conceptMatch = scoreAbove(scores.greeting, 75);
      score += conceptMatch;
      if (conceptMatch > 0) matchedTerms.add("good greeting");
    }
  }

  if (
    queryText.includes("unresolved") ||
    queryText.includes("not resolved") ||
    queryText.includes("resolution") ||
    queryText.includes("resolve")
  ) {
    conceptCount++;

    const conceptMatch = Math.max(
      scoreBelow(scores.resolution, 70),
      hasAny(documentText, [
        "unresolved",
        "not resolved",
        "failed to resolve",
        "did not resolve",
        "could not resolve",
        "resolution failed",
        "requires follow-up",
        "escalated"
      ]) ? 1 : 0
    );

    score += conceptMatch;
    if (conceptMatch > 0) matchedTerms.add("unresolved");
  }

  if (queryText.includes("negative sentiment") || queryText.includes("angry") || queryText.includes("frustrated")) {
    conceptCount++;

    const sentimentText = normalizeText(scores.sentiment).toLowerCase();
    const conceptMatch = Math.max(
      sentimentText.includes("negative") ? 1 : 0,
      scores.customerFrustration ? 1 : 0,
      scoreBelow(scores.customerSatisfaction, 55),
      hasAny(documentText, ["angry", "frustrated", "upset", "negative sentiment"]) ? 0.7 : 0
    );

    score += conceptMatch;
    if (conceptMatch > 0) matchedTerms.add("negative sentiment");
  }

  if (queryText.includes("low score") || queryText.includes("poor score") || queryText.includes("bad score")) {
    conceptCount++;
    const conceptMatch = scoreBelow(scores.overallScore, 65);
    score += conceptMatch;
    if (conceptMatch > 0) matchedTerms.add("low score");
  }

  if (conceptCount === 0) {
    return { score: 0, matchedTerms: [] };
  }

  return {
    score: Math.min(score / conceptCount, 1),
    matchedTerms: [...matchedTerms]
  };
}

function makeSnippet(document, matchedTerms) {
  const haystack =
    normalizeText(document.fields.summary) ||
    normalizeText(document.fields.searchText) ||
    normalizeText(document.fields.fullTranscript);

  if (!haystack) return "";

  const lower = haystack.toLowerCase();
  const firstMatch = matchedTerms.find((term) => lower.includes(term.toLowerCase()));
  const index = firstMatch ? lower.indexOf(firstMatch.toLowerCase()) : 0;
  const start = Math.max(index - 80, 0);
  const end = Math.min(start + 220, haystack.length);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < haystack.length ? "..." : "";

  return `${prefix}${haystack.slice(start, end).trim()}${suffix}`;
}

router.post("/", async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;

    if (!query?.trim()) {
      return res.status(400).json({
        error: "Query required"
      });
    }

    const queryTerms = expandTokens(tokenize(query));
    let queryEmbedding = [];

    try {
      const embeddingResponse = await axios.post(
        "http://localhost:8001/embedding",
        { query },
        { timeout: 20000 }
      );
      queryEmbedding = embeddingResponse.data.embedding || [];
    } catch (embeddingError) {
      console.warn("Embedding search fallback:", embeddingError.message);
    }

    const calls = await Call.find({ status: "scored" });

    const results = calls
      .map((call) => {
        const document = buildSearchDocument(call);
        const keyword = calculateKeywordScore(query, queryTerms, document);
        const concept = calculateConceptScore(query, call, document);
        const semanticSimilarity = cosineSimilarity(
          queryEmbedding,
          call.scores?.embedding
        );
        const semanticScore = Math.max(Number.isFinite(semanticSimilarity) ? semanticSimilarity : 0, 0);
        const hasEmbedding = queryEmbedding.length > 0 && call.scores?.embedding?.length > 0;
        const relevance = hasEmbedding
          ? Math.max(concept.score, keyword.score, (semanticScore * 0.45) + (keyword.score * 0.25) + (concept.score * 0.3))
          : Math.max(concept.score, keyword.score);

        return {
          callId: call.callId,
          agentId: call.agentId,
          score: call.scores?.overallScore,
          category: call.scores?.category,
          sentiment: call.scores?.sentiment,
          summary: call.scores?.summary,
          criticalIssues: call.scores?.criticalIssues || [],
          weaknesses: call.scores?.weaknesses || [],
          createdAt: call.createdAt,
          relevance,
          similarity: semanticSimilarity,
          keywordScore: keyword.score,
          conceptScore: concept.score,
          matchedTerms: [...new Set([...concept.matchedTerms, ...keyword.matchedTerms])].slice(0, 8),
          snippet: makeSnippet(document, [...concept.matchedTerms, ...keyword.matchedTerms])
        };
      })
      .filter((result) => result.relevance > 0 || result.keywordScore > 0 || result.conceptScore > 0);

    results.sort((a, b) => b.relevance - a.relevance);

    res.json(results.slice(0, Math.min(Number(limit) || 10, 25)));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;
