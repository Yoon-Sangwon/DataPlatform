import { useState, useEffect, useCallback } from 'react';
import { supabase, PermissionRequest } from '../lib/supabase';

interface PermissionRequestWithAsset extends PermissionRequest {
  asset_name?: string;
  asset_schema?: string;
  asset_database?: string;
}

interface UseMyPermissionRequestsResult {
  requests: PermissionRequestWithAsset[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  cancelRequest: (requestId: string) => Promise<boolean>;
}

export function useMyPermissionRequests(): UseMyPermissionRequestsResult {
  const [requests, setRequests] = useState<PermissionRequestWithAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRequests([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('permission_requests')
        .select(`
          *,
          data_assets (
            name,
            schema_name,
            database_name
          )
        `)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedData: PermissionRequestWithAsset[] = (data || []).map((item) => {
        const asset = item.data_assets as { name: string; schema_name: string; database_name: string } | null;
        return {
          ...item,
          asset_name: asset?.name,
          asset_schema: asset?.schema_name,
          asset_database: asset?.database_name,
          data_assets: undefined,
        };
      });

      setRequests(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const cancelRequest = useCallback(
    async (requestId: string): Promise<boolean> => {
      try {
        const { error: updateError } = await supabase
          .from('permission_requests')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', requestId)
          .eq('status', 'pending');

        if (updateError) throw updateError;

        await fetchRequests();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        return false;
      }
    },
    [fetchRequests]
  );

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
    cancelRequest,
  };
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return '승인 대기';
    case 'approved':
      return '승인됨';
    case 'rejected':
      return '거절됨';
    case 'cancelled':
      return '취소됨';
    default:
      return status;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'text-amber-500';
    case 'approved':
      return 'text-emerald-500';
    case 'rejected':
      return 'text-red-500';
    case 'cancelled':
      return 'text-muted-foreground';
    default:
      return 'text-foreground';
  }
}

export function getLevelLabel(level: string): string {
  switch (level) {
    case 'viewer':
      return '조회 권한';
    case 'developer':
      return '개발자 권한';
    case 'owner':
      return '관리자 권한';
    default:
      return level;
  }
}

export function getPurposeLabel(purpose: string): string {
  switch (purpose) {
    case 'analysis':
      return '데이터 분석';
    case 'reporting':
      return '리포팅/대시보드';
    case 'development':
      return '개발/테스트';
    case 'other':
      return '기타';
    default:
      return purpose;
  }
}

export function getDurationLabel(duration: string): string {
  switch (duration) {
    case '1month':
      return '1개월';
    case '3months':
      return '3개월';
    case '6months':
      return '6개월';
    case 'permanent':
      return '영구';
    default:
      return duration;
  }
}
