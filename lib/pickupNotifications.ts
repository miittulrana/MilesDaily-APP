import * as Notifications from 'expo-notifications';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { supabase } from './supabase';
import { getDriverInfo } from './auth';
import { RealtimeChannel } from '@supabase/supabase-js';

const CHANNEL_ID = 'pickup-assignments';

let globalChannel: RealtimeChannel | null = null;
let globalDriverId: string | null = null;

const subscribeGlobal = (driverId: string) => {
    if (globalChannel) {
        supabase.removeChannel(globalChannel);
    }

    globalChannel = supabase
        .channel(`global_pickup_notify_${driverId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'pickup_assignments',
                filter: `driver_id=eq.${driverId}`,
            },
            (payload) => {
                const row = payload?.new as any;
                if (row) {
                    console.log('[Global] New pickup assignment - firing notification');
                    notifyNewAssignment(
                        row.miles_ref || 'New Pickup',
                        row.message || null,
                        row.is_urgent || false
                    );
                }
            }
        )
        .subscribe();
};

export const setupPickupNotificationChannel = async () => {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
            name: 'Pickup Assignments',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            enableVibrate: true,
            enableLights: true,
            lightColor: '#ff6b00',
        });
    }

    try {
        const driver = await getDriverInfo();
        if (driver?.id) {
            globalDriverId = driver.id;
            subscribeGlobal(driver.id);

            AppState.addEventListener('change', (state: AppStateStatus) => {
                if (state === 'active' && globalDriverId) {
                    subscribeGlobal(globalDriverId);
                }
            });
        }
    } catch (err) {
        console.warn('Global pickup subscription setup failed:', err);
    }
};

export const notifyNewAssignment = async (milesRef: string, message?: string | null, isUrgent?: boolean) => {
    const title = isUrgent ? '🔴 URGENT Pickup Assigned!' : '📦 New Pickup Assigned';
    const body = message
        ? `${milesRef} - ${message}`
        : `${milesRef} has been assigned to you`;

    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: 'default',
            data: { type: 'pickup_assignment', miles_ref: milesRef },
            priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    });
};

export const notifyTransferResult = async (milesRef: string, approved: boolean) => {
    const title = approved ? '✅ Transfer Approved' : '❌ Transfer Rejected';
    const body = approved
        ? `${milesRef} has been transferred to another driver`
        : `${milesRef} transfer request was rejected. You still have this pickup.`;

    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: 'default',
            data: { type: 'transfer_result', miles_ref: milesRef },
        },
        trigger: null,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    });
};