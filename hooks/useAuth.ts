import { Session, User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import supabase from '../utils/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Auth error:', error);
        return { error };
      }
      
      return { data, error: null };
    } catch (err: any) {
      console.error('Sign in error:', err);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err: any) {
      console.error('Sign out error:', err);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    user,
    loading,
    signIn,
    signOut
  };
}