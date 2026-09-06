import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Dedicated Android notification channel for fasting alarms: max importance
 * (heads-up + sound even in most Do-Not-Disturb configs), public visibility,
 * vibration and a louder custom alarm-style sound instead of the default
 * "ding". Android channels are immutable once created — bump the id (e.g.
 * `-v2`) if the sound/importance ever needs to change for existing installs.
 */
const ALARM_CHANNEL_ID = 'fasting-alarms-v1';
const ALARM_SOUND_FILE = 'fasting_alarm.wav';
let channelReady = null;

/**
 * Native-only alarms for the Bahá'í Fast (sunrise/sunset per fasting day).
 * Wraps @capacitor/local-notifications; no-ops on web where scheduled
 * background notifications aren't reliably supported.
 */
export function isAlarmsSupported() {
  return Capacitor.isNativePlatform();
}

/** Creates the high-importance Android channel once. No-op on iOS/web. */
function ensureAlarmChannel() {
  if (channelReady || Capacitor.getPlatform() !== 'android') return channelReady;
  channelReady = LocalNotifications.createChannel({
    id: ALARM_CHANNEL_ID,
    name: 'Fasting alarms',
    description: 'Sunrise and sunset alerts for the Bahá\u2019í Fast',
    sound: ALARM_SOUND_FILE,
    importance: 5,
    visibility: 1,
    vibration: true,
  });
  return channelReady;
}

/** Adds the platform-specific fields that make an alarm louder/harder to miss. */
function withAlarmDefaults(notification) {
  if (Capacitor.getPlatform() === 'android') {
    return { channelId: ALARM_CHANNEL_ID, ...notification };
  }
  if (Capacitor.getPlatform() === 'ios') {
    return {
      sound: ALARM_SOUND_FILE,
      interruptionLevel: 'timeSensitive',
      ...notification,
    };
  }
  return notification;
}

export async function checkAlarmPermission() {
  if (!isAlarmsSupported()) return 'denied';
  const { display } = await LocalNotifications.checkPermissions();
  return display;
}

export async function requestAlarmPermission() {
  if (!isAlarmsSupported()) return 'denied';
  const { display } = await LocalNotifications.requestPermissions();
  return display;
}

/** Schedules one or more fasting alarms. Each entry: { id, title, body, at }. */
export async function scheduleFastingAlarms(notifications) {
  if (!isAlarmsSupported() || !notifications.length) return;
  await ensureAlarmChannel();
  await LocalNotifications.schedule({
    notifications: notifications.map(withAlarmDefaults),
  });
}

/** Cancels fasting alarms by numeric id. */
export async function cancelFastingAlarms(ids) {
  if (!isAlarmsSupported() || !ids.length) return;
  await LocalNotifications.cancel({
    notifications: ids.map((id) => ({ id })),
  });
}
