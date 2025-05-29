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
  private washReminderIntervals: Map<string, NodeJS.Timeout> = new Map();

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

  async startWashReminders(
    scheduleId: string,
    vehicleInfo: { license_plate: string; brand: string; model: string }
  ): Promise<void> {
    try {
      console.log('Starting wash reminders for schedule:', scheduleId);
      
      this.stopWashReminders(scheduleId);

      await this.sendWashReminderNotification(scheduleId, vehicleInfo);

      const intervalId = setInterval(async () => {
        try {
          await this.sendWashReminderNotification(scheduleId, vehicleInfo);
        } catch (error) {
          console.error('Error sending recurring wash reminder:', error);
        }
      }, 30 * 60 * 1000); 

      this.washReminderIntervals.set(scheduleId, intervalId);
      
      console.log('Wash reminders started for schedule:', scheduleId);
    } catch (error) {
      console.error('Error starting wash reminders:', error);
    }
  }

  private async sendWashReminderNotification(
    scheduleId: string,
    vehicleInfo: { license_plate: string; brand: string; model: string }
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'MilesXP Daily - Wash Scheduled for Today',
          body: 'Complete it to avoid Notifications',
          data: {
            type: 'wash_reminder',
            schedule_id: scheduleId,
            vehicle_info: vehicleInfo,
            action: 'complete_wash'
          },
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending wash reminder notification:', error);
    }
  }

  async stopWashReminders(scheduleId: string): Promise<void> {
    try {
      const intervalId = this.washReminderIntervals.get(scheduleId);
      if (intervalId) {
        clearInterval(intervalId);
        this.washReminderIntervals.delete(scheduleId);
        console.log('Stopped wash reminders for schedule:', scheduleId);
      }

      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const washReminders = scheduled.filter(
        notification => notification.content.data?.schedule_id === scheduleId
      );

      for (const reminder of washReminders) {
        await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
      }
    } catch (error) {
      console.error('Error stopping wash reminders:', error);
    }
  }

  async stopAllWashReminders(): Promise<void> {
    try {
      for (const [scheduleId, intervalId] of this.washReminderIntervals.entries()) {
        clearInterval(intervalId);
        console.log('Cleared interval for schedule:', scheduleId);
      }
      this.washReminderIntervals.clear();

      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const washReminders = scheduled.filter(
        notification => notification.content.data?.type === 'wash_reminder'
      );

      for (const reminder of washReminders) {
        await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
      }

      console.log('Stopped all wash reminders');
    } catch (error) {
      console.error('Error stopping all wash reminders:', error);
    }
  }

  async cancelWashReminder(scheduleId: string): Promise<void> {
    try {
      await this.stopWashReminders(scheduleId);
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