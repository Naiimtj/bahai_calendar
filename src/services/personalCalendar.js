import { Capacitor, CapacitorHttp } from '@capacitor/core';
import {
  CapacitorCalendar,
  EventSpan,
  EventAvailability,
} from '../native/bahaiCalendarNative';

/**
 * personalCalendar — reads the user's personal calendar events and exposes
 * them in a normalized shape so they can be shown alongside Bahá'í events.
 *
 * Sources:
 *  - `device` : on iOS, every calendar synced with the Apple Calendar app
 *               (iCloud, Google, Outlook/Exchange…) read via the native bridge.
 *  - `ics`    : iCal/ICS subscription URLs (Google "secret iCal address",
 *               Outlook published calendar, Apple public calendar). Read-only.
 *  - `local`  : events the user creates inside this app, stored in the browser
 *               (localStorage).
 *
 * All times are normalized to native JS `Date` objects.
 */

const CONFIG_KEY = 'bahai-cal-personal-config';
const LOCAL_EVENTS_KEY = 'bahai-cal-local-events';
const SYNCED_EVENTS_CACHE_KEY = 'bahai-cal-synced-events';
const SYNCED_EVENTS_CACHE_VERSION = 1;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MOCK_WINDOW_DAYS_BEFORE = 120;
const MOCK_WINDOW_DAYS_AFTER = 180;
const MOCK_SOURCE_ID = 'mock-local-dev';
const MOCK_SOURCE_NAME = 'Mock (dev)';

/** Converts an inclusive last-day (allDay) end instant to the exclusive
 *  boundary expected by native calendar providers (EventKit/CalendarContract).
 *  Non all-day events pass through unchanged. */
export function toNativeEndDate(end, allDay) {
  return allDay ? end.getTime() + ONE_DAY_MS : end.getTime();
}

/** Converts a native exclusive end boundary back to the inclusive last-day
 *  instant used throughout the app UI. */
export function fromNativeEndDate(endMs, allDay) {
  return allDay ? endMs - ONE_DAY_MS : endMs;
}

export function birthdayPersonName(event) {
  const info = birthdayPersonInfo(event);
  return info?.name ?? null;
}

export function birthdayPersonInfo(event) {
  if (!event.isBirthday) return null;
  const title = event.title || '';
  const englishPossessive = title.match(
    /^(.+?)[’']s(?: (\d{1,3})(?:st|nd|rd|th))? Birthday$/i,
  );
  if (englishPossessive) {
    return {
      name: englishPossessive[1],
      age: englishPossessive[2] ? Number(englishPossessive[2]) : null,
    };
  }

  const englishOf = title.match(/^Birthday of (.+)$/i);
  if (englishOf) return { name: englishOf[1], age: null };

  return null;
}

// Predefined HEX palette for personal-event colors. Personal-event colors are
// dynamic, user-chosen values (including free-form HEX), so they are rendered
// with an inline background-color rather than a static Tailwind class.
export const SOURCE_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#84cc16',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#d946ef',
  '#ec4899',
];

export function colorForIndex(i) {
  return SOURCE_COLORS[
    ((i % SOURCE_COLORS.length) + SOURCE_COLORS.length) % SOURCE_COLORS.length
  ];
}

/** Resolves a stored color preference to a HEX string. */
export function resolveColor(pref, fallbackId) {
  if (pref?.color) return pref.color;
  if (pref?.colorIndex != null) return colorForIndex(pref.colorIndex);
  return colorForIndex(stableColorIndex(fallbackId || ''));
}

export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

function parseBooleanEnv(value) {
  if (value == null) return null;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return null;
}

