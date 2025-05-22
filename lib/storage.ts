import * as SecureStore from 'expo-secure-store';

export const saveSecure = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Error saving to secure storage:', error);
  }
};

export const getSecure = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Error reading from secure storage:', error);
    return null;
  }
};

export const removeSecure = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Error removing from secure storage:', error);
  }
};

export const saveObject = async (key: string, value: object): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await saveSecure(key, jsonValue);
  } catch (error) {
    console.error('Error saving object to secure storage:', error);
  }
};

export const getObject = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await getSecure(key);
    return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
  } catch (error) {
    console.error('Error reading object from secure storage:', error);
    return null;
  }
};