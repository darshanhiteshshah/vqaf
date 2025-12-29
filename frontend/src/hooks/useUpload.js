import { useState } from 'react';
import { api } from '../utils/api';

export const useUpload = (onSuccess) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const uploadFile = async (file, agentId = 'agent-001') => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('audioFile', file);
      formData.append('agentId', agentId);
      formData.append('callId', `call_${Date.now()}`);

      const res = await api.uploadCall(formData);
      setResult(res.data);
      
      if (onSuccess) onSuccess(res.data);
      
      return res.data;
    } catch (err) {
      console.error('Upload error:', err);
      setError(err?.response?.data?.error || 'Upload failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { uploadFile, loading, error, result };
};