function shouldUseMockEvents() {
  const forced = parseBooleanEnv(import.meta.env.VITE_ENABLE_MOCK_EVENTS);
  if (forced != null) return forced;
  return import.meta.env.DEV && import.meta.env.MODE !== 'test';
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function clampDate(date, min, max) {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let v = Math.imul(t ^ (t >>> 15), 1 | t);
    v ^= v + Math.imul(v ^ (v >>> 7), 61 | v);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(rand, min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function mockCountForDay(rand) {
  const roll = rand();
  if (roll < 0.08) return 6;
  if (roll < 0.2) return randomInt(rand, 3, 5);
  if (roll < 0.48) return randomInt(rand, 1, 2);
  return 0;
}

function mockEventForSlot(dayStart, dayIndex, slotIndex, seedKey) {
  const rand = mulberry32(hashString(`${seedKey}-${dayIndex}-${slotIndex}`));
  const allDay = rand() < 0.2;
  const startHour = allDay ? 0 : randomInt(rand, 7, 20);
  const startMinute = allDay ? 0 : randomInt(rand, 0, 3) * 15;
  const durationHours = allDay ? 24 : randomInt(rand, 1, 3);
  const start = new Date(dayStart);
  start.setHours(startHour, startMinute, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + durationHours);

  return {
    id: `${MOCK_SOURCE_ID}-${dayStart.toISOString().slice(0, 10)}-${slotIndex}`,
    title: `Mock Event ${slotIndex + 1}`,
    location: rand() < 0.35 ? 'Test location' : '',
    notes: 'Generated local mock event for calendar UI testing.',
    start,
    end,
    allDay,
    color: colorForIndex((dayIndex + slotIndex) % SOURCE_COLORS.length),
    sourceName: MOCK_SOURCE_NAME,
    sourceType: 'mock',
  };
}

function getMockWindow(windowStart, windowEnd) {
  const today = startOfDay(new Date());
  const min = new Date(today);
  min.setDate(today.getDate() - MOCK_WINDOW_DAYS_BEFORE);
  const max = new Date(today);
  max.setDate(today.getDate() + MOCK_WINDOW_DAYS_AFTER);

  const start = startOfDay(clampDate(windowStart, min, max));
  const end = startOfDay(clampDate(windowEnd, min, max));
  return start <= end ? { start, end } : null;
}

function getMockEvents(windowStart, windowEnd) {
  if (!shouldUseMockEvents()) return [];
  const boundedWindow = getMockWindow(windowStart, windowEnd);
  if (!boundedWindow) return [];

  const { start, end } = boundedWindow;
  const seedKey = `${start.getTime()}-${end.getTime()}`;
  const events = [];
  const current = new Date(start);
  let dayIndex = 0;

  while (current <= end) {
    const dayRand = mulberry32(hashString(`${seedKey}-${dayIndex}`));
    const count = mockCountForDay(dayRand);
    for (let slotIndex = 0; slotIndex < count; slotIndex++) {
      events.push(mockEventForSlot(current, dayIndex, slotIndex, seedKey));
    }
    current.setDate(current.getDate() + 1);
    dayIndex += 1;
  }

  return events;
}

/* ------------------------------------------------------------------ */
/*  Config + local events persistence                                 */
/* ------------------------------------------------------------------ */

const DEFAULT_CONFIG = {
  deviceCalendarEnabled: false,
  deviceCalendars: {},
  icsSources: [],
};

/** Deterministic color index derived from a calendar id (stable fallback). */
export function stableColorIndex(id) {
  let h = 0;
  for (let i = 0; i < (id || '').length; i++) {
    h = (h * 31 + id.codePointAt(i)) % SOURCE_COLORS.length;
  }
  return h;
}

export function loadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw
      ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
      : { ...DEFAULT_CONFIG };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  return config;
}

export function loadLocalEvents() {
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalEvents(list) {
  localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(list));
  return list;
}

function emptySyncedEventsCache() {
  return { version: SYNCED_EVENTS_CACHE_VERSION, events: [], calendars: [] };
}

function loadSyncedEventsCache() {
  try {
    const raw = localStorage.getItem(SYNCED_EVENTS_CACHE_KEY);
    if (!raw) return emptySyncedEventsCache();
    const cache = JSON.parse(raw);
    if (
      cache?.version !== SYNCED_EVENTS_CACHE_VERSION ||
      !Array.isArray(cache.events)
    ) {
      return emptySyncedEventsCache();
    }
    return {
      ...cache,
      calendars: Array.isArray(cache.calendars) ? cache.calendars : [],
    };
  } catch {
    return emptySyncedEventsCache();
  }
}

function saveSyncedEventsCache(cache) {
  try {
    localStorage.setItem(SYNCED_EVENTS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    return undefined;
  }
  return undefined;
}

function replaceCachedEvents(predicate, replacements) {
  const cache = loadSyncedEventsCache();
  saveSyncedEventsCache({
    ...cache,
    events: [
      ...cache.events.filter((event) => !predicate(event)),
      ...replacements,
    ],
  });
}

function removeCachedCalendars(predicate) {
  const cache = loadSyncedEventsCache();
  saveSyncedEventsCache({
    ...cache,
    calendars: cache.calendars.filter((calendar) => !predicate(calendar)),
  });
}

function cacheIcsEvents(sourceId, events) {
  replaceCachedEvents(
    (event) => event.sourceType === 'ics' && event.sourceId === sourceId,
    events,
  );
}

function cacheDeviceEvents(events) {
  replaceCachedEvents((event) => event.sourceType === 'device', events);
}

function cacheDeviceReminders(events) {
  replaceCachedEvents((event) => event.sourceType === 'reminder', events);
}

function cacheSyncedCalendars(sourceType, calendars) {
  const cache = loadSyncedEventsCache();
  saveSyncedEventsCache({
    ...cache,
    calendars: [
      ...cache.calendars.filter(
        (calendar) => calendar.sourceType !== sourceType,
      ),
      ...calendars.map((calendar) => ({ ...calendar, sourceType })),
    ],
  });
}

function cacheDeviceCalendars(calendars) {
  cacheSyncedCalendars('device', calendars);
}

function cacheReminderLists(lists) {
  cacheSyncedCalendars('reminder', lists);
}

function isCachedEventEnabled(event, config) {
  const prefs = config?.deviceCalendars || {};
  if (event.sourceType === 'device') {
    return (
      config?.deviceCalendarEnabled &&
      prefs[event.calendarId]?.enabled !== false
    );
  }
  if (event.sourceType === 'reminder') {
    return (
      config?.deviceCalendarEnabled && prefs[event.listId]?.enabled !== false
    );
  }
  if (event.sourceType === 'ics') {
    return (config?.icsSources || []).some(
      (source) =>
        source.id === event.sourceId && source.enabled && Boolean(source.url),
    );
  }
  return false;
}

function normalizeCachedEvent(event) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }
  return { ...event, start, end };
}

export function loadCachedSyncedEvents(
  windowStart,
  windowEnd,
  config = loadConfig(),
) {
  return loadSyncedEventsCache()
    .events.map(normalizeCachedEvent)
    .filter(Boolean)
    .filter((event) => isCachedEventEnabled(event, config))
    .filter((event) => event.end >= windowStart && event.start <= windowEnd)
    .sort((a, b) => a.start - b.start);
}

export function loadCachedSyncedCalendars() {
  return loadSyncedEventsCache().calendars;
}

function getCachedEventsForSource(sourceType, windowStart, windowEnd, config) {
  return loadCachedSyncedEvents(windowStart, windowEnd, config).filter(
    (event) => event.sourceType === sourceType,
  );
}

export function clearCachedDeviceEvents() {
  replaceCachedEvents(
    (event) => event.sourceType === 'device' || event.sourceType === 'reminder',
    [],
  );
  removeCachedCalendars(
    (calendar) =>
      calendar.sourceType === 'device' || calendar.sourceType === 'reminder',
  );
}

export function clearCachedDeviceCalendar(calendarId) {
  replaceCachedEvents(
    (event) =>
      (event.sourceType === 'device' && event.calendarId === calendarId) ||
      (event.sourceType === 'reminder' && event.listId === calendarId),
    [],
  );
  removeCachedCalendars((calendar) => calendar.id === calendarId);
}

export function clearCachedIcsSource(sourceId) {
  replaceCachedEvents(
    (event) => event.sourceType === 'ics' && event.sourceId === sourceId,
    [],
  );
}

function removeCachedSyncedEvent(eventId) {
  replaceCachedEvents((event) => event.id === eventId, []);
}

function updateCachedSyncedEvent(eventId, updates) {
  const cache = loadSyncedEventsCache();
  saveSyncedEventsCache({
    ...cache,
    events: cache.events.map((event) =>
      event.id === eventId ? { ...event, ...updates } : event,
    ),
  });
}

export function addLocalEvent(event) {
  const list = loadLocalEvents();
  const stored = {
    id: `local-${Date.now()}`,
    title: event.title,
    location: event.location || '',
    locationCoords: event.locationCoords || null,
    notes: event.notes || '',
    url: event.url || '',
    allDay: !!event.allDay,
    start: event.start.toISOString(),
    end: event.end.toISOString(),
    colorIndex: 0,
    isReminder: !!event.isReminder,
    priority: event.priority || 'none',
    availability: event.availability || 'busy',
    repeat: event.repeat || 'none',
    ...(event.repeat === 'custom' && {
      repeatCustomInterval: event.repeatCustomInterval,
      repeatCustomUnit: event.repeatCustomUnit,
    }),
    alert: event.alert || 'none',
    alert2: event.alert2 || 'none',
    ...(event.alert === 'customDate' && {
      alertCustomDate: event.alertCustomDate,
    }),
    ...(event.repeat &&
      event.repeat !== 'none' && {
        repeatEndMode: event.repeatEndMode || 'none',
        ...(event.repeatEndMode === 'date' && {
          repeatEndDate: event.repeatEndDate,
        }),
        ...(event.repeatEndMode === 'count' && {
          repeatEndCount: event.repeatEndCount,
        }),
      }),
  };
  list.push(stored);
  saveLocalEvents(list);
  return stored;
}

export function removeLocalEvent(id) {
  saveLocalEvents(loadLocalEvents().filter((e) => e.id !== id));
}

export function updateLocalEvent(id, updates) {
  const list = loadLocalEvents().map((e) => {
    if (e.id !== id) return e;
    return {
      ...e,
      ...updates,
      start: updates.start ? updates.start.toISOString() : e.start,
      end: updates.end ? updates.end.toISOString() : e.end,
    };
  });
  saveLocalEvents(list);
}

/* ------------------------------------------------------------------ */
/*  ICS parsing                                                        */
/* ------------------------------------------------------------------ */

/** Unfold RFC-5545 folded lines (continuation lines start with space/tab). */
function unfold(text) {
  return text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
}

function parseIcsDate(raw) {
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  if (h === undefined) {
    return { date: new Date(+y, +mo - 1, +d), allDay: true };
  }
  if (z === 'Z') {
    return {
      date: new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)),
      allDay: false,
    };
  }
  // Floating / TZID — approximate as device-local time.
  return { date: new Date(+y, +mo - 1, +d, +h, +mi, +s), allDay: false };
}

