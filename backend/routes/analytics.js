const express = require('express');
const router = express.Router();
const Call = require('../models/Call');

// Get overall metrics
router.get('/metrics/overview', async (req, res) => {
  try {
    const totalCalls = await Call.countDocuments();
    const scoredCalls = await Call.countDocuments({ status: 'scored' });
    
    const calls = await Call.find({ 'scores.overallScore': { $exists: true } });
    
    // Calculate averages
    const avgScore = calls.length > 0 
      ? calls.reduce((sum, c) => sum + (c.scores?.overallScore || 0), 0) / calls.length 
      : 0;
    
    const flaggedCalls = calls.filter(c => c.scores?.flags?.length > 0).length;
    const flaggedPct = calls.length > 0 ? ((flaggedCalls / calls.length) * 100).toFixed(1) : 0;
    
    const totalDuration = calls.reduce((sum, c) => sum + (c.metrics?.totalDuration || 0), 0);
    const avgDuration = calls.length > 0 ? (totalDuration / calls.length).toFixed(1) : 0;
    
    const avgAgentTalk = calls.length > 0
      ? calls.reduce((sum, c) => {
          const agentSec = c.metrics?.agentSeconds || 0;
          const total = c.metrics?.totalDuration || 1;
          return sum + ((agentSec / total) * 100);
        }, 0) / calls.length
      : 0;

    res.json({
      totalCalls,
      scoredCalls,
      avgScore: avgScore.toFixed(1),
      flaggedPct,
      avgDuration,
      avgAgentTalkPct: avgAgentTalk.toFixed(1),
      flaggedCalls
    });
  } catch (error) {
    console.error('Error fetching overview metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get agent leaderboard
router.get('/agents/leaderboard', async (req, res) => {
  try {
    const calls = await Call.find({ 'scores.overallScore': { $exists: true } });
    
    // Group by agent
    const agentStats = {};
    
    calls.forEach(call => {
      const agentId = call.agentId;
      if (!agentStats[agentId]) {
        agentStats[agentId] = {
          agentId,
          totalCalls: 0,
          totalScore: 0,
          flaggedCalls: 0,
          totalDuration: 0
        };
      }
      
      agentStats[agentId].totalCalls++;
      agentStats[agentId].totalScore += call.scores?.overallScore || 0;
      agentStats[agentId].flaggedCalls += (call.scores?.flags?.length > 0 ? 1 : 0);
      agentStats[agentId].totalDuration += call.metrics?.totalDuration || 0;
    });
    
    // Calculate averages and format
    const leaderboard = Object.values(agentStats).map(agent => ({
      agentId: agent.agentId,
      totalCalls: agent.totalCalls,
      avgScore: (agent.totalScore / agent.totalCalls).toFixed(1),
      flaggedPct: ((agent.flaggedCalls / agent.totalCalls) * 100).toFixed(1),
      avgDuration: (agent.totalDuration / agent.totalCalls).toFixed(1)
    }));
    
    // Sort by avgScore descending
    leaderboard.sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore));
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get trend data (daily scores for last 7/30 days)
router.get('/trends/scores', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    
    const calls = await Call.find({
      createdAt: { $gte: daysAgo },
      'scores.overallScore': { $exists: true }
    }).sort({ createdAt: 1 });
    
    // Group by date
    const trendData = {};
    
    calls.forEach(call => {
      const date = new Date(call.createdAt).toISOString().split('T')[0];
      if (!trendData[date]) {
        trendData[date] = {
          date,
          totalScore: 0,
          count: 0,
          flagged: 0
        };
      }
      
      trendData[date].totalScore += call.scores?.overallScore || 0;
      trendData[date].count++;
      trendData[date].flagged += (call.scores?.flags?.length > 0 ? 1 : 0);
    });
    
    // Calculate daily averages
    const trends = Object.values(trendData).map(day => ({
      date: day.date,
      avgScore: (day.totalScore / day.count).toFixed(1),
      callCount: day.count,
      flaggedCount: day.flagged
    }));
    
    res.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Get score distribution
router.get('/distribution/scores', async (req, res) => {
  try {
    const calls = await Call.find({ 'scores.overallScore': { $exists: true } });
    
    const distribution = {
      excellent: 0,  // 80-100
      good: 0,       // 60-79
      average: 0,    // 40-59
      poor: 0        // 0-39
    };
    
    calls.forEach(call => {
      const score = call.scores?.overallScore || 0;
      if (score >= 80) distribution.excellent++;
      else if (score >= 60) distribution.good++;
      else if (score >= 40) distribution.average++;
      else distribution.poor++;
    });
    
    res.json(distribution);
  } catch (error) {
    console.error('Error fetching distribution:', error);
    res.status(500).json({ error: 'Failed to fetch distribution' });
  }
});

module.exports = router;
