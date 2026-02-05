import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Service } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get<Service[]>(`${API_URL}/api/v1/assets/services`);
      setServices(response.data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return { services, loading, error, refetch: fetchServices };
}
