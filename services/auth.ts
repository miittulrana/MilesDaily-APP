import supabase from '../utils/supabase';

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    return { user: data.user, session: data.session, error: null };
  } catch (error: any) {
    return {
      user: null,
      session: null,
      error: error.message || 'Failed to sign in',
    };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    return { error: null };
  } catch (error: any) {
    return {
      error: error.message || 'Failed to sign out',
    };
  }
}

export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    return { session: data.session, error: null };
  } catch (error: any) {
    return {
      session: null,
      error: error.message || 'Failed to get session',
    };
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    return { user: data.user, error: null };
  } catch (error: any) {
    return {
      user: null,
      error: error.message || 'Failed to get current user',
    };
  }
}