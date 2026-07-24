import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ANDROID_CHANNEL_ID = 'workout-reminders';

// Required since Expo SDK 57 for the notification to actually appear while the app is in the
// foreground -- without a handler, foreground notifications are silently dropped. Set once at
// module load (imported for its side effect from app/_layout.tsx) rather than per-screen, since a
// reminder can fire while the user is anywhere in the app, not just on the reminders screen.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const result = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return result.granted;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  // Android 8+ silently ignores notifications with no channel until one is created -- must exist
  // before the first scheduleNotificationAsync call, not just before requesting permission.
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Workout-Erinnerungen',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

const REMINDER_TITLE = 'Zeit fürs Training';
const REMINDER_BODY = 'Dein geplantes Workout wartet.';

// This is the only feature in the app that schedules local notifications, so cancelling
// everything before rescheduling is safe -- no other notification source to accidentally wipe.
export async function rescheduleWorkoutReminders(weekdays: number[], hour: number, minute: number): Promise<void> {
  await ensureAndroidChannel();
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
  await Notifications.cancelAllScheduledNotificationsAsync();
}
