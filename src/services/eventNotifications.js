import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Native local notifications for personal calendar events and Bahá'í calendar
 * events (holy days / observances). Uses its own Android channel, separate
 * from the fasting-alarm channel, since these are regular (non-alarm) reminders.
 */
const EVENT_CHANNEL_ID = 'calendar-events-v1';
let channelReady = null;

export function isEventNotificationsSupported() {
  return Capacitor.isNativePlatform();
}

function ensureEventChannel() {
  if (channelReady || Capacitor.getPlatform() !== 'android')
    return channelReady;
  channelReady = LocalNotifications.createChannel({
    id: EVENT_CHANNEL_ID,
    name: 'Calendar events',
    description: 'Reminders for personal and Bahá\u2019í calendar events',
    importance: 4,
    visibility: 1,
    vibration: true,
  });
  return channelReady;
}

function withEventDefaults(notification) {
  if (Capacitor.getPlatform() === 'android') {
    return { channelId: EVENT_CHANNEL_ID, ...notification };
  }
  return notification;
}

export async function checkEventNotificationPermission() {
  if (!isEventNotificationsSupported()) return 'denied';
  const { display } = await LocalNotifications.checkPermissions();
  return display;
}

export async function requestEventNotificationPermission() {
  if (!isEventNotificationsSupported()) return 'denied';
  const { display } = await LocalNotifications.requestPermissions();
  return display;
}

/** Schedules event notifications. Each entry: { id, title, body, schedule }. */
export async function scheduleEventNotifications(notifications) {
  if (!isEventNotificationsSupported() || !notifications.length) return;
  await ensureEventChannel();
  await LocalNotifications.schedule({
    notifications: notifications.map(withEventDefaults),
  });
}

/** Cancels event notifications by numeric id. */
export async function cancelEventNotifications(ids) {
  if (!isEventNotificationsSupported() || !ids.length) return;
  await LocalNotifications.cancel({
    notifications: ids.map((id) => ({ id })),
  });
}

/** Deterministic 32-bit-safe id from an arbitrary string, offset into its own range. */
function hashId(str, base, mod) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) >>> 0;
  }
  return base + (hash % mod);
}

/** Personal-event notification ids live in a range that never overlaps fasting alarms. */
export function personalEventNotificationId(id) {
  return hashId(String(id), 500_000_000, 100_000_000);
}

/** Bahá'í-event notification ids live in a separate range from personal events. */
export function bahaiEventNotificationId(key) {
  return hashId(String(key), 800_000_000, 100_000_000);
}
