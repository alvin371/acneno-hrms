import PushNotification, {
  Importance,
  type PushNotificationObject,
} from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';

const CHECKIN_NOTIFICATION_ID = 'daily-checkin-reminder';
const CHECKOUT_NOTIFICATION_ID = 'daily-checkout-reminder';
const DEFAULT_CHANNEL_ID = 'checkin-checkout-reminders';

let isConfigured = false;

const configureNotifications = () => {
  if (isConfigured) {
    return;
  }

  PushNotification.configure({
    onNotification: (notification) => {
      if ('finish' in notification && typeof notification.finish === 'function') {
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      }
    },
    requestPermissions: true,
  });

  isConfigured = true;
};

const ensureChannel = () =>
  new Promise<void>((resolve) => {
    PushNotification.createChannel(
      {
        channelId: DEFAULT_CHANNEL_ID,
        channelName: 'Check-in/out reminders',
        importance: Importance.HIGH,
      },
      () => resolve(),
    );
  });

const getNextOccurrence = (hour: number, minute: number) => {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
};

export const scheduleDailyCheckInOutNotifications = async () => {
  configureNotifications();
  await ensureChannel();

  PushNotification.cancelLocalNotifications({ id: CHECKIN_NOTIFICATION_ID });
  PushNotification.cancelLocalNotifications({ id: CHECKOUT_NOTIFICATION_ID });

  const baseNotification: Pick<
    PushNotificationObject,
    'channelId' | 'message' | 'title' | 'allowWhileIdle' | 'playSound'
  > = {
    channelId: DEFAULT_CHANNEL_ID,
    allowWhileIdle: true,
    playSound: true,
  };

  PushNotification.localNotificationSchedule({
    ...baseNotification,
    id: CHECKIN_NOTIFICATION_ID,
    title: 'Check-in reminder',
    message: 'Time to check in.',
    date: getNextOccurrence(8, 0),
    repeatType: 'day',
  });

  PushNotification.localNotificationSchedule({
    ...baseNotification,
    id: CHECKOUT_NOTIFICATION_ID,
    title: 'Check-out reminder',
    message: 'Time to check out.',
    date: getNextOccurrence(17, 0),
    repeatType: 'day',
  });
};

export const initNotifications = () => {
  configureNotifications();
};
