import axios from 'axios';

const API_BASE = 'http://localhost:3001';

export const api = {
  // Calls
  getCalls: () => axios.get(`${API_BASE}/api/calls`),
  getCall: (callId) => axios.get(`${API_BASE}/api/calls/${callId}`),
  
  // Upload
  uploadCall: (formData) => 
    axios.post(`${API_BASE}/api/uploads`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  // Analytics
  getOverview: () => axios.get(`${API_BASE}/api/analytics/metrics/overview`),
  getLeaderboard: () => axios.get(`${API_BASE}/api/analytics/agents/leaderboard`),
  getTrends: (days = 7) => axios.get(`${API_BASE}/api/analytics/trends/scores?days=${days}`),
  getDistribution: () => axios.get(`${API_BASE}/api/analytics/distribution/scores`),
  
  // Legacy
  getMetrics: (limit = 50) => axios.get(`${API_BASE}/api/metrics?limit=${limit}`)
};
