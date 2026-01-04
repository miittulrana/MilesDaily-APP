import * as Network from 'expo-network';
import { getBizhandleToken } from './bizhandleAuth';
import { Booking, Status, UpdateBookingParams } from './bizhandleTypes';

const BIZHANDLE_API = 'https://prod.milesxp.com/api/logistics';

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

export const findBooking = async (barcode: string) => {
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

    const response = await fetch(`${BIZHANDLE_API}/bookings/findBooking`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (data.status === 200) {
      return { success: true, booking: data.booking };
    }

    return { success: false, error: data.error || 'Booking not found' };
  } catch (error) {
    console.error('Find booking error:', error);
    return { success: false, error: 'Connection error' };
  }
};

export const updateBooking = async (params: UpdateBookingParams) => {
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
    formData.append('reason', '');
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

    const response = await fetch(`${BIZHANDLE_API}/bookings/updateBookings`, {
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
  } catch (error) {
    console.error('Update booking error:', error);
    return { success: false, error: 'Connection error' };
  }
};

export const getStatuses = async (): Promise<{ success: boolean; statuses?: Status[]; error?: string }> => {
  try {
    const token = await getBizhandleToken();
    if (!token) {
      return { success: false, error: 'Not logged in to Bizhandle' };
    }

    const response = await fetch(`${BIZHANDLE_API}/statuses`, {
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
  } catch (error) {
    console.error('Get statuses error:', error);
    return { success: false, error: 'Connection error' };
  }
};