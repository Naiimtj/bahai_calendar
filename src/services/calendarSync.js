import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar } from '../native/bahaiCalendarNative';
import {
  repeatToRecurrence,
  alertToAlerts,
  availabilityToNative,
  priorityToNative,
  toNativeEndDate,
} from './personalCalendar';

/**
 * calendarSync — unified abstraction to read available calendars and create
 * events across multiple backends:
 *
 *  - `native`  : device calendars on iOS via the Capacitor bridge. This exposes
 *                EVERY account already synced with the Apple Calendar app
 *                (iCloud, Google, Outlook/Exchange, etc.) and writes events
 *                directly into them.
 *  - `google`  : opens Google Calendar pre-filled event composer (web, no OAuth).
 *  - `outlook` : opens Outlook web pre-filled event composer (web, no OAuth).
 *  - `ics`     : downloads a standard .ics file (importable by Apple/iCloud and
 *                any other calendar app).
 *
 * The native backend requires the in-house BahaiCalendarNative plugin
 * (src/native/bahaiCalendarNative.js) plus `npx cap sync`.
 * When the plugin/pod is absent the bridge call rejects and we gracefully fall
 * back to the web backends.
 */

export const PROVIDER = {
  NATIVE: 'native',
  GOOGLE: 'google',
  OUTLOOK: 'outlook',
  ICS: 'ics',
};

export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

