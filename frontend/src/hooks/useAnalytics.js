import { useCallback, useEffect, useState } from 'react';
import { api } from '../utils/api';

export const useAnalytics = (trendDays = 7) => {
  const [analytics, setAnalytics] = useState({
    overview: null,
    leaderboard: [],
    trends: [],
    distribution: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, leaderboardRes, trendsRes, distributionRes] = await Promise.all([
        api.getOverview(),
        api.getLeaderboard(),
        api.getTrends(trendDays),
        api.getDistribution()
      ]);

      setAnalytics({
        overview: overviewRes.data,
        leaderboard: leaderboardRes.data,
        trends: trendsRes.data,
        distribution: distributionRes.data
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [trendDays]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
};
