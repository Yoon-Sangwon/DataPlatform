import { useState, useEffect } from 'react';
import axios from 'axios';

export interface AdminStats {
  pendingPermissions: number;
  pendingRequests: number;
  newComments: number;
  activeUsers: number;
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({
    pendingPermissions: 0,
    pendingRequests: 0,
    newComments: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  }

  return { stats, loading, refresh: fetchStats };
}
