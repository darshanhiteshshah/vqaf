export const getCallMetrics = (callData) => {
  const metrics = callData?.metrics || {};
  const duration = metrics.totalDuration || metrics.duration || 0;
  const agentSeconds = metrics.agentSeconds || 0;
  const customerSeconds = metrics.customerSeconds || 0;
  const confidence = metrics.confidence || 0;
  
  const agentPct = duration > 0 ? ((agentSeconds / duration) * 100).toFixed(1) : "0.0";
  const customerPct = duration > 0 ? ((customerSeconds / duration) * 100).toFixed(1) : "0.0";
  
  return {
    duration: duration.toFixed(1),
    agentSeconds: agentSeconds.toFixed(1),
    customerSeconds: customerSeconds.toFixed(1),
    agentPct,
    customerPct,
    confidence: (confidence * 100).toFixed(0)
  };
};

export const getScoreColor = (score) => {
  if (score >= 80) return 'green';
  if (score >= 60) return 'blue';
  if (score >= 40) return 'yellow';
  return 'red';
};

export const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  return 'Poor';
};
