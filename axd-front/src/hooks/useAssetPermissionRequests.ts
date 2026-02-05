import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PermissionRequestCounts {
  [assetId: string]: number;
}

export function useAssetPermissionRequests(assetId?: string) {
  const [counts, setCounts] = useState<PermissionRequestCounts>({});
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      if (assetId) {
        fetchRequestsForAsset(assetId);
      } else {
        fetchAllCounts();
      }
    }
  }, [isAdmin, assetId]);

  async function fetchAllCounts() {
    if (!isAdmin) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('permission_requests')
        .select('asset_id')
        .eq('status', 'pending');

      if (error) throw error;

      const countMap: PermissionRequestCounts = {};
      (data || []).forEach((item) => {
        countMap[item.asset_id] = (countMap[item.asset_id] || 0) + 1;
      });

      setCounts(countMap);
    } catch (error) {
      console.error('Failed to fetch permission request counts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRequestsForAsset(assetId: string) {
    if (!isAdmin) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('permission_requests')
        .select(`
          *,
          data_assets (
            name,
            description
          )
        `)
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Failed to fetch permission requests for asset:', error);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    if (assetId) {
      await fetchRequestsForAsset(assetId);
    } else {
      await fetchAllCounts();
    }
  }

  return {
    counts,
    requests,
    loading,
    refresh,
    pendingCount: assetId ? requests.filter(r => r.status === 'pending').length : 0,
  };
}
