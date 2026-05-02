import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'pickup-assignments';

// Set up the notification channel with custom sound (Android)
export const setupPickupNotificationChannel = async () => {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
            name: 'Pickup Assignments',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            sound: 'notify.mp3', // must be in android/app/src/main/res/raw/notify.mp3
            enableVibrate: true,
            enableLights: true,
            lightColor: '#ff6b00',
        });
    }
};

// Fire a local notification when a new pickup is assigned
export const notifyNewAssignment = async (milesRef: string, message?: string | null, isUrgent?: boolean) => {
    const title = isUrgent ? '🔴 URGENT Pickup Assigned!' : '📦 New Pickup Assigned';
    const body = message
        ? `${milesRef} - ${message}`
        : `${milesRef} has been assigned to you`;

    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: Platform.OS === 'ios' ? 'notify.mp3' : undefined,
            data: { type: 'pickup_assignment', miles_ref: milesRef },
            priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null, // immediately
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    });
};

// Notify when transfer request is approved/rejected
export const notifyTransferResult = async (milesRef: string, approved: boolean) => {
    const title = approved ? '✅ Transfer Approved' : '❌ Transfer Rejected';
    const body = approved
        ? `${milesRef} has been transferred to another driver`
        : `${milesRef} transfer request was rejected. You still have this pickup.`;

    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: Platform.OS === 'ios' ? 'notify.mp3' : undefined,
            data: { type: 'transfer_result', miles_ref: milesRef },
        },
        trigger: null,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    });
};