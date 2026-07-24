import Constants, { AppOwnership } from 'expo-constants';
import { Platform } from 'react-native';

const ANDROID_CHANNEL_ID = 'workout-reminders';

// Merely `import`-ing `expo-notifications` throws synchronously on Android inside Expo Go (SDK 53+
// dropped the native module there) -- not just when calling push-specific APIs. A static top-level
// import would crash the whole app on that platform/client combo (it did, taking app/_layout.tsx
// down with it, since that's where this module used to be imported for its setNotificationHandler
// side effect). Local notifications still work everywhere else (iOS Expo Go, any dev build,
// standalone builds) per Expo's docs, so this is gated narrowly rather than disabling the feature
// everywhere -- see docs.expo.dev/develop/development-builds/introduction.
const isExpoGoAndroid = Constants.appOwnership === AppOwnership.Expo && Platform.OS === 'android';

export function isReminderSchedulingSupported(): boolean {
  return !isExpoGoAndroid;
}

// Dynamic import, not a static one -- so merely importing *this* module never touches
// `expo-notifications` on the unsupported platform/client combo above. Only actually calling one
// of the exported functions below does, and each of those checks `isReminderSchedulingSupported()`
// first.
async function loadNotifications() {
  return import('expo-notifications');
}

let handlerRegistered = false;

// Required since Expo SDK 57 for a notification to appear while the app is in the foreground --
// without a handler, foreground notifications are silently dropped. Registered lazily (first real
// use, not at app boot) since it needs the same guarded dynamic import as everything else here.
async function ensureNotificationHandler(Notifications: Awaited<ReturnType<typeof loadNotifications>>): Promise<void> {
  if (handlerRegistered) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  handlerRegistered = true;
}

async function ensureAndroidChannel(Notifications: Awaited<ReturnType<typeof loadNotifications>>): Promise<void> {
  if (Platform.OS !== 'android') return;
  // Android 8+ silently ignores notifications with no channel until one is created -- must exist
  // before the first scheduleNotificationAsync call, not just before requesting permission.
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Workout-Erinnerungen',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isReminderSchedulingSupported()) return false;

  const Notifications = await loadNotifications();
  await ensureNotificationHandler(Notifications);

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const result = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return result.granted;
}

const REMINDER_TITLE = 'Zeit fürs Training';
const REMINDER_BODY = 'Dein geplantes Workout wartet.';

// This is the only feature in the app that schedules local notifications, so cancelling
// everything before rescheduling is safe -- no other notification source to accidentally wipe.
export async function rescheduleWorkoutReminders(weekdays: number[], hour: number, minute: number): Promise<void> {
  if (!isReminderSchedulingSupported()) {
    throw new Error('Workout-Erinnerungen werden auf diesem Gerät nicht unterstützt (Expo Go auf Android).');
  }

  const Notifications = await loadNotifications();
  await ensureAndroidChannel(Notifications);
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const weekday of weekdays) {
    await Notifications.scheduleNotificationAsync({
      content: { title: REMINDER_TITLE, body: REMINDER_BODY },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour,
        minute,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
  }
}

export async function cancelWorkoutReminders(): Promise<void> {
  if (!isReminderSchedulingSupported()) return;
  const Notifications = await loadNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();
}
