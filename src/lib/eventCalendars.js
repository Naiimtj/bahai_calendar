import { colorForIndex, stableColorIndex } from '../services/personalCalendar';

/** Build local + device event calendars with user preferences applied. */
export function buildEventCalendars(deviceCalendars, config, localName) {
  const localCal = {
    id: 'local',
    name: config.localCalendarName || localName,
    sourceType: 'local',
    color: config.localCalendarColor || colorForIndex(0),
  };

  const named = deviceCalendars.map((c) => {
    const pref = (config.deviceCalendars || {})[c.id] || {};
    return {
      ...c,
      name: pref.customName || c.name,
      color:
        pref.color ||
        (pref.colorIndex == null
          ? c.color || colorForIndex(stableColorIndex(c.id))
          : colorForIndex(pref.colorIndex)),
    };
  });

  return [localCal, ...named];
}

/** Convert calendars into select-menu options with account grouping order. */
export function toCalendarMenuOptions(calendars) {
  const noAccount = [];
  const byAccount = new Map();

  calendars.forEach((calendar) => {
    if (!calendar.account) {
      noAccount.push(calendar);
      return;
    }

    if (!byAccount.has(calendar.account)) {
      byAccount.set(calendar.account, []);
    }

    byAccount.get(calendar.account).push(calendar);
  });

  const ordered = [...noAccount];
  byAccount.forEach((grouped) => {
    ordered.push(...grouped);
  });

  return ordered.map((c) => ({
    value: c.id,
    label: c.name,
    color: c.color || undefined,
    group: c.account || undefined,
  }));
}

/** Preferred calendar or list if the app shows it, else the first shown one. */
export function resolveDefaultCalendarId(calendars, preferredId, config) {
  const shown = calendars.filter(
    ({ id }) =>
      id === 'local' ||
      (!!config.deviceCalendarEnabled &&
        config.deviceCalendars?.[id]?.enabled !== false),
  );
  if (shown.some(({ id }) => id === preferredId)) return preferredId;
  return (shown[0] ?? calendars[0])?.id || '';
}
