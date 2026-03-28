import { useState, useCallback } from 'react';
import api from '../lib/api';

export interface Bug {
  line: number | null;
  severity: 'low' | 'medium' | 'high';
  description: string;
  fix: string;
}
export interface Improvement {
  description: string;
  before: string;
  after: string;
}
export interface DocItem {
  name: string;
  description: string;
  params: { name: string; type: string; description: string }[];
  returns: string;
}
export interface Review {
  id: string;
  user_id: string;
  source_type: 'paste' | 'github';
  github_url: string | null;
  language: string | null;
  code_snippet: string;
  full_code: string;
  quality_score: number;
  summary: string | null;
  bugs: Bug[];
  improvements: Improvement[];
  documentation: DocItem[];
  created_at: string;
}
export interface ReviewsPage {
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
}

export function useReviews() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async (params?: Record<string, unknown>): Promise<ReviewsPage> => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/reviews', { params });
      return res.data;
    } catch (e: any) {
      const msg = e.response?.data?.error ?? 'Failed to fetch reviews';
      setError(msg); throw new Error(msg);
    } finally { setLoading(false); }
  }, []);

  const fetchReview = useCallback(async (id: string): Promise<Review> => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/reviews/${id}`);
      return res.data.review;
    } catch (e: any) {
      const msg = e.response?.data?.error ?? 'Failed to fetch review';
      setError(msg); throw new Error(msg);
    } finally { setLoading(false); }
  }, []);

  const submitReview = useCallback(async (payload: {
    code: string; language: string; source_type: string; github_url?: string;
  }): Promise<Review> => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/reviews', payload);
      return res.data.review;
    } catch (e: any) {
      const msg = e.response?.data?.error ?? 'Analysis failed';
      setError(msg); throw new Error(msg);
    } finally { setLoading(false); }
  }, []);

  const deleteReview = useCallback(async (id: string): Promise<void> => {
    await api.delete(`/reviews/${id}`);
  }, []);

  return { loading, error, fetchReviews, fetchReview, submitReview, deleteReview };
}
