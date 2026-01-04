import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

const BIZHANDLE_API = 'https://prod.milesxp.com/api/logistics';
const TOKEN_KEY = 'bizhandle_token';
const USER_KEY = 'bizhandle_user';

const getDeviceIP = async (): Promise<string> => {
  try {
    const ip = await Network.getIpAddressAsync();
    return ip || '0.0.0.0';
  } catch {
    return '0.0.0.0';
  }
};

const getCurrentBuildTime = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0].replace(/-/g, '');
};

export const loginToBizhandle = async (email: string, password: string) => {
  try {
    const ipaddress = await getDeviceIP();
    const build_time = getCurrentBuildTime();

    const formData = new URLSearchParams();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('ipaddress', ipaddress);
    formData.append('build_time', build_time);

    const response = await fetch(`${BIZHANDLE_API}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (data.status === 200 && data.data) {
      await AsyncStorage.setItem(TOKEN_KEY, data.data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.data));
      return { success: true, token: data.data.token, user: data.data };
    }

    return { success: false, error: data.error || 'Login failed' };
  } catch (error) {
    console.error('Bizhandle login error:', error);
    return { success: false, error: 'Connection error' };
  }
};

export const getBizhandleToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getBizhandleUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const isBizhandleLoggedIn = async (): Promise<boolean> => {
  const token = await getBizhandleToken();
  return !!token;
};

export const logoutFromBizhandle = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Logout failed' };
  }
};