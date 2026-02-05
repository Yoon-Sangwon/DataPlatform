import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

      const [permissionsResult, requestsResult, commentsResult] = await Promise.all([
        supabase
          .from('permission_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        supabase
          .from('service_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'submitted'),

        supabase
          .from('asset_comments')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      setStats({
        pendingPermissions: permissionsResult.count || 0,
        pendingRequests: requestsResult.count || 0,
        newComments: commentsResult.count || 0,
        activeUsers: 12,
      });
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  }

  return { stats, loading, refresh: fetchStats };
}
