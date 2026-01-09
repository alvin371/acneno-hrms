declare module 'react-native-push-notification' {
  export interface PushNotification {
    localNotification(details: Partial<PushNotificationObject>): void;
    localNotificationSchedule(details: PushNotificationScheduleObject): void;
    cancelAllLocalNotifications(): void;
    cancelLocalNotifications(details: { id: string | number }): void;
    getScheduledLocalNotifications(callback: (notifications: Array<any>) => void): void;
    channelExists(channelId: string, callback: (exists: boolean) => void): void;
    createChannel(
      channel: {
        channelId: string;
        channelName: string;
        channelDescription?: string;
        importance?: number;
        vibrate?: boolean;
      },
      created: (created: boolean) => void
    ): void;
    configure(options: PushNotificationOptions): void;
  }

  export interface PushNotificationObject {
    id?: string | number;
    title?: string;
    message: string;
    channelId?: string;
    playSound?: boolean;
    soundName?: string;
    number?: number;
    actions?: string[];
    allowWhileIdle?: boolean;
    data?: any;
    userInfo?: any;
  }

  export interface PushNotificationScheduleObject extends PushNotificationObject {
    date: Date;
    repeatType?: 'day' | 'week' | 'month' | 'year';
  }

  export interface PushNotificationOptions {
    onRegister?: (token: { os: string; token: string }) => void;
    onNotification?: (notification: any) => void;
    onAction?: (notification: any) => void;
    onRegistrationError?: (error: any) => void;
    permissions?: {
      alert?: boolean;
      badge?: boolean;
      sound?: boolean;
    };
    popInitialNotification?: boolean;
    requestPermissions?: boolean;
  }

  const PushNotification: PushNotification;
  export default PushNotification;
}
