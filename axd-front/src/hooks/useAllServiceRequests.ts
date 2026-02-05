import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ServiceRequest {
  id: string;
  request_type_id: string;
  requester_id: string;
  requester_name: string;
  requester_email: string;
  title: string;
  description: string;
  form_data: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'submitted' | 'in_review' | 'approved' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  assignee_name?: string;
  assignee_email?: string;
  due_date?: string;
  completed_at?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  request_types?: {
    name: string;
    category_id: string;
  };
}

export function useAllServiceRequests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      fetchRequests();
    }
  }, [isAdmin]);

  async function fetchRequests() {
    if (!isAdmin) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          request_types (
            name,
            category_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Failed to fetch service requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateRequestStatus(
    requestId: string,
    newStatus: string,
    comment?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!user || !isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const { data, error } = await supabase.rpc('update_service_request_status', {
        p_request_id: requestId,
        p_new_status: newStatus,
        p_changed_by_id: user.id,
        p_changed_by_name: user.user_metadata?.full_name || user.email,
        p_comment: comment || null,
      });

      if (error) throw error;

      if (data?.success) {
        await fetchRequests();
        return { success: true };
      }

      return { success: false, error: data?.error || 'Failed to update status' };
    } catch (error: any) {
      console.error('Failed to update status:', error);
      return { success: false, error: error.message };
    }
  }

  async function assignRequest(
    requestId: string,
    assigneeName: string,
    assigneeEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const { error } = await supabase
        .from('service_requests')
        .update({
          assignee_name: assigneeName,
          assignee_email: assigneeEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      await fetchRequests();
      return { success: true };
    } catch (error: any) {
      console.error('Failed to assign request:', error);
      return { success: false, error: error.message };
    }
  }

  async function updatePriority(
    requestId: string,
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): Promise<{ success: boolean; error?: string }> {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const { error } = await supabase
        .from('service_requests')
        .update({
          priority,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      await fetchRequests();
      return { success: true };
    } catch (error: any) {
      console.error('Failed to update priority:', error);
      return { success: false, error: error.message };
    }
  }

  async function updateDueDate(
    requestId: string,
    dueDate: string | null
  ): Promise<{ success: boolean; error?: string }> {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const { error } = await supabase
        .from('service_requests')
        .update({
          due_date: dueDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      await fetchRequests();
      return { success: true };
    } catch (error: any) {
      console.error('Failed to update due date:', error);
      return { success: false, error: error.message };
    }
  }

  async function addAdminNote(
    requestId: string,
    note: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const { error } = await supabase
        .from('service_requests')
        .update({
          admin_notes: note,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      await fetchRequests();
      return { success: true };
    } catch (error: any) {
      console.error('Failed to add admin note:', error);
      return { success: false, error: error.message };
    }
  }

  return {
    requests,
    loading,
    refresh: fetchRequests,
    updateRequestStatus,
    assignRequest,
    updatePriority,
    updateDueDate,
    addAdminNote,
  };
}
