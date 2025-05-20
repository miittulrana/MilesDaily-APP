import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  USER_SESSION: '@milesxp_daily:user_session',
  TRACK_SETTINGS: '@milesxp_daily:track_settings',
};

// Save data to storage
export const storeData = async (key: string, value: any) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (e) {
    console.error('Error storing data:', e);
    return false;
  }
};

// Get data from storage
export const getData = async (key: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error retrieving data:', e);
    return null;
  }
};

// Remove data from storage
export const removeData = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('Error removing data:', e);
    return false;
  }
};

// Clear all data
export const clearAll = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (e) {
    console.error('Error clearing all data:', e);
    return false;
  }
};

export default {
  KEYS,
  storeData,
  getData,
  removeData,
  clearAll,
};