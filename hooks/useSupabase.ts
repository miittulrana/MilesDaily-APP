import { useState, useEffect } from 'react';
import supabase from '../utils/supabase';

export function useSupabase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = async <T,>(
    queryCallback: () => Promise<{ data: T | null; error: any }>
  ): Promise<{ data: T | null; error: string | null }> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await queryCallback();
      
      if (error) {
        setError(error.message || 'An error occurred during the database operation');
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    supabase,
    loading,
    error,
    executeQuery,
  };
}