import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { config } from '../constants/Config';

const supabaseUrl = config.api.supabaseUrl;
const supabaseAnonKey = config.api.supabaseAnonKey;

const KEEP_ALIVE_INTERVAL = 30 * 1000;
const FETCH_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const AsyncStorageAdapter = {
  getItem: async (key: string) => {
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
};

const fetchWithTimeout = (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    fetch: fetchWithTimeout,
  },
});

let keepAliveInterval: NodeJS.Timeout | null = null;
let appStateSubscription: any = null;
let netInfoSubscription: any = null;
let isRefreshing = false;

const refreshConnection = async (): Promise<boolean> => {
  if (isRefreshing) return true;
  
  isRefreshing = true;
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      isRefreshing = false;
      return false;
    }

    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);

    if (expiresAt && expiresAt - now < 600) {
      await supabase.auth.refreshSession();
    }

    isRefreshing = false;
    return true;
  } catch (error) {
    console.log('Keep-alive refresh failed:', error);
    isRefreshing = false;
    return false;
  }
};

const startKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }

  refreshConnection();

  keepAliveInterval = setInterval(() => {
    refreshConnection();
  }, KEEP_ALIVE_INTERVAL);
};

const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
};

const handleAppStateChange = async (nextAppState: AppStateStatus) => {
  if (nextAppState === 'active') {
    await refreshConnection();
    startKeepAlive();
  } else if (nextAppState === 'background') {
    stopKeepAlive();
  }
};

const handleNetworkChange = async (state: NetInfoState) => {
  if (state.isConnected && state.isInternetReachable) {
    await refreshConnection();
    if (!keepAliveInterval) {
      startKeepAlive();
    }
  }
};

export const initSupabaseKeepAlive = () => {
  if (appStateSubscription) {
    appStateSubscription.remove();
  }
  if (netInfoSubscription) {
    netInfoSubscription();
  }

  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
  netInfoSubscription = NetInfo.addEventListener(handleNetworkChange);
  
  startKeepAlive();

  return () => {
    stopKeepAlive();
    if (appStateSubscription) {
      appStateSubscription.remove();
      appStateSubscription = null;
    }
    if (netInfoSubscription) {
      netInfoSubscription();
      netInfoSubscription = null;
    }
  };
};

export const ensureConnection = async (): Promise<boolean> => {
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      return false;
    }

    return await refreshConnection();
  } catch (error) {
    return false;
  }
};

export const refreshBeforeCall = async (): Promise<boolean> => {
  return await refreshConnection();
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const withRetry = async <T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await refreshBeforeCall();
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.log(`Attempt ${attempt}/${retries} failed:`, error?.message || error);

      if (attempt < retries) {
        const delay = RETRY_DELAY * attempt;
        await sleep(delay);
        
        await refreshConnection();
      }
    }
  }

  throw lastError;
};

export const supabaseQuery = async <T>(
  queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  try {
    const result = await withRetry(async () => {
      const response = await queryFn(supabase);
      
      if (response.error) {
        throw response.error;
      }
      
      return response;
    });
    
    return result;
  } catch (error: any) {
    return { data: null, error };
  }
};

export const getAuthUser = async () => {
  return await withRetry(async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }
    
    return user;
  });
};