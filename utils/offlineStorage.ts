import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineWashCompletion, WashSchedule } from './washTypes';

const KEYS = {
  OFFLINE_COMPLETIONS: 'offline_wash_completions',
  CACHED_SCHEDULES: 'cached_wash_schedules',
  LAST_SYNC: 'wash_last_sync',
};

export const saveOfflineCompletion = async (completion: OfflineWashCompletion): Promise<void> => {
  try {
    const existing = await getOfflineCompletions();
    const updated = [...existing, completion];
    await AsyncStorage.setItem(KEYS.OFFLINE_COMPLETIONS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving offline completion:', error);
  }
};

export const getOfflineCompletions = async (): Promise<OfflineWashCompletion[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.OFFLINE_COMPLETIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline completions:', error);
    return [];
  }
};

export const removeOfflineCompletion = async (completionId: string): Promise<void> => {
  try {
    const existing = await getOfflineCompletions();
    const filtered = existing.filter(item => item.id !== completionId);
    await AsyncStorage.setItem(KEYS.OFFLINE_COMPLETIONS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing offline completion:', error);
  }
};

export const markCompletionAsSynced = async (completionId: string): Promise<void> => {
  try {
    const existing = await getOfflineCompletions();
    const updated = existing.map(item => 
      item.id === completionId ? { ...item, synced: true } : item
    );
    await AsyncStorage.setItem(KEYS.OFFLINE_COMPLETIONS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error marking completion as synced:', error);
  }
};

export const cacheWashSchedules = async (schedules: WashSchedule[], date: string): Promise<void> => {
  try {
    const cacheData = {
      schedules,
      date,
      timestamp: new Date().toISOString(),
    };
    await AsyncStorage.setItem(KEYS.CACHED_SCHEDULES, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching wash schedules:', error);
  }
};

export const getCachedWashSchedules = async (date: string): Promise<WashSchedule[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.CACHED_SCHEDULES);
    if (!data) return [];
    
    const cached = JSON.parse(data);
    if (cached.date === date) {
      return cached.schedules || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting cached wash schedules:', error);
    return [];
  }
};

export const setLastSyncTime = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error('Error setting last sync time:', error);
  }
};

export const getLastSyncTime = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(KEYS.LAST_SYNC);
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
};

export const clearAllWashCache = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      KEYS.OFFLINE_COMPLETIONS,
      KEYS.CACHED_SCHEDULES,
      KEYS.LAST_SYNC,
    ]);
  } catch (error) {
    console.error('Error clearing wash cache:', error);
  }
};