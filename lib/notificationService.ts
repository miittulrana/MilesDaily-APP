import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { WashNotification } from '../utils/washTypes';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initializeNotifications(): Promise<void> {
    try {
      await this.registerForPushNotifications();
      await this.setupNotificationChannels();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  private async registerForPushNotifications(): Promise<void> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification');
      return;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '3ea31db3-72cd-4096-a07a-cde10dc6466a',
      });
      this.expoPushToken = token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  }

  private async setupNotificationChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('wash-reminders', {
        name: 'Wash Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ff6b00',
        sound: 'default',
      });
    }
  }

  async scheduleWashReminder(
    scheduleId: string,
    vehicleInfo: { license_plate: string; brand: string; model: string },
    scheduledDate: string
  ): Promise<void> {
    try {
      const reminderDate = new Date(scheduledDate + 'T08:00:00');
      const now = new Date();

      if (reminderDate <= now) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Vehicle Wash Reminder',
          body: `Time to wash your ${vehicleInfo.brand} ${vehicleInfo.model} (${vehicleInfo.license_plate})`,
          data: {
            type: 'wash_reminder',
            schedule_id: scheduleId,
            vehicle_info: vehicleInfo,
            scheduled_date: scheduledDate,
          },
          sound: 'default',
        },
        trigger: {
          date: reminderDate,
          channelId: 'wash-reminders',
        },
      });
    } catch (error) {
      console.error('Error scheduling wash reminder:', error);
    }
  }

  async cancelWashReminder(scheduleId: string): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const washReminder = scheduled.find(
        notification => notification.content.data?.schedule_id === scheduleId
      );

      if (washReminder) {
        await Notifications.cancelScheduledNotificationAsync(washReminder.identifier);
      }
    } catch (error) {
      console.error('Error canceling wash reminder:', error);
    }
  }

  async showImmediateNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error showing immediate notification:', error);
    }
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }
}

export const notificationService = NotificationService.getInstance();