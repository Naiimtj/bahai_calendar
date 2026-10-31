import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useBadiYear } from '../context/BadiYearContext';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import { BAHAI_EVENTS } from '../lib/badiCalendar';
import { MONTHNAMES, resolveTranslations } from '../lib/badiCalendarData';
import {
  isEventNotificationsSupported,
  checkEventNotificationPermission,
  requestEventNotificationPermission,
  scheduleEventNotifications,
  cancelEventNotifications,
  personalEventNotificationId,
  bahaiEventNotificationId,
} from '../services/eventNotifications';

const WINDOW_DAYS = 90;
const PERSONAL_STORE_KEY = 'bahai-personal-event-notifications';
const BAHAI_STORE_KEY = 'bahai-bahai-event-notifications';
const BAHAI_NOTIFY_HOUR = 8;

function loadStore(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — schedule still applies this session
  }
}

/** Personal events fire at their own start time (all-day events at 9am local). */
function personalEventTime(ev) {
  if (ev.allDay) {
    const d = new Date(ev.start);
    d.setHours(9, 0, 0, 0);
    return d;
  }
  return new Date(ev.start);
}

/** Bahá'í calendar events fire at a fixed morning hour on their Gregorian date. */
function bahaiEventTime(ev) {
  const d = new Date(ev.gregDate);
  d.setHours(BAHAI_NOTIFY_HOUR, 0, 0, 0);
  return d;
}

/** Diffs a stored schedule against a freshly computed one, returning ids to cancel. */
function idsToCancel(store, nextStore, seenKeys) {
  const cancelled = [];
  for (const [key, entry] of Object.entries(store)) {
    if (!seenKeys.has(key) || nextStore[key] !== entry) {
      cancelled.push(entry.notifId);
    }
  }
  return cancelled;
}

/**
 * Keeps native local notifications for personal events and Bahá'í calendar
 * events in sync with the user's notification settings. Runs app-wide (not
 * tied to the Settings page) so schedules stay current on every launch.
 */
export function useEventNotifications() {
  const { t } = useTranslation();
  const { settings, lang } = useSettings();
  const { allEvents, allMonthStarts } = useBadiYear();
  const { upcomingEvents } = usePersonalEvents();
  const requestedPermission = useRef(false);
  const monthNames = resolveTranslations(lang).month.names;

  useEffect(() => {
    if (!isEventNotificationsSupported()) return;
    const wantsAny =
      settings.notificationsEvents || settings.notificationsBahaiEvents;
    if (!wantsAny || requestedPermission.current) return;
    requestedPermission.current = true;
    checkEventNotificationPermission().then((state) => {
      if (state !== 'granted') requestEventNotificationPermission();
    });
  }, [settings.notificationsEvents, settings.notificationsBahaiEvents]);

  // Personal events
  useEffect(() => {
    if (!isEventNotificationsSupported()) return;
    let cancelled = false;
    const enabled = settings.notificationsEvents;

    (async () => {
      const store = loadStore(PERSONAL_STORE_KEY);

      if (!enabled) {
        const ids = Object.values(store).map((e) => e.notifId);
        if (ids.length) await cancelEventNotifications(ids);
        saveStore(PERSONAL_STORE_KEY, {});
        return;
      }

      const now = Date.now();
      const horizon = now + WINDOW_DAYS * 86400000;
      const nextStore = {};
      const toSchedule = [];
      const seen = new Set();

      for (const ev of upcomingEvents) {
        // Reminders-app items notify themselves; skipped items stay out of `seen`, so idsToCancel cancels them.
        if (ev.isCompleted || ev.sourceType === 'reminder') continue;
        const at = personalEventTime(ev);
        const atMs = at.getTime();
        if (atMs <= now || atMs > horizon) continue;
        seen.add(ev.id);
        const title = ev.title || '';
        const body = ev.location || '';
        const signature = `${title}|${body}|${atMs}`;
        const existing = store[ev.id];
        if (existing && existing.signature === signature) {
          nextStore[ev.id] = existing;
          continue;
        }
        const notifId = personalEventNotificationId(ev.id);
        toSchedule.push({
          id: notifId,
          title,
          body,
          schedule: { at },
        });
        nextStore[ev.id] = { notifId, signature };
      }

      const cancelIds = idsToCancel(store, nextStore, seen);
      if (cancelled) return;
      if (cancelIds.length) await cancelEventNotifications(cancelIds);
      if (toSchedule.length) await scheduleEventNotifications(toSchedule);
      saveStore(PERSONAL_STORE_KEY, nextStore);
    })();

    return () => {
      cancelled = true;
    };
  }, [settings.notificationsEvents, upcomingEvents]);

  // Bahá'í calendar events
  useEffect(() => {
    if (!isEventNotificationsSupported()) return;
    let cancelled = false;
    const enabled = settings.notificationsBahaiEvents;

    (async () => {
      const store = loadStore(BAHAI_STORE_KEY);

      if (!enabled) {
        const ids = Object.values(store).map((e) => e.notifId);
        if (ids.length) await cancelEventNotifications(ids);
        saveStore(BAHAI_STORE_KEY, {});
        return;
      }

      const now = Date.now();
      const horizon = now + WINDOW_DAYS * 86400000;
      const nextStore = {};
      const toSchedule = [];
      const seen = new Set();

      for (const ev of allEvents) {
        const at = bahaiEventTime(ev);
        const atMs = at.getTime();
        if (atMs <= now || atMs > horizon) continue;
        const key = `${ev.gregDate.toISOString().slice(0, 10)}-${ev.event}`;
        seen.add(key);
        const isHolyDay = BAHAI_EVENTS.some(
          ({ name }) => name === ev.event_type,
        );
        const title = isHolyDay ? t('notifications.holyDay') : ev.event;
        const body = isHolyDay
          ? [ev.event, ev.time_note].filter(Boolean).join('\n')
          : ev.time_note || ev.desc || '';
        const signature = `${title}|${body}|${atMs}`;
        const existing = store[key];
        if (existing && existing.signature === signature) {
          nextStore[key] = existing;
          continue;
        }
        const notifId = bahaiEventNotificationId(key);
        toSchedule.push({
          id: notifId,
          title,
          body,
          schedule: { at },
        });
        nextStore[key] = { notifId, signature };
      }

      for (const month of allMonthStarts) {
        if (month.badiMonth < 1 || month.badiMonth > 19) continue;
        const at = bahaiEventTime({ gregDate: month.start });
        const atMs = at.getTime();
        if (atMs <= now || atMs > horizon) continue;
        const title = t('notifications.feast');
        const body = `${MONTHNAMES[month.badiMonth]} (${monthNames[month.badiMonth]})`;
        const key = `${month.start.toISOString().slice(0, 10)}-feast-${month.badiMonth}`;
        seen.add(key);
        const signature = `${title}|${body}|${atMs}`;
        const existing = store[key];
        if (existing && existing.signature === signature) {
          nextStore[key] = existing;
          continue;
        }
        const notifId = bahaiEventNotificationId(key);
        toSchedule.push({ id: notifId, title, body, schedule: { at } });
        nextStore[key] = { notifId, signature };
      }

      const cancelIds = idsToCancel(store, nextStore, seen);
      if (cancelled) return;
      if (cancelIds.length) await cancelEventNotifications(cancelIds);
      if (toSchedule.length) await scheduleEventNotifications(toSchedule);
      saveStore(BAHAI_STORE_KEY, nextStore);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    settings.notificationsBahaiEvents,
    allEvents,
    allMonthStarts,
    lang,
    monthNames,
    t,
  ]);
}
