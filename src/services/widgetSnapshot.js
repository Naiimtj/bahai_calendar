import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar } from '../native/bahaiCalendarNative';
import { sunsetTimestamp } from '../lib/badiCalendar';
import { MONTHNAMES } from '../lib/badiCalendarData';

// Native widgets cannot run JS: the app precomputes a window of days
// and the native bridge stores it for the platform widget provider.
// Native reader: ios/App/BahaiCalendarWidgets/WidgetSnapshot.swift

export const WIDGET_SNAPSHOT_VERSION = 2;
// Covers the whole current Gregorian month for the Gregorian month widget.
export const WIDGET_DAYS_BEFORE = 31;
export const WIDGET_DAYS_AFTER = 120;
export const WIDGET_MAX_EVENTS_PER_DAY = 3;
const MAX_TITLE_LENGTH = 60;
const LOCATION_KEY = 'bahai-location';
const RTL_LANGS = ['ar', 'fa'];
// First grid column as JS getDay() (0 = Sunday) for each `weekStart` setting.
const FIRST_WEEKDAY = { jalal: 6, sunday: 0, monday: 1 };
// JS getDay() -> Badi' weekday number (1 = Jalal / Saturday).
const BADI_WEEKDAY_BY_JS_DAY = [2, 3, 4, 5, 6, 7, 1];
const RIDVAN_TITLE = 'Riḍván';

let lastPushedJson = null;

export function isWidgetSyncSupported() {
  return ['ios', 'android'].includes(Capacitor.getPlatform());
}

/** Saved sun-times location `{ lat, lon }`, or null when missing/invalid. */
export function loadSavedLocation() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCATION_KEY));
    return Number.isFinite(saved?.lat) && Number.isFinite(saved?.lon)
      ? { lat: saved.lat, lon: saved.lon }
      : null;
  } catch {
    return null;
  }
}

function toLocalISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function widgetEvent(title, kind, color) {
  const event = { title: String(title ?? '').slice(0, MAX_TITLE_LENGTH), kind };
  if (color) event.color = color;
  return event;
}

// Same order as the calendar grid cells (CompactCalendar getCellEvents).
function eventsForDay(
  date,
  badi,
  { lang, t, getHolyDayForDate, isRidvanPeriod, eventsForDate },
) {
  const events = [];
  const holyDay = getHolyDayForDate(date);
  if (holyDay) events.push(widgetEvent(holyDay[lang] || holyDay.en, 'holyDay'));
  else if (isRidvanPeriod(date))
    events.push(widgetEvent(RIDVAN_TITLE, 'ridvan'));

  if (badi.day === 1 && badi.month >= 1 && badi.month <= 19) {
    events.push(
      widgetEvent(
        t('calendar.feastShort', { name: MONTHNAMES[badi.month] }),
        'feast',
      ),
    );
  }

  for (const ev of eventsForDate(date)) {
    const event = widgetEvent(
      ev.name,
      'personal',
      typeof ev.color === 'string' ? ev.color : null,
    );
    if (ev._raw?.isReminder) {
      event.isReminder = true;
      event.isCompleted = !!ev._raw.isCompleted;
    }
    events.push(event);
  }

  return events;
}

/**
 * Pure snapshot builder - every calendar/i18n dependency is injected.
 * @param {object} params
 * @param {Date} params.now
 * @param {string} params.lang resolved app language (en/es/fr/de/ar/fa)
 * @param {'jalal'|'sunday'|'monday'} params.weekStart
 * @param {string[]} params.weekdayInitials 7 labels already ordered from the first weekday
 * @param {(key: string, options?: object) => string} params.t
 * @param {(date: Date) => ({year:number,month:number,day:number}|null)} params.gregorianToBadi
 * @param {(date: Date) => (object|null)} params.getHolyDayForDate
 * @param {(date: Date) => boolean} params.isRidvanPeriod
 * @param {(date: Date) => Array<{name: string, color?: string}>} params.eventsForDate
 * @param {{lat:number, lon:number}|null} [params.sunsetLocation] only when the day starts at sunset
 */
export function buildWidgetSnapshot({
  now,
  lang,
  weekStart,
  weekdayInitials,
  t,
  gregorianToBadi,
  getHolyDayForDate,
  isRidvanPeriod,
  eventsForDate,
  sunsetLocation = null,
}) {
  const days = [];
  const totalDays = WIDGET_DAYS_BEFORE + WIDGET_DAYS_AFTER;

  for (let i = 0; i <= totalDays; i++) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - WIDGET_DAYS_BEFORE + i,
    );
    const badi = gregorianToBadi(date);
    if (!badi) continue;

    const events = eventsForDay(date, badi, {
      lang,
      t,
      getHolyDayForDate,
      isRidvanPeriod,
      eventsForDate,
    });

    const day = {
      date: toLocalISODate(date),
      year: badi.year,
      month: badi.month,
      day: badi.day,
      events: events.slice(0, WIDGET_MAX_EVENTS_PER_DAY),
      more: Math.max(0, events.length - WIDGET_MAX_EVENTS_PER_DAY),
    };

    if (sunsetLocation) {
      day.sunset = sunsetTimestamp(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        sunsetLocation.lat,
        sunsetLocation.lon,
      );
    }

    days.push(day);
  }

  return {
    version: WIDGET_SNAPSHOT_VERSION,
    lang,
    rtl: RTL_LANGS.includes(lang),
    firstWeekday: FIRST_WEEKDAY[weekStart] ?? FIRST_WEEKDAY.monday,
    weekdayInitials:
      Array.isArray(weekdayInitials) && weekdayInitials.length === 7
        ? weekdayInitials.map(String)
        : [],
    badiWeekdays: BADI_WEEKDAY_BY_JS_DAY.map((num) => t(`badiWeekdays.${num}`)),
    months: Array.from({ length: 20 }, (_, month) => ({
      name: MONTHNAMES[month],
      meaning: t(`badiMonths.${month}`),
    })),
    days,
  };
}

/**
 * Sends the snapshot to the native widgets; skips unchanged payloads.
 * @returns {Promise<boolean>} true when the native side was updated
 */
export async function pushWidgetSnapshot(snapshot) {
  if (!isWidgetSyncSupported()) return false;
  const json = JSON.stringify(snapshot);
  if (json === lastPushedJson) return false;
  await CapacitorCalendar.updateWidgetSnapshot({ snapshot: json });
  lastPushedJson = json;
  return true;
}
