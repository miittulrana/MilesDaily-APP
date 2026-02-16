import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

const bizhandleUrl = process.env.EXPO_PUBLIC_SUPABASE_BH_URL || '';
const bizhandleAnonKey = process.env.EXPO_PUBLIC_SUPABASE_BH_ANON_KEY || '';

const FETCH_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const KEEP_ALIVE_INTERVAL = 45000;

let keepAliveInterval: NodeJS.Timeout | null = null;
let appStateSubscription: any = null;
let netInfoSubscription: any = null;
let isRefreshing = false;
let lastSuccessfulCall = Date.now();

const fetchWithTimeout = (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    return fetch(url, {
        ...options,
        signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
};

export const supabaseBizhandle: SupabaseClient = createClient(bizhandleUrl, bizhandleAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
    },
    global: {
        fetch: fetchWithTimeout,
    },
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const pingConnection = async (): Promise<boolean> => {
    if (isRefreshing) return true;

    isRefreshing = true;
    try {
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
            isRefreshing = false;
            return false;
        }

        const { error } = await supabaseBizhandle.from('_health_check_dummy').select('*').limit(1);

        if (!error || error.code === 'PGRST116' || error.code === '42P01') {
            lastSuccessfulCall = Date.now();
            isRefreshing = false;
            return true;
        }

        isRefreshing = false;
        return false;
    } catch (error) {
        isRefreshing = false;
        return false;
    }
};

const startKeepAlive = () => {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
    }

    keepAliveInterval = setInterval(() => {
        const timeSinceLastCall = Date.now() - lastSuccessfulCall;
        if (timeSinceLastCall > KEEP_ALIVE_INTERVAL) {
            pingConnection();
        }
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
        await pingConnection();
        startKeepAlive();
    } else if (nextAppState === 'background') {
        stopKeepAlive();
    }
};

const handleNetworkChange = async (state: NetInfoState) => {
    if (state.isConnected && state.isInternetReachable) {
        await pingConnection();
        if (!keepAliveInterval) {
            startKeepAlive();
        }
    }
};

export const initBizhandleKeepAlive = () => {
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

export const bizhandleWithRetry = async <T>(
    operation: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await operation();

            if (!result.error) {
                lastSuccessfulCall = Date.now();
                return result;
            }

            if (result.error.code === 'PGRST116' || result.error.code === '42P01') {
                lastSuccessfulCall = Date.now();
                return result;
            }

            lastError = result.error;

            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY * attempt);
            }
        } catch (error: any) {
            lastError = error;

            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY * attempt);
            }
        }
    }

    return { data: null, error: lastError };
};

export const bizhandleRpcWithRetry = async (
    functionName: string,
    params: Record<string, any>
): Promise<{ data: any; error: any }> => {
    return bizhandleWithRetry(async () => {
        return await supabaseBizhandle.rpc(functionName, params);
    });
};

export const isBizhandleConnectionHealthy = (): boolean => {
    const timeSinceLastCall = Date.now() - lastSuccessfulCall;
    return timeSinceLastCall < KEEP_ALIVE_INTERVAL * 2;
};

export const refreshBizhandleConnection = async (): Promise<boolean> => {
    return await pingConnection();
};