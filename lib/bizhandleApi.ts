import * as Network from 'expo-network';
import { getBizhandleToken } from './bizhandleAuth';
import { Booking, Status, UpdateBookingParams } from './bizhandleTypes';

const BIZHANDLE_API = 'https://prod.milesxp.com/api/logistics';
const FETCH_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number = FETCH_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<Response> => {
  let lastError: any = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        throw new Error('No internet connection');
      }

      const response = await fetchWithTimeout(url, options);
      return response;
    } catch (error: any) {
      lastError = error;

      if (attempt < retries) {
        await sleep(RETRY_DELAY * attempt);
      }
    }
  }

  throw lastError;
};

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

export const findBooking = async (barcode: string): Promise<{
  success: boolean;
  booking?: Booking;
  error?: string;
}> => {
  try {
    const token = await getBizhandleToken();
    if (!token) {
      return { success: false, error: 'Not logged in to Bizhandle' };
    }

    const ipaddress = await getDeviceIP();
    const build_time = getCurrentBuildTime();

    const formData = new URLSearchParams();
    formData.append('search', barcode);
    formData.append('ipaddress', ipaddress);
    formData.append('build_time', build_time);

    const response = await fetchWithRetry(`${BIZHANDLE_API}/bookings/findBooking`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (data.status === 200) {
      const bookingData = data.booking;

      const booking: Booking = {
        booking_id: bookingData.booking_id,
        miles_ref: bookingData.miles_ref,
        hawb: bookingData.hawb,
        status: {
          status_id: bookingData.status?.status_id || bookingData.status_id,
          name: bookingData.status?.name || bookingData.status_name || '',
          delivered_date_time: bookingData.status?.delivered_date_time,
        },
        shipper_address: bookingData.shipper_address || {},
        consignee_address: bookingData.consignee_address || {},
        customer: bookingData.customer || {},
        special_instruction: bookingData.special_instruction || '',
      };

      return { success: true, booking };
    }

    return { success: false, error: data.error || 'Booking not found' };
  } catch (error: any) {
    if (error.message === 'Request timeout') {
      return { success: false, error: 'Connection timeout. Please try again.' };
    }
    if (error.message === 'No internet connection') {
      return { success: false, error: 'No internet connection. Please check your network.' };
    }
    return { success: false, error: 'Connection error. Please try again.' };
  }
};

export const updateBooking = async (params: UpdateBookingParams): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const token = await getBizhandleToken();
    if (!token) {
      return { success: false, error: 'Not logged in to Bizhandle' };
    }

    const ipaddress = await getDeviceIP();
    const build_time = getCurrentBuildTime();

    const formData = new FormData();
    formData.append('booking_id', params.booking_id.toString());
    formData.append('status_id', params.status_id.toString());
    formData.append('reason', params.reason || '');
    formData.append('delivered_date', params.delivered_date);
    formData.append('delivered_time', params.delivered_time);
    formData.append('ipaddress', ipaddress);
    formData.append('build_time', build_time);

    if (params.client_name) {
      formData.append('client_name', params.client_name);
    } else {
      formData.append('client_name', '');
    }

    if (params.id_card) {
      formData.append('id_card', params.id_card);
    } else {
      formData.append('id_card', '');
    }

    if (params.signature) {
      formData.append('signature', {
        uri: params.signature,
        type: 'image/png',
        name: `signature_${Date.now()}.png`,
      } as any);
    } else {
      formData.append('signature', '');
    }

    const response = await fetchWithRetry(`${BIZHANDLE_API}/bookings/updateBookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (data.status === 200 || data.status === 409) {
      return { success: true };
    }

    return { success: false, error: data.error || 'Update failed' };
  } catch (error: any) {
    if (error.message === 'Request timeout') {
      return { success: false, error: 'Connection timeout. Please try again.' };
    }
    if (error.message === 'No internet connection') {
      return { success: false, error: 'No internet connection. Please check your network.' };
    }
    return { success: false, error: 'Connection error. Please try again.' };
  }
};

export const getStatuses = async (): Promise<{
  success: boolean;
  statuses?: Status[];
  error?: string;
}> => {
  try {
    const token = await getBizhandleToken();
    if (!token) {
      return { success: false, error: 'Not logged in to Bizhandle' };
    }

    const response = await fetchWithRetry(`${BIZHANDLE_API}/statuses`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.status === 200) {
      return { success: true, statuses: data.statuses };
    }

    return { success: false, error: 'Failed to load statuses' };
  } catch (error: any) {
    if (error.message === 'Request timeout') {
      return { success: false, error: 'Connection timeout. Please try again.' };
    }
    if (error.message === 'No internet connection') {
      return { success: false, error: 'No internet connection. Please check your network.' };
    }
    return { success: false, error: 'Connection error. Please try again.' };
  }
};