import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface PermissionRequest {
  id: string;
  asset_id: string;
  requester_id: string;
  requester_name: string;
  requester_email: string;
  requested_level: 'viewer' | 'developer' | 'owner';
  purpose_category: 'analysis' | 'reporting' | 'development' | 'other';
  reason: string;
  duration: '1month' | '3months' | '6months' | 'permanent';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewer_id?: string;
  reviewer_name?: string;
  reviewer_comment?: string;
  reviewed_at?: string;
  expired_at?: string;
  created_at: string;
  updated_at: string;
  data_assets?: {
    name: string;
    description: string;
    owner_name: string;
  };
}

export function useAllPermissionRequests(status?: string) {
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      fetchRequests();
    }
  }, [isAdmin, status]);

  async function fetchRequests() {
    if (!isAdmin) return;

    try {
      setLoading(true);

      let query = supabase
        .from('permission_requests')
        .select(`
          *,
          data_assets (
            name,
            description,
            owner_name
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Failed to fetch permission requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function approveRequest(
    requestId: string,
    comment?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!user || !isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const { data, error } = await supabase.rpc('approve_permission_request', {
        p_request_id: requestId,
        p_reviewer_id: user.id,
        p_reviewer_name: user.user_metadata?.full_name || user.email,
        p_reviewer_comment: comment || null,
      });

      if (error) throw error;

      if (data?.success) {
        await fetchRequests();
        return { success: true };
      }

      return { success: false, error: data?.error || 'Failed to approve request' };
    } catch (error: any) {
      console.error('Failed to approve request:', error);
      return { success: false, error: error.message };
    }
  }

  async function rejectRequest(
    requestId: string,
    comment: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!user || !isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const { data, error } = await supabase.rpc('reject_permission_request', {
        p_request_id: requestId,
        p_reviewer_id: user.id,
        p_reviewer_name: user.user_metadata?.full_name || user.email,
        p_reviewer_comment: comment,
      });

      if (error) throw error;

      if (data?.success) {
        await fetchRequests();
        return { success: true };
      }

      return { success: false, error: data?.error || 'Failed to reject request' };
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      return { success: false, error: error.message };
    }
  }

  return {
    requests,
    loading,
    refresh: fetchRequests,
    approveRequest,
    rejectRequest,
  };
}
