import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Comment {
  id: string;
  asset_id: string;
  user_id: string;
  user_name: string;
  content: string;
  parent_id?: string;
  is_answer: boolean;
  created_at: string;
  data_assets?: {
    name: string;
    description: string;
  };
}

export function useAllComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      fetchComments();
    }
  }, [isAdmin]);

  async function fetchComments() {
    if (!isAdmin) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('asset_comments')
        .select(`
          *,
          data_assets (
            name,
            description
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsAnswer(commentId: string): Promise<{ success: boolean; error?: string }> {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const { error } = await supabase
        .from('asset_comments')
        .update({ is_answer: true })
        .eq('id', commentId);

      if (error) throw error;

      await fetchComments();
      return { success: true };
    } catch (error: any) {
      console.error('Failed to mark as answer:', error);
      return { success: false, error: error.message };
    }
  }

  async function unmarkAsAnswer(commentId: string): Promise<{ success: boolean; error?: string }> {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const { error } = await supabase
        .from('asset_comments')
        .update({ is_answer: false })
        .eq('id', commentId);

      if (error) throw error;

      await fetchComments();
      return { success: true };
    } catch (error: any) {
      console.error('Failed to unmark as answer:', error);
      return { success: false, error: error.message };
    }
  }

  async function deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const { error } = await supabase
        .from('asset_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      await fetchComments();
      return { success: true };
    } catch (error: any) {
      console.error('Failed to delete comment:', error);
      return { success: false, error: error.message };
    }
  }

  return {
    comments,
    loading,
    refresh: fetchComments,
    markAsAnswer,
    unmarkAsAnswer,
    deleteComment,
  };
}