function isNativeIos() {
  return isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

/** True only when running natively on iOS — Reminders are not available on Android. */
export function supportsNativeReminders() {
  return isNativeIos();
}

/** True only when running natively on iOS — Contacts are not available on Android. */
export function supportsNativeContacts() {
  return isNativeIos();
}

/* ------------------------------------------------------------------ */
/*  Native helpers                                                     */
/* ------------------------------------------------------------------ */

async function ensureNativeAccess() {
  // Different plugin versions expose different method names — try them all.
  const candidates = [
    'requestFullCalendarAccess',
    'requestWriteOnlyCalendarAccess',
    'requestAllCalendarsAccess',
    'requestPermissions',
  ];
  for (const name of candidates) {
    if (typeof CapacitorCalendar[name] === 'function') {
      try {
        const res = await CapacitorCalendar[name]();
        const status =
          res?.result ?? res?.status ?? res?.granted ?? res?.writeCalendar;
        return !(status === false || status === 'denied');
      } catch {
        // try the next candidate
      }
    }
  }
  return true;
}

function resolveAccountName(rawAccount) {
  if (rawAccount == null) return null;
  if (typeof rawAccount === 'string') return rawAccount;
  return rawAccount.title ?? rawAccount.name ?? null;
}

async function listNativeCalendars() {
  if (!isNativePlatform()) return [];
  try {
    const granted = await ensureNativeAccess();
    if (!granted) return [];
    const res = await CapacitorCalendar.listCalendars();
    const list = res?.result ?? res?.calendars ?? res ?? [];
    return (Array.isArray(list) ? list : []).map((c) => {
      const account = resolveAccountName(c.source ?? c.account ?? null);
      return {
        id: c.id ?? c.identifier,
        name: c.title ?? c.name ?? 'Calendar',
        color: c.color ?? c.hexColor ?? null,
        account,
        provider: PROVIDER.NATIVE,
      };
    });
  } catch {
    return [];
  }
}

async function createNativeEvent(event, calendarId) {
  const payload = {
    title: event.title,
    calendarId,
    location: event.location || undefined,
    isAllDay: !!event.allDay,
    startDate: event.start.getTime(),
    endDate: toNativeEndDate(event.end, !!event.allDay),
    description: event.notes || undefined,
  };
  const recurrence = repeatToRecurrence(event);
  if (recurrence) payload.recurrence = recurrence;
  const alerts = alertToAlerts(event);
  if (alerts) payload.alerts = alerts;
  if (event.availability) {
    payload.availability = availabilityToNative(event.availability);
  }
  // Method name varies across plugin versions.
  const create =
    CapacitorCalendar.createEvent ||
    CapacitorCalendar.createEventWithPrompt ||
    CapacitorCalendar.createEventInteractively;
  const res = await create.call(CapacitorCalendar, payload);
  return res?.result ?? res?.id ?? true;
}

/* ------------------------------------------------------------------ */
/*  Native Reminders helpers                                           */
/* ------------------------------------------------------------------ */

async function ensureRemindersAccess() {
  const candidates = [
    'requestFullRemindersAccess',
    'requestRemindersAccess',
    'requestRemindersPermission',
  ];
  for (const name of candidates) {
    if (typeof CapacitorCalendar[name] === 'function') {
      try {
        const res = await CapacitorCalendar[name]();
        const status =
          res?.result ?? res?.status ?? res?.granted ?? res?.reminders;
        return !(status === false || status === 'denied');
      } catch {
        // try next
      }
    }
  }
  // If no specific method exists, fall back to full calendar access
  return ensureNativeAccess();
}

/**
 * Request access to iOS Reminders. Returns true if granted.
 */
export async function requestRemindersAccess() {
  if (!supportsNativeReminders()) return false;
  return ensureRemindersAccess();
}

/**
 * Create a reminder on the native iOS Reminders app.
 */
export async function createNativeReminder(reminder) {
  if (!supportsNativeReminders()) {
    throw new Error('Reminders not supported on this device');
  }
  const payload = {
    title: reminder.title,
    notes: reminder.notes || undefined,
    url: reminder.url || undefined,
    isAllDay: !!reminder.allDay,
  };
  if (reminder.dueDate) {
    payload.dueDate = reminder.dueDate.getTime();
  }
  if (reminder.priority && reminder.priority !== 'none') {
    payload.priority = priorityToNative(reminder.priority);
  }
  const reminderAlerts = alertToAlerts(reminder);
  if (reminderAlerts) payload.alerts = reminderAlerts;
  const reminderRecurrence = repeatToRecurrence(reminder);
  if (reminderRecurrence) payload.recurrence = reminderRecurrence;
  // Try known method names
  const create =
    CapacitorCalendar.createReminder ||
    CapacitorCalendar.createReminderWithPrompt;
  if (typeof create === 'function') {
    const res = await create.call(CapacitorCalendar, payload);
    return res?.result ?? res?.id ?? true;
  }
  throw new Error('Reminders not supported on this device');
}

/* ------------------------------------------------------------------ */
/*  Native Contacts helpers                                            */
/* ------------------------------------------------------------------ */

/**
 * Request access to iOS Contacts. Returns true if granted.
 */
export async function requestContactsAccess() {
  if (!supportsNativeContacts()) return false;
  const candidates = [
    'requestContactsAccess',
    'requestContactsPermission',
    'requestPermissions',
  ];
  for (const name of candidates) {
    if (typeof CapacitorCalendar[name] === 'function') {
      try {
        const res = await CapacitorCalendar[name]({ alias: 'contacts' });
        const status =
          res?.result ?? res?.status ?? res?.granted ?? res?.contacts;
        return !(status === false || status === 'denied');
      } catch {
        // try next
      }
    }
  }
  return true;
}

/* ------------------------------------------------------------------ */
/*  Web backends (no OAuth required)                                   */
/* ------------------------------------------------------------------ */

function pad(n) {
  return String(n).padStart(2, '0');
}

/** UTC basic format: 20260518T210000Z */
function toUtcStamp(date) {
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/** Local date only: 20260518 */
function toDateStamp(date) {
  return date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate());
}

function googleUrl(event) {
  let dates;
  if (event.allDay) {
    const endExclusive = new Date(event.end);
    endExclusive.setDate(endExclusive.getDate() + 1);
    dates = `${toDateStamp(event.start)}/${toDateStamp(endExclusive)}`;
  } else {
    dates = `${toUtcStamp(event.start)}/${toUtcStamp(event.end)}`;
  }
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || '',
    dates,
  });
  if (event.location) params.set('location', event.location);
  if (event.notes) params.set('details', event.notes);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function outlookUrl(event) {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title || '',
    startdt: event.start.toISOString(),
    enddt: event.end.toISOString(),
  });
  if (event.allDay) params.set('allday', 'true');
  if (event.location) params.set('location', event.location);
  if (event.notes) params.set('body', event.notes);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function buildIcs(event) {
  const uid = `${Date.now()}@bahai-calendar`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bahai Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    event.allDay
      ? `DTSTART;VALUE=DATE:${toDateStamp(event.start)}`
      : `DTSTART:${toUtcStamp(event.start)}`,
    event.allDay
      ? `DTEND;VALUE=DATE:${toDateStamp(event.end)}`
      : `DTEND:${toUtcStamp(event.end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
  ];
  if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`);
  if (event.notes) lines.push(`DESCRIPTION:${escapeIcs(event.notes)}`);
  const rrule = buildIcsRRule(event);
  if (rrule) lines.push(`RRULE:${rrule}`);
  const alarmMinutes = alertToAlerts(event)?.[0];
  if (alarmMinutes !== undefined) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcs(event.title)}`,
      `TRIGGER:${icsTrigger(alarmMinutes)}`,
      'END:VALARM',
    );
  }
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

const ICS_FREQ = {
  daily: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
  yearly: 'YEARLY',
};

/** Builds an RFC-5545 RRULE value from a stored repeat payload. */
function buildIcsRRule(event) {
  const recurrence = repeatToRecurrence(event);
  if (!recurrence) return null;
  const parts = [`FREQ=${ICS_FREQ[recurrence.frequency]}`];
  if (recurrence.interval > 1) parts.push(`INTERVAL=${recurrence.interval}`);
  if (recurrence.count) parts.push(`COUNT=${recurrence.count}`);
  else if (recurrence.end)
    parts.push(`UNTIL=${toUtcStamp(new Date(recurrence.end))}`);
  return parts.join(';');
}

/** Converts minutes-relative-to-start (negative = before) into an RFC-5545 TRIGGER duration. */
function icsTrigger(minutes) {
  const abs = Math.abs(minutes);
  const sign = minutes <= 0 ? '-' : '';
  return `${sign}PT${abs}M`;
}

function escapeIcs(text = '') {
  return String(text)
    .replaceAll('\\', String.raw`\\`)
    .replaceAll(';', String.raw`\;`)
    .replaceAll(',', String.raw`\,`)
    .replaceAll('\n', String.raw`\n`);
}

function downloadIcs(event) {
  const blob = new Blob([buildIcs(event)], {
    type: 'text/calendar;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(event.title || 'event').replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Returns the list of calendars the user can write to. On a native device this
 * enumerates every synced account (iCloud, Google, Outlook…). On the web it
 * returns the universal web shortcuts.
 *
 * @returns {Promise<Array<{id:string,name:string,provider:string,color?:string}>>}
 */
export async function getAvailableCalendars() {
  if (isNativePlatform()) {
    const native = await listNativeCalendars();
    if (native.length) return native;
  }
  return [
    { id: PROVIDER.GOOGLE, name: 'Google Calendar', provider: PROVIDER.GOOGLE },
    { id: PROVIDER.OUTLOOK, name: 'Outlook', provider: PROVIDER.OUTLOOK },
    { id: PROVIDER.ICS, name: 'Apple / iCloud (.ics)', provider: PROVIDER.ICS },
  ];
}

/**
 * Creates an event on the selected calendar.
 *
 * @param {{title:string,location?:string,notes?:string,allDay:boolean,start:Date,end:Date}} event
 * @param {{id:string,provider:string}} calendar
 */
export async function createEvent(event, calendar) {
  switch (calendar.provider) {
    case PROVIDER.NATIVE:
      return createNativeEvent(event, calendar.id);
    case PROVIDER.GOOGLE:
      window.open(googleUrl(event), '_blank', 'noopener');
      return true;
    case PROVIDER.OUTLOOK:
      window.open(outlookUrl(event), '_blank', 'noopener');
      return true;
    case PROVIDER.ICS:
    default:
      downloadIcs(event);
      return true;
  }
}
