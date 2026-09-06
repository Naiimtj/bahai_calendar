import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cancelFastingAlarms,
  checkAlarmPermission,
  isAlarmsSupported,
  requestAlarmPermission,
  scheduleFastingAlarms,
} from '../services/fastingAlarms';

const STORAGE_KEY = 'bahai-fasting-alarms';

function loadAlarms() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistAlarms(alarms) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
  } catch {
    // storage full or unavailable — alarm still scheduled natively this session
  }
}

const dayKey = (date) => date.toISOString().slice(0, 10);

/** Deterministic 32-bit notification id from a day + period, stable across sessions. */
function notificationId(key, period) {
  return Number(key.replaceAll('-', '')) * 10 + (period === 'sunset' ? 1 : 0);
}

/** Fixed id for the one-off test alarm — never collides with day-based ids. */
const TEST_ALARM_ID = 999999999;

/**
 * Manages sunrise/sunset fasting alarms (per day of the Fast) via native local
 * notifications. Native-only (iOS/Android) — no-ops on web.
 */
export function useFastingAlarms(sunTimes) {
  const { t } = useTranslation();
  const supported = isAlarmsSupported();
  const [alarms, setAlarms] = useState(loadAlarms);
  const [permission, setPermission] = useState('prompt');

  useEffect(() => {
    if (!supported) return;
    checkAlarmPermission().then(setPermission);
  }, [supported]);

  const ensurePermission = useCallback(async () => {
    if (permission === 'granted') return true;
    const state = await requestAlarmPermission();
    setPermission(state);
    return state === 'granted';
  }, [permission]);

  const notificationFor = useCallback(
    (period, at) => ({
      title: t('fasting.alarms.notificationTitle'),
      body: t(`fasting.alarms.${period}Body`),
      schedule: { at, allowWhileIdle: true },
    }),
    [t],
  );

  const toggleAlarm = useCallback(
    async (entry, period) => {
      const granted = await ensurePermission();
      if (!granted) return;

      const key = dayKey(entry.date);
      const nextValue = !alarms[key]?.[period];
      const next = {
        ...alarms,
        [key]: { ...alarms[key], [period]: nextValue },
      };
      setAlarms(next);
      persistAlarms(next);

      const id = notificationId(key, period);
      if (!nextValue) {
        await cancelFastingAlarms([id]);
      } else if (entry[period] > new Date()) {
        await scheduleFastingAlarms([
          { id, ...notificationFor(period, entry[period]) },
        ]);
      }
    },
    [alarms, ensurePermission, notificationFor],
  );

  const setAll = useCallback(
    async (enable) => {
      if (!sunTimes?.length) return;
      if (enable && !(await ensurePermission())) return;

      const next = {};
      const idsToCancel = [];
      const toSchedule = [];

      sunTimes.forEach((entry) => {
        const key = dayKey(entry.date);
        next[key] = { sunrise: enable, sunset: enable };
        ['sunrise', 'sunset'].forEach((period) => {
          const id = notificationId(key, period);
          if (enable) {
            if (entry[period] > new Date()) {
              toSchedule.push({
                id,
                ...notificationFor(period, entry[period]),
              });
            }
          } else {
            idsToCancel.push(id);
          }
        });
      });

      setAlarms(next);
      persistAlarms(next);
      if (enable) await scheduleFastingAlarms(toSchedule);
      else await cancelFastingAlarms(idsToCancel);
    },
    [sunTimes, ensurePermission, notificationFor],
  );

  const dayAlarms = useMemo(
    () =>
      Object.fromEntries(
        (sunTimes || []).map((entry) => [
          dayKey(entry.date),
          alarms[dayKey(entry.date)],
        ]),
      ),
    [sunTimes, alarms],
  );

  /** Fires an immediate one-off test notification — used to verify alarms work on this device. */
  const sendTestAlarm = useCallback(async () => {
    const granted = await ensurePermission();
    if (!granted) return false;
    await scheduleFastingAlarms([
      {
        id: TEST_ALARM_ID,
        title: t('fasting.alarms.testNotificationTitle'),
        body: t('fasting.alarms.testNotificationBody'),
        schedule: { at: new Date(Date.now() + 2000) },
      },
    ]);
    return true;
  }, [ensurePermission, t]);

  return {
    supported,
    permission,
    dayAlarms,
    toggleAlarm,
    setAll,
    dayKey,
    sendTestAlarm,
  };
}
