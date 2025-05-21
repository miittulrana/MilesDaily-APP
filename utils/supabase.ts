// utils/supabase.ts
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bpignyrmiwuwpshiyfct.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaWdueXJtaXd1d3BzaGl5ZmN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NzE3NTYsImV4cCI6MjA2MDA0Nzc1Nn0.1fd8wleQvoXg5vAa90nSnAae-z9OWiwlcFv5Obe84z8';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;