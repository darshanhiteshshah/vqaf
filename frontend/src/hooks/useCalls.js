import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export const useCalls = (autoRefresh = true) => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const res = await api.getCalls();
      setCalls(res.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching calls:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
    
    if (autoRefresh) {
      const interval = setInterval(fetchCalls, 15000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return { calls, loading, error, refetch: fetchCalls };
};