function parseRRule(value) {
  const rule = {};
  value.split(';').forEach((part) => {
    const [k, v] = part.split('=');
    rule[k] = v;
  });
  return rule;
}

/** Extract raw VEVENT records from ICS text. */
function parseVEvents(text) {
  const lines = unfold(text).split('\n');
  const events = [];
  let cur = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      cur = {};
    } else if (line === 'END:VEVENT') {
      if (cur && cur.start && cur.summary) events.push(cur);
      cur = null;
    } else if (cur) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const left = line.slice(0, idx);
      const value = line.slice(idx + 1);
      const name = left.split(';')[0];
      if (name === 'SUMMARY') cur.summary = value;
      else if (name === 'LOCATION') cur.location = value;
      else if (name === 'DESCRIPTION') cur.description = value;
      else if (name === 'DTSTART') cur.start = parseIcsDate(value);
      else if (name === 'DTEND') cur.end = parseIcsDate(value);
      else if (name === 'RRULE') cur.rrule = parseRRule(value);
      else if (name === 'UID') cur.uid = value;
    }
  }
  return events;
}

const WEEKDAY_MAP = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

/** Expand a VEVENT (incl. simple recurrence) into occurrences in a window. */
function expandVEvent(ev, windowStart, windowEnd) {
  const startInfo = ev.start;
  const endInfo = ev.end || {
    date: new Date(startInfo.date.getTime() + 3600000),
    allDay: startInfo.allDay,
  };
  const duration = endInfo.date.getTime() - startInfo.date.getTime();
  const allDay = startInfo.allDay;

  const make = (startDate) => ({
    start: new Date(startDate),
    end: new Date(startDate.getTime() + duration),
    allDay,
    title: ev.summary,
    location: ev.location || '',
    notes: ev.description || '',
  });

  if (!ev.rrule) {
    if (endInfo.date >= windowStart && startInfo.date <= windowEnd) {
      return [make(startInfo.date)];
    }
    return [];
  }

  const rule = ev.rrule;
  const freq = rule.FREQ;
  const interval = parseInt(rule.INTERVAL || '1', 10) || 1;
  const count = rule.COUNT ? parseInt(rule.COUNT, 10) : null;
  const until = rule.UNTIL ? parseIcsDate(rule.UNTIL)?.date : null;
  const byDay = rule.BYDAY ? rule.BYDAY.split(',') : null;

  const occurrences = [];
  const hardLimit = 1000;
  let produced = 0;
  let cursor = new Date(startInfo.date);
  const limitEnd = until && until < windowEnd ? until : windowEnd;

  for (let i = 0; i < hardLimit; i++) {
    if (cursor > limitEnd) break;
    if (count && produced >= count) break;

    if (freq === 'WEEKLY' && byDay) {
      // Emit each requested weekday within the current week.
      const weekStart = new Date(cursor);
      for (const code of byDay) {
        const wd = WEEKDAY_MAP[code.replace(/^[+-]?\d*/, '')];
        if (wd === undefined) continue;
        const day = new Date(weekStart);
        const diff = (wd - weekStart.getDay() + 7) % 7;
        day.setDate(day.getDate() + diff);
        if (count && produced >= count) break;
        if (day >= startInfo.date && day <= limitEnd) {
          if (day.getTime() + duration >= windowStart.getTime()) {
            occurrences.push(make(day));
          }
          produced += 1;
        }
      }
      cursor.setDate(cursor.getDate() + 7 * interval);
      continue;
    }

    if (cursor.getTime() + duration >= windowStart.getTime()) {
      occurrences.push(make(cursor));
    }
    produced += 1;

    if (freq === 'DAILY') cursor.setDate(cursor.getDate() + interval);
    else if (freq === 'WEEKLY') cursor.setDate(cursor.getDate() + 7 * interval);
    else if (freq === 'MONTHLY') cursor.setMonth(cursor.getMonth() + interval);
    else if (freq === 'YEARLY')
      cursor.setFullYear(cursor.getFullYear() + interval);
    else break;
  }

  return occurrences;
}

