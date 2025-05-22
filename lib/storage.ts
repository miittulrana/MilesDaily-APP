import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveSecure = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
};

export const getSecure = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('Error reading from storage:', error);
    return null;
  }
};

export const removeSecure = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from storage:', error);
  }
};

export const saveObject = async (key: string, value: object): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await saveSecure(key, jsonValue);
  } catch (error) {
    console.error('Error saving object to storage:', error);
  }
};

export const getObject = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await getSecure(key);
    return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
  } catch (error) {
    console.error('Error reading object from storage:', error);
    return null;
  }
};