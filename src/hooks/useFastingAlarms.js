import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cancelFastingAlarms,
  checkAlarmPermission,
  isAlarmsSupported,
  requestAlarmPermission,
  scheduleFastingAlarms,
} from '../services/fastingAlarms';

const STORAGE_KEY = 'bahai-fasting-alarms-v5';

/** Minutes relative to sunrise/sunset: negative = before, positive = after (0 is handled by the separate exact-time switch). */
export const OFFSET_MINUTES_OPTIONS = [-20, -15, -10, -5, 5, 10, 15, 20];

const DEFAULT_PERIOD = { exact: true, offsetMinutes: null };
const DEFAULT_CONFIG = {
  general: {
    sunrise: { ...DEFAULT_PERIOD },
    sunset: { ...DEFAULT_PERIOD },
  },
  customizePerDay: false,
  days: {},
};

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.general ? parsed : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function persistConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // storage full or unavailable — schedule still applies this session
  }
}

export const dayKey = (date) => date.toISOString().slice(0, 10);

/** Deterministic 32-bit notification id from a day + period + variant (exact/lead). */
function notificationId(key, period, variant) {
  const periodOffset = period === 'sunset' ? 2 : 0;
  const variantOffset = variant === 'lead' ? 1 : 0;
  return Number(key.replaceAll('-', '')) * 10 + periodOffset + variantOffset;
}

function dayDefaults(general) {
  return {
    sunrise: { ...general.sunrise },
    sunset: { ...general.sunset },
  };
}

/**
 * Manages sunrise/sunset fasting alarms via native local notifications, with
 * a single general configuration (applied to every day of the Fast) that can
 * optionally be overridden per day. Each period has an independent exact-time
 * switch plus a lead/delay offset in minutes (or `null` to disable it), and
 * both can fire at once. Native-only (iOS/Android) — no-ops on web.
 */
export function useFastingAlarms(sunTimes) {
  const { t } = useTranslation();
  const supported = isAlarmsSupported();
  const [config, setConfig] = useState(loadConfig);
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

  const persist = useCallback((next) => {
    setConfig(next);
    persistConfig(next);
  }, []);

  const setGeneralPeriod = useCallback(
    (period, patch) => {
      const nextGeneral = {
        ...config.general,
        [period]: { ...config.general[period], ...patch },
      };
      // While customizing per day, re-selecting a general option resyncs
      // every day to it (this is also how a mixed/deselected state is cleared).
      if (config.customizePerDay && sunTimes?.length) {
        const nextDays = { ...config.days };
        sunTimes.forEach((entry) => {
          const key = dayKey(entry.date);
          const current = nextDays[key] || dayDefaults(config.general);
          nextDays[key] = {
            ...current,
            [period]: { ...current[period], ...patch },
          };
        });
        persist({ ...config, general: nextGeneral, days: nextDays });
        return;
      }
      persist({ ...config, general: nextGeneral });
    },
    [config, sunTimes, persist],
  );

  const setCustomizePerDay = useCallback(
    (customizePerDay) => persist({ ...config, customizePerDay }),
    [config, persist],
  );

  const setDayPeriod = useCallback(
    (entry, period, patch) => {
      const key = dayKey(entry.date);
      const current = config.days[key] || dayDefaults(config.general);
      persist({
        ...config,
        days: {
          ...config.days,
          [key]: { ...current, [period]: { ...current[period], ...patch } },
        },
      });
    },
    [config, persist],
  );

  // Once per-day customization is on, give every known day of the Fast its
  // own (initially inherited) entry so it can be tweaked independently.
  useEffect(() => {
    if (!config.customizePerDay || !sunTimes?.length) return;
    const missing = sunTimes.filter(
      (entry) => !config.days[dayKey(entry.date)],
    );
    if (!missing.length) return;
    const nextDays = { ...config.days };
    missing.forEach((entry) => {
      nextDays[dayKey(entry.date)] = dayDefaults(config.general);
    });
    persist({ ...config, days: nextDays });
  }, [config, sunTimes, persist]);

  /** Resolves the effective { exact, offsetMinutes } for one day + period. */
  const effectiveFor = useCallback(
    (entry, period) => {
      const key = dayKey(entry.date);
      if (config.customizePerDay && config.days[key]) {
        return config.days[key][period];
      }
      return config.general[period];
    },
    [config],
  );

  /**
   * What the general card should show for one period: while customizing per
   * day, it mirrors the days' shared value for each field, or falls back to
   * off/disabled when the days disagree — signaling a "deselected"/mixed state.
   */
  const generalDisplayFor = useCallback(
    (period) => {
      if (!config.customizePerDay || !sunTimes?.length) {
        return config.general[period];
      }
      const values = sunTimes.map((entry) => {
        const key = dayKey(entry.date);
        return (config.days[key] || config.general)[period];
      });
      const [first] = values;
      const allMatch = (getField) =>
        values.every((v) => getField(v) === getField(first));
      return {
        exact: allMatch((v) => v.exact) ? first.exact : false,
        offsetMinutes: allMatch((v) => v.offsetMinutes)
          ? first.offsetMinutes
          : null,
      };
    },
    [config, sunTimes],
  );

  const notificationFor = useCallback(
    (period, at) => ({
      title: t('fasting.alarms.notificationTitle'),
      body: t(`fasting.alarms.${period}Body`),
      schedule: { at, allowWhileIdle: true },
    }),
    [t],
  );

  // Keep the native schedule in sync with the effective configuration.
  useEffect(() => {
    if (!supported || !sunTimes?.length) return;
    let cancelled = false;

    (async () => {
      const idsToCancel = [];
      const toSchedule = [];
      const now = new Date();

      sunTimes.forEach((entry) => {
        const key = dayKey(entry.date);
        ['sunrise', 'sunset'].forEach((period) => {
          const { exact, offsetMinutes } = effectiveFor(entry, period);
          const exactId = notificationId(key, period, 'exact');
          const leadId = notificationId(key, period, 'lead');
          const exactAt = entry[period];

          if (exact && exactAt > now) {
            toSchedule.push({
              id: exactId,
              ...notificationFor(period, exactAt),
            });
          } else {
            idsToCancel.push(exactId);
          }

          if (offsetMinutes != null) {
            const leadAt = new Date(exactAt.getTime() + offsetMinutes * 60000);
            if (leadAt > now) {
              toSchedule.push({
                id: leadId,
                ...notificationFor(period, leadAt),
              });
            } else {
              idsToCancel.push(leadId);
            }
          } else {
            idsToCancel.push(leadId);
          }
        });
      });

      if (idsToCancel.length) await cancelFastingAlarms(idsToCancel);
      if (!toSchedule.length || cancelled) return;
      const granted = await ensurePermission();
      if (!granted || cancelled) return;
      await scheduleFastingAlarms(toSchedule);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, sunTimes, config, effectiveFor, notificationFor]);

  return {
    supported,
    permission,
    general: config.general,
    customizePerDay: config.customizePerDay,
    setGeneralPeriod,
    setCustomizePerDay,
    setDayPeriod,
    effectiveFor,
    generalDisplayFor,
    dayKey,
  };
}
