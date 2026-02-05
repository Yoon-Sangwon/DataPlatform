import { useState, useEffect, useCallback } from 'react';
import {
  supabase,
  PermissionLevel,
  AssetPermission,
  PermissionRequest,
  PurposeCategory,
  RequestDuration,
  SensitivityLevel,
} from '../lib/supabase';

interface UseAssetPermissionResult {
  permissionLevel: PermissionLevel;
  permission: AssetPermission | null;
  pendingRequest: PermissionRequest | null;
  loading: boolean;
  error: string | null;
  submitRequest: (params: SubmitRequestParams) => Promise<boolean>;
  cancelRequest: () => Promise<boolean>;
}

interface SubmitRequestParams {
  requestedLevel: 'viewer' | 'editor';
  purposeCategory: PurposeCategory;
  reason: string;
  duration: RequestDuration;
  requesterName?: string;
  requesterEmail?: string;
}

export function useAssetPermission(
  assetId: string | null,
  sensitivityLevel: SensitivityLevel = 'public'
): UseAssetPermissionResult {
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>('none');
  const [permission, setPermission] = useState<AssetPermission | null>(null);
  const [pendingRequest, setPendingRequest] = useState<PermissionRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermission = useCallback(async () => {
    if (!assetId) {
      setPermissionLevel('none');
      setPermission(null);
      setPendingRequest(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      const demoUserId = '00000000-0000-0000-0000-000000000001';
      const userId = user?.id || demoUserId;

      if (!user) {
        if (sensitivityLevel === 'public') {
          setPermissionLevel('viewer');
        } else {
          setPermissionLevel('none');
        }
        setPermission(null);
      }

      const [permissionResult, requestResult] = await Promise.all([
        user ? supabase
          .from('asset_permissions')
          .select('*')
          .eq('asset_id', assetId)
          .eq('user_id', userId)
          .is('revoked_at', null)
          .maybeSingle() : Promise.resolve({ data: null, error: null }),
        supabase
          .from('permission_requests')
          .select('*')
          .eq('asset_id', assetId)
          .eq('requester_id', userId)
          .eq('status', 'pending')
          .maybeSingle(),
      ]);

      if (permissionResult.error) throw permissionResult.error;
      if (requestResult.error) throw requestResult.error;

      const perm = permissionResult.data as AssetPermission | null;
      const request = requestResult.data as PermissionRequest | null;

      if (perm) {
        const isExpired = perm.expires_at && new Date(perm.expires_at) < new Date();
        if (!isExpired) {
          setPermission(perm);
          setPermissionLevel(perm.permission_level);
        } else {
          setPermission(null);
          setPermissionLevel('none');
        }
      } else {
        setPermission(null);
        if (sensitivityLevel === 'public') {
          setPermissionLevel('viewer');
        } else {
          setPermissionLevel('none');
        }
      }

      setPendingRequest(request);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setPermissionLevel('none');
    } finally {
      setLoading(false);
    }
  }, [assetId, sensitivityLevel]);

  useEffect(() => {
    fetchPermission();
  }, [fetchPermission]);

  const submitRequest = useCallback(
    async (params: SubmitRequestParams): Promise<boolean> => {
      if (!assetId) return false;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        const demoUserId = '00000000-0000-0000-0000-000000000001';
        const userId = user?.id || demoUserId;
        const userName = params.requesterName || user?.email?.split('@')[0] || 'Demo User';
        const userEmail = params.requesterEmail || user?.email || 'demo@example.com';

        const { error } = await supabase.from('permission_requests').insert({
          asset_id: assetId,
          requester_id: userId,
          requester_name: userName,
          requester_email: userEmail,
          requested_level: params.requestedLevel,
          purpose_category: params.purposeCategory,
          reason: params.reason,
          duration: params.duration,
          status: 'pending',
        });

        if (error) throw error;

        await fetchPermission();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        return false;
      }
    },
    [assetId, fetchPermission]
  );

  const cancelRequest = useCallback(async (): Promise<boolean> => {
    if (!pendingRequest) return false;

    try {
      const { error } = await supabase
        .from('permission_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', pendingRequest.id);

      if (error) throw error;

      await fetchPermission();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  }, [pendingRequest, fetchPermission]);

  return {
    permissionLevel,
    permission,
    pendingRequest,
    loading,
    error,
    submitRequest,
    cancelRequest,
  };
}

export function canViewMetadata(
  sensitivityLevel: SensitivityLevel,
  permissionLevel: PermissionLevel
): boolean {
  if (sensitivityLevel === 'public') return true;
  if (sensitivityLevel === 'private') return true;
  return permissionLevel !== 'none';
}

export function canViewSchema(
  sensitivityLevel: SensitivityLevel,
  permissionLevel: PermissionLevel
): boolean {
  if (sensitivityLevel === 'public') return true;
  if (sensitivityLevel === 'private') return true;
  return permissionLevel !== 'none';
}

export function canViewPreview(
  sensitivityLevel: SensitivityLevel,
  permissionLevel: PermissionLevel
): boolean {
  if (sensitivityLevel === 'public') return true;
  return permissionLevel !== 'none';
}

export function canViewData(
  sensitivityLevel: SensitivityLevel,
  permissionLevel: PermissionLevel
): boolean {
  return permissionLevel !== 'none';
}

export function getPermissionBadgeInfo(
  permissionLevel: PermissionLevel,
  hasPendingRequest: boolean
): { label: string; variant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' } {
  if (permissionLevel === 'owner') {
    return { label: '관리자 권한', variant: 'success' };
  }
  if (permissionLevel === 'editor') {
    return { label: '수정 권한', variant: 'default' };
  }
  if (permissionLevel === 'viewer') {
    return { label: '조회 권한', variant: 'secondary' };
  }
  if (hasPendingRequest) {
    return { label: '승인 대기 중', variant: 'warning' };
  }
  return { label: '권한 없음', variant: 'outline' };
}

export function getSensitivityBadgeInfo(sensitivityLevel: SensitivityLevel): {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'warning' | 'error';
} {
  switch (sensitivityLevel) {
    case 'confidential':
      return { label: '기밀', variant: 'error' };
    case 'private':
      return { label: '비공개', variant: 'warning' };
    default:
      return { label: '공개', variant: 'secondary' };
  }
}