async function fetchIcsText(url) {
  if (isNativePlatform()) {
    const res = await CapacitorHttp.get({ url });
    return typeof res.data === 'string' ? res.data : String(res.data ?? '');
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ICS fetch failed: ${res.status}`);
  return res.text();
}

async function getIcsEvents(source, windowStart, windowEnd, config) {
  try {
    const text = await fetchIcsText(source.url);
    const vevents = parseVEvents(text);
    const out = [];
    vevents.forEach((ev) => {
      expandVEvent(ev, windowStart, windowEnd).forEach((occ, i) => {
        out.push({
          id: `${source.id}-${ev.uid || ev.summary}-${i}`,
          sourceId: source.id,
          ...occ,
          color: source.color || colorForIndex(source.colorIndex ?? 0),
          sourceName: source.name,
          sourceType: 'ics',
        });
      });
    });
    cacheIcsEvents(source.id, out);
    return out;
  } catch {
    return loadCachedSyncedEvents(windowStart, windowEnd, config).filter(
      (event) => event.sourceType === 'ics' && event.sourceId === source.id,
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Native device events                                              */
/* ------------------------------------------------------------------ */

function isGranted(state) {
  return state === 'granted';
}

function nativeLocationValue(item) {
  if (!item) return '';
  if (typeof item.location === 'string' && item.location) return item.location;
  if (typeof item.eventLocation === 'string' && item.eventLocation) {
    return item.eventLocation;
  }
  if (typeof item.venue === 'string' && item.venue) return item.venue;
  if (
    typeof item.structuredLocation?.title === 'string' &&
    item.structuredLocation.title
  ) {
    return item.structuredLocation.title;
  }
  return '';
}

function nativeLocationCoords(item) {
  const latitude = item?.structuredLocation?.latitude;
  const longitude = item?.structuredLocation?.longitude;
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { latitude, longitude };
  }
  return null;
}

/**
 * Triggers the iOS permission prompt for full calendar access.
 * Returns true if access was granted.
 */
export async function requestDeviceCalendarAccess() {
  if (!isNativePlatform()) return false;
  try {
    const { result } = await CapacitorCalendar.requestFullCalendarAccess();
    return isGranted(result);
  } catch {
    return false;
  }
}

async function ensureNativeReadAccess() {
  if (!isNativePlatform()) return false;
  try {
    const perms = await CapacitorCalendar.checkAllPermissions();
    const current = perms?.result?.readCalendar ?? perms?.result?.writeCalendar;
    if (isGranted(current)) return true;
  } catch {
    // fall through to request
  }
  return requestDeviceCalendarAccess();
}

/**
 * Lists the calendars available on the device (iCloud, Gmail, Outlook…).
 * @returns {Promise<Array<{id,title,color,sourceName}>>}
 */
export async function getDeviceCalendars(config = loadConfig()) {
  if (!isNativePlatform()) return [];
  try {
    const granted = await ensureNativeReadAccess();
    if (!granted) {
      return loadCachedSyncedCalendars().filter(
        (calendar) => calendar.sourceType === 'device',
      );
    }
    const { result } = await CapacitorCalendar.listCalendars();
    const list = Array.isArray(result) ? result : [];
    const calendars = list.map((c) => ({
      id: c.id,
      title: c.title || '(sin nombre)',
      color: c.color || null,
      sourceName: c.source?.title || c.accountName || '',
    }));
    cacheDeviceCalendars(
      calendars.filter(
        (calendar) => config.deviceCalendars?.[calendar.id]?.enabled !== false,
      ),
    );
    return calendars;
  } catch {
    return loadCachedSyncedCalendars().filter(
      (calendar) => calendar.sourceType === 'device',
    );
  }
}

async function getDeviceEvents(windowStart, windowEnd, config) {
  if (!isNativePlatform()) return [];
  const cachedEvents = () =>
    getCachedEventsForSource('device', windowStart, windowEnd, config);
  try {
    const granted = await ensureNativeReadAccess();
    if (!granted) return cachedEvents();
    const calendars = await getDeviceCalendars(config);
    const calMap = new Map(calendars.map((c) => [c.id, c]));
    const prefs = config?.deviceCalendars || {};
    const { result } = await CapacitorCalendar.listEventsInRange({
      from: windowStart.getTime(),
      to: windowEnd.getTime(),
    });
    const list = Array.isArray(result) ? result : [];
    const events = list
      .filter((e) => prefs[e.calendarId]?.enabled !== false)
      .map((e, i) => {
        const start = new Date(e.startDate);
        const end = new Date(
          fromNativeEndDate(e.endDate ?? e.startDate + 3600000, !!e.isAllDay),
        );
        const pref = prefs[e.calendarId];
        const color =
          pref?.color ||
          (pref?.colorIndex == null
            ? calMap.get(e.calendarId)?.color ||
              colorForIndex(stableColorIndex(e.calendarId))
            : colorForIndex(pref.colorIndex));
        return {
          id: e.id ?? `device-${i}`,
          calendarId: e.calendarId,
          title: e.title || '(sin título)',
          isBirthday: e.isBirthday === true,
          start,
          end,
          allDay: !!e.isAllDay,
          location: nativeLocationValue(e),
          locationCoords: nativeLocationCoords(e),
          notes: e.description || '',
          url: e.url || '',
          color,
          alerts: Array.isArray(e.alerts) ? e.alerts : [],
          alert: alertsToAlertValue(e.alerts),
          alert2: alertsToAlertValue(
            Array.isArray(e.alerts) ? e.alerts.slice(1) : [],
          ),
          availability: availabilityFromNative(e.availability),
          sourceName:
            prefs[e.calendarId]?.customName ||
            calMap.get(e.calendarId)?.title ||
            'Device',
          sourceType: 'device',
        };
      });
    cacheDeviceEvents(events);
    return events;
  } catch {
    return cachedEvents();
  }
}

/* ------------------------------------------------------------------ */
/*  Native device reminders                                           */
/* ------------------------------------------------------------------ */

async function ensureRemindersReadAccess() {
  if (!isNativePlatform()) return false;
  try {
    const perms = await CapacitorCalendar.checkAllPermissions();
    const current =
      perms?.result?.readReminders ?? perms?.result?.writeReminders;
    if (isGranted(current)) return true;
  } catch {
    // fall through to request
  }
  try {
    if (typeof CapacitorCalendar.requestFullRemindersAccess === 'function') {
      const { result } = await CapacitorCalendar.requestFullRemindersAccess();
      return isGranted(result);
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Reads iOS Reminders that fall within [windowStart, windowEnd] and normalizes
 * them to the shared event shape (with `isReminder`/`isCompleted` flags).
 * Reminders without a due/start date can't be placed on a day and are skipped.
 */
async function getDeviceReminders(windowStart, windowEnd, config) {
  if (!isNativePlatform()) return [];
  const cachedReminders = () =>
    getCachedEventsForSource('reminder', windowStart, windowEnd, config);
  if (typeof CapacitorCalendar.getRemindersFromLists !== 'function') {
    return cachedReminders();
  }
  try {
    const granted = await ensureRemindersReadAccess();
    if (!granted) return cachedReminders();
    const listsRes = await CapacitorCalendar.getRemindersLists();
    const lists = Array.isArray(listsRes?.result) ? listsRes.result : [];
    if (lists.length === 0) {
      cacheDeviceReminders([]);
      cacheReminderLists([]);
      return [];
    }
    const prefs = config?.deviceCalendars || {};
    cacheReminderLists(
      lists
        .filter((list) => prefs[list.id]?.enabled !== false)
        .map((list) => ({
          id: list.id,
          title: list.title || '(sin nombre)',
          color: list.color || null,
        })),
    );
    const listColor = new Map(lists.map((l) => [l.id, l.color]));
    const listIds = lists.map((l) => l.id).filter(Boolean);
    const remRes = await CapacitorCalendar.getRemindersFromLists({ listIds });
    const reminders = Array.isArray(remRes?.result) ? remRes.result : [];
    const startMs = windowStart.getTime();
    const endMs = windowEnd.getTime();
    const events = reminders
      .filter((r) => prefs[r.listId]?.enabled !== false)
      .map((r) => {
        const due = r.dueDate ?? r.startDate;
        if (due == null || due < startMs || due > endMs) return null;
        const date = new Date(due);
        const dateOnly =
          date.getHours() === 0 &&
          date.getMinutes() === 0 &&
          date.getSeconds() === 0;
        const pref = prefs[r.listId];
        const color =
          pref?.color ||
          (pref?.colorIndex == null
            ? listColor.get(r.listId) ||
              colorForIndex(stableColorIndex(r.listId || r.id))
            : colorForIndex(pref.colorIndex));
        return {
          id: r.id,
          title: r.title || '(sin título)',
          start: date,
          end: date,
          allDay: dateOnly,
          location: nativeLocationValue(r),
          notes: r.notes || '',
          url: r.url || '',
          color,
          isReminder: true,
          isCompleted: !!r.isCompleted,
          listId: r.listId,
          sourceName: 'Reminders',
          sourceType: 'reminder',
        };
      })
      .filter(Boolean);
    cacheDeviceReminders(events);
    return events;
  } catch {
    return cachedReminders();
  }
}

/**
 * Lists the iOS Reminders lists (EKCalendars of type reminder) so the user can
 * pick where to add a reminder and choose which lists appear in the app.
 * @returns {Promise<Array<{id:string,title:string,color:?string}>>}
 */
export async function getReminderLists(config = loadConfig()) {
  if (!isNativePlatform()) return [];
  if (typeof CapacitorCalendar.getRemindersLists !== 'function') return [];
  try {
    const granted = await ensureRemindersReadAccess();
    if (!granted) {
      return loadCachedSyncedCalendars().filter(
        (calendar) => calendar.sourceType === 'reminder',
      );
    }
    const { result } = await CapacitorCalendar.getRemindersLists();
    const list = Array.isArray(result) ? result : [];
    const lists = list.map((l) => ({
      id: l.id,
      title: l.title || '(sin nombre)',
      color: l.color || null,
    }));
    cacheReminderLists(
      lists.filter(
        (calendar) => config.deviceCalendars?.[calendar.id]?.enabled !== false,
      ),
    );
    return lists;
  } catch {
    return loadCachedSyncedCalendars().filter(
      (calendar) => calendar.sourceType === 'reminder',
    );
  }
}

/** Marks a native iOS reminder as completed / not completed. */
export async function setDeviceReminderCompleted(id, completed) {
  if (!isNativePlatform()) return false;
  if (typeof CapacitorCalendar.modifyReminder !== 'function') return false;
  try {
    await CapacitorCalendar.modifyReminder({
      id,
      isCompleted: completed,
      ...(completed ? { completionDate: Date.now() } : {}),
    });
    updateCachedSyncedEvent(id, { isCompleted: completed });
    return true;
  } catch {
    return false;
  }
}

/** Updates the editable fields of a native iOS reminder. */
export async function updateDeviceReminder(id, updates) {
  if (!isNativePlatform()) return false;
  if (typeof CapacitorCalendar.modifyReminder !== 'function') return false;
  try {
    const options = { id };
    if (updates.title !== undefined) options.title = updates.title;
    if (updates.notes !== undefined) options.notes = updates.notes || '';
    if (updates.url !== undefined) options.url = updates.url || '';
    if (updates.location !== undefined)
      options.location = updates.location || '';
    if (updates.listId) options.listId = updates.listId;
    if (updates.priority && updates.priority !== 'none') {
      options.priority = priorityToNative(updates.priority);
    }
    if (updates.start instanceof Date) {
      options.dueDate = updates.start.getTime();
      options.isAllDay = !!updates.allDay;
    }
    const alerts = alertToAlerts(updates);
    if (alerts) options.alerts = alerts;
    const recurrence = repeatToRecurrence(updates);
    if (recurrence) options.recurrence = recurrence;
    await CapacitorCalendar.modifyReminder(options);
    removeCachedSyncedEvent(id);
    return true;
  } catch {
    return false;
  }
}

/** Deletes a native iOS reminder. */
export async function deleteDeviceReminder(id) {
  if (!isNativePlatform()) return false;
  if (typeof CapacitorCalendar.deleteReminder !== 'function') return false;
  try {
    await CapacitorCalendar.deleteReminder({ id });
    removeCachedSyncedEvent(id);
    return true;
  } catch {
    return false;
  }
}

/** Calls `callback` when the device Calendar/Reminders database changes; returns an unsubscribe function. */
export function onDeviceCalendarChange(callback) {
  if (!isNativePlatform()) return () => {};
  const handle = Promise.resolve(
    CapacitorCalendar.addListener('eventStoreChanged', callback),
  ).catch(() => null);
  return () => {
    handle.then((listener) => listener?.remove());
  };
}

/* ------------------------------------------------------------------ */
/*  Native device event mutations                                     */
/* ------------------------------------------------------------------ */

/** Deletes an event. Recurring events cascade to this-and-future occurrences. */
export async function deleteDeviceEvent(eventId) {
  if (!isNativePlatform()) return false;
  try {
    await CapacitorCalendar.deleteEvent({
      id: eventId,
      span: EventSpan.THIS_AND_FUTURE_EVENTS,
    });
    removeCachedSyncedEvent(eventId);
    return true;
  } catch {
    return false;
  }
}

export async function updateDeviceEvent(eventId, updates) {
  if (!isNativePlatform()) return false;
  try {
    const options = { id: eventId, span: EventSpan.THIS_AND_FUTURE_EVENTS };
    if (updates.title !== undefined) options.title = updates.title;
    if (updates.location !== undefined) options.location = updates.location;
    if (updates.locationCoords) {
      options.latitude = updates.locationCoords.latitude;
      options.longitude = updates.locationCoords.longitude;
    }
    if (updates.notes !== undefined) options.description = updates.notes;
    if (updates.url !== undefined) options.url = updates.url || '';
    if (updates.calendarId !== undefined) {
      options.calendarId = updates.calendarId;
    }
    if (updates.allDay !== undefined) options.isAllDay = updates.allDay;
    if (updates.start) options.startDate = updates.start.getTime();
    if (updates.end) {
      options.endDate = toNativeEndDate(updates.end, !!updates.allDay);
    }
    if (updates.availability) {
      options.availability = availabilityToNative(updates.availability);
    }
    const recurrence = repeatToRecurrence(updates);
    if (recurrence) options.recurrence = recurrence;
    const alerts = alertToAlerts(updates);
    if (alerts) options.alerts = alerts;
    await CapacitorCalendar.modifyEvent(options);
    removeCachedSyncedEvent(eventId);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Repeat / alert helpers (shared by local events and native device   */
/*  events).                                                            */
/* ------------------------------------------------------------------ */

function unitToFrequency(unit) {
  return (
    { day: 'daily', week: 'weekly', month: 'monthly', year: 'yearly' }[unit] ||
    'daily'
  );
}

/** Resolves a repeat value into a { unit, interval } step used to advance occurrences. */
function repeatUnitAndInterval(e) {
  switch (e.repeat) {
    case 'daily':
      return { unit: 'day', interval: 1 };
    case 'weekly':
      return { unit: 'week', interval: 1 };
    case 'biweekly':
      return { unit: 'week', interval: 2 };
    case 'monthly':
      return { unit: 'month', interval: 1 };
    case 'yearly':
      return { unit: 'year', interval: 1 };
    case 'custom':
      return {
        unit: e.repeatCustomUnit || 'day',
        interval: e.repeatCustomInterval || 1,
      };
    default:
      return null;
  }
}

function addRepeatInterval(date, unit, interval) {
  const d = new Date(date);
  if (unit === 'day') d.setDate(d.getDate() + interval);
  else if (unit === 'week') d.setDate(d.getDate() + interval * 7);
  else if (unit === 'month') d.setMonth(d.getMonth() + interval);
  else if (unit === 'year') d.setFullYear(d.getFullYear() + interval);
  return d;
}

/** Builds a native `EventRecurrenceRule` from a stored repeat payload. */
export function repeatToRecurrence(e) {
  const ri = repeatUnitAndInterval(e);
  if (!ri) return undefined;
  const recurrence = {
    frequency: unitToFrequency(ri.unit),
    interval: ri.interval,
  };
  if (e.repeatEndMode === 'date' && e.repeatEndDate) {
    recurrence.end = new Date(`${e.repeatEndDate}T23:59:59`).getTime();
  } else if (e.repeatEndMode === 'count' && e.repeatEndCount) {
    recurrence.count = e.repeatEndCount;
  }
  return recurrence;
}

const ALERT_MINUTES_BEFORE = {
  atTime: 0,
  '5m': -5,
  '10m': -10,
  '15m': -15,
  '30m': -30,
  '1h': -60,
  '2h': -120,
  '1d': -1440,
};

/** Resolves a single stored alert enum into minutes-relative-to-start. */
function singleAlertMinutes(value, e) {
  if (!value || value === 'none') return undefined;
  if (value === 'customDate') {
    if (!e.alertCustomDate || !e.start) return undefined;
    return Math.round(
      (new Date(e.alertCustomDate).getTime() - e.start.getTime()) / 60000,
    );
  }
  return ALERT_MINUTES_BEFORE[value];
}

/**
 * Builds a native `alerts` (minutes-relative-to-start) array from a stored
 * alert payload. Supports a primary (`alert`) and an optional secondary
 * (`alert2`) alert, mirroring iOS Calendar's "Alert" + "Second Alert".
 */
export function alertToAlerts(e) {
  const alerts = [];
  const first = singleAlertMinutes(e.alert, e);
  if (first !== undefined) alerts.push(first);
  const second = singleAlertMinutes(e.alert2, e);
  if (second !== undefined && second !== first) alerts.push(second);
  return alerts.length ? alerts : undefined;
}

const ALERT_VALUE_BY_MINUTES = Object.fromEntries(
  Object.entries(ALERT_MINUTES_BEFORE).map(([value, minutes]) => [
    minutes,
    value,
  ]),
);

/**
 * Resolves a native `alerts` (minutes-relative-to-start) array back into our
 * stored `alert` enum value, so device events display/edit the same way as
 * local events. Alerts set outside the app (e.g. directly in Apple Calendar)
 * that don't match one of our presets fall back to `'none'` here — the raw
 * `alerts` array is kept alongside so the UI can still show the exact value.
 */
export function alertsToAlertValue(alerts) {
  if (!Array.isArray(alerts) || alerts.length === 0) return 'none';
  return ALERT_VALUE_BY_MINUTES[alerts[0]] ?? 'none';
}

/* ------------------------------------------------------------------ */
/*  Availability ("Show As") + reminder priority mappings              */
/* ------------------------------------------------------------------ */

const AVAILABILITY_TO_NATIVE = {
  busy: EventAvailability.BUSY,
  free: EventAvailability.FREE,
  tentative: EventAvailability.TENTATIVE,
};

const NATIVE_TO_AVAILABILITY = {
  [EventAvailability.BUSY]: 'busy',
  [EventAvailability.FREE]: 'free',
  [EventAvailability.TENTATIVE]: 'tentative',
};

/** Maps our stored availability string to the native EventAvailability enum. */
export function availabilityToNative(value) {
  return AVAILABILITY_TO_NATIVE[value] ?? EventAvailability.BUSY;
}

/** Maps a native EventAvailability enum back to our stored availability string. */
export function availabilityFromNative(value) {
  return NATIVE_TO_AVAILABILITY[value] ?? 'busy';
}

// EKReminderPriority: 0 = none, 1 = high, 5 = medium, 9 = low (Apple).
const PRIORITY_TO_NATIVE = { none: 0, high: 1, medium: 5, low: 9 };

/** Maps our stored reminder-priority string to the native integer priority. */
export function priorityToNative(value) {
  return PRIORITY_TO_NATIVE[value] ?? 0;
}

/* ------------------------------------------------------------------ */
/*  Aggregation                                                        */
/* ------------------------------------------------------------------ */

const MAX_LOCAL_OCCURRENCES = 500;

/** Builds the display-shape shared by every occurrence of a local event. */
function localEventBase(e, config) {
  return {
    id: e.id,
    title: e.title,
    allDay: !!e.allDay,
    location: e.location || '',
    notes: e.notes || '',
    url: e.url || '',
    isReminder: !!e.isReminder,
    isCompleted: !!e.isCompleted,
    priority: e.priority || 'none',
    availability: e.availability || 'busy',
    repeat: e.repeat || 'none',
    repeatCustomInterval: e.repeatCustomInterval,
    repeatCustomUnit: e.repeatCustomUnit,
    alert: e.alert || 'none',
    alert2: e.alert2 || 'none',
    alertCustomDate: e.alertCustomDate,
    repeatEndMode: e.repeatEndMode || 'none',
    repeatEndDate: e.repeatEndDate,
    repeatEndCount: e.repeatEndCount,
    color:
      e.color || config.localCalendarColor || colorForIndex(e.colorIndex ?? 0),
    sourceName: config.localCalendarName || '',
    sourceType: 'local',
  };
}

/** Last allowed occurrence start date, bounded by the repeat end-date (if any) and the window. */
function repeatRangeEnd(e, windowEnd) {
  if (e.repeatEndMode !== 'date' || !e.repeatEndDate) return windowEnd;
  const endLimit = new Date(`${e.repeatEndDate}T23:59:59`);
  return endLimit < windowEnd ? endLimit : windowEnd;
}

/** Generates occurrence { start, end } pairs for a recurring event overlapping the window. */
function generateOccurrences(start, duration, ri, e, windowStart, windowEnd) {
  const rangeEnd = repeatRangeEnd(e, windowEnd);
  const countLimit = e.repeatEndMode === 'count' ? e.repeatEndCount : null;

  const occurrences = [];
  let cursor = new Date(start);
  let produced = 0;
  for (let i = 0; i < MAX_LOCAL_OCCURRENCES; i++) {
    if (cursor > rangeEnd || (countLimit && produced >= countLimit)) break;
    const occEnd = new Date(cursor.getTime() + duration);
    if (occEnd >= windowStart && cursor <= windowEnd) {
      occurrences.push({ start: new Date(cursor), end: occEnd });
    }
    produced += 1;
    cursor = addRepeatInterval(cursor, ri.unit, ri.interval);
  }
  return occurrences;
}

/** Expands a (possibly recurring) local event into occurrences overlapping the window. */
function expandLocalEvent(e, windowStart, windowEnd, config) {
  const start = new Date(e.start);
  const end = new Date(e.end);
  const base = localEventBase(e, config);

  const ri = repeatUnitAndInterval(e);
  if (!ri) {
    return end >= windowStart && start <= windowEnd
      ? [{ ...base, start, end }]
      : [];
  }

  const duration = end.getTime() - start.getTime();
  return generateOccurrences(
    start,
    duration,
    ri,
    e,
    windowStart,
    windowEnd,
  ).map((occ) => ({ ...base, ...occ }));
}

function getLocalNormalized(windowStart, windowEnd, config = {}) {
  return loadLocalEvents().flatMap((e) =>
    expandLocalEvent(e, windowStart, windowEnd, config),
  );
}

/**
 * Returns all personal events overlapping [windowStart, windowEnd].
 * @returns {Promise<Array>}
 */
export async function aggregateEvents(
  windowStart,
  windowEnd,
  config = loadConfig(),
) {
  const tasks = [];
  if (config.deviceCalendarEnabled) {
    tasks.push(
      getDeviceEvents(windowStart, windowEnd, config),
      getDeviceReminders(windowStart, windowEnd, config),
    );
  }
  (config.icsSources || [])
    .filter((s) => s.enabled && s.url)
    .forEach((s) =>
      tasks.push(getIcsEvents(s, windowStart, windowEnd, config)),
    );

  const results = await Promise.all(tasks);
  const events = results.flat();
  events.push(...getLocalNormalized(windowStart, windowEnd, config));
  events.push(...getMockEvents(windowStart, windowEnd));
  events.sort((a, b) => a.start - b.start);
  return events;
}
