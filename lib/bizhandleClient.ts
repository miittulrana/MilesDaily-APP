import { createClient } from '@supabase/supabase-js';

const bizhandleUrl = process.env.EXPO_PUBLIC_SUPABASE_BH_URL || '';
const bizhandleAnonKey = process.env.EXPO_PUBLIC_SUPABASE_BH_ANON_KEY || '';

if (!bizhandleUrl || !bizhandleAnonKey) {
    console.warn('BizHandle Supabase credentials not configured');
}

export const supabaseBizhandle = createClient(bizhandleUrl, bizhandleAnonKey);