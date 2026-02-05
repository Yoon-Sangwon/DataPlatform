import { useState, useEffect, useCallback } from 'react';
import { supabase, RequestCategory, RequestType, ServiceRequest, ServiceRequestPriority } from '../lib/supabase';

export function useRequestCategories() {
  const [categories, setCategories] = useState<RequestCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('request_categories')
        .select('*')
        .order('sort_order');

      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        setCategories(data || []);
      }
      setLoading(false);
    }

    fetchCategories();
  }, []);

  return { categories, loading };
}

export function useRequestTypes(categoryId: string | null) {
  const [types, setTypes] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoryId) {
      setTypes([]);
      return;
    }

    async function fetchTypes() {
      setLoading(true);
      const { data, error } = await supabase
        .from('request_types')
        .select('*')
        .eq('category_id', categoryId)
        .order('sort_order');

      if (error) {
        console.error('Error fetching request types:', error);
      } else {
        setTypes(data || []);
      }
      setLoading(false);
    }

    fetchTypes();
  }, [categoryId]);

  return { types, loading };
}

export function useAllRequestTypes() {
  const [types, setTypes] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTypes() {
      const { data, error } = await supabase
        .from('request_types')
        .select('*')
        .order('sort_order');

      if (error) {
        console.error('Error fetching all request types:', error);
      } else {
        setTypes(data || []);
      }
      setLoading(false);
    }

    fetchTypes();
  }, []);

  return { types, loading };
}

export function useMyServiceRequests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        request_types (
          id,
          name,
          slug,
          category_id,
          request_categories (
            id,
            name,
            slug,
            icon,
            color
          )
        )
      `)
      .eq('requester_id', 'demo-user')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching service requests:', error);
    } else {
      const formatted = (data || []).map(req => ({
        ...req,
        request_type: req.request_types,
        category: req.request_types?.request_categories,
      }));
      setRequests(formatted);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, refetch: fetchRequests };
}

interface SubmitRequestParams {
  requestTypeId: string;
  title: string;
  description: string;
  formData: Record<string, unknown>;
  priority: ServiceRequestPriority;
  dueDate?: string;
}

export function useSubmitRequest() {
  const [submitting, setSubmitting] = useState(false);

  const submitRequest = async (params: SubmitRequestParams): Promise<boolean> => {
    setSubmitting(true);

    const { error } = await supabase
      .from('service_requests')
      .insert({
        request_type_id: params.requestTypeId,
        requester_id: 'demo-user',
        requester_name: '홍길동',
        requester_email: 'demo@example.com',
        title: params.title,
        description: params.description,
        form_data: params.formData,
        priority: params.priority,
        due_date: params.dueDate || null,
        status: 'submitted',
      });

    setSubmitting(false);

    if (error) {
      console.error('Error submitting request:', error);
      return false;
    }

    return true;
  };

  return { submitRequest, submitting };
}

export function useRequestStats() {
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    inProgress: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase
        .from('service_requests')
        .select('status')
        .eq('requester_id', 'demo-user');

      if (error) {
        console.error('Error fetching stats:', error);
      } else {
        const requests = data || [];
        setStats({
          total: requests.length,
          submitted: requests.filter(r => r.status === 'submitted' || r.status === 'in_review').length,
          inProgress: requests.filter(r => r.status === 'approved' || r.status === 'in_progress').length,
          completed: requests.filter(r => r.status === 'completed').length,
        });
      }
      setLoading(false);
    }

    fetchStats();
  }, []);

  return { stats, loading };
}
