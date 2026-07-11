/**
 * Time formatting helpers honoring the user's `timeFormat` setting
 * ('system' | '24' | '12'). Reads from the persisted settings so it can be
 * used outside of React (e.g. in context providers).
 */

function readTimeFormat() {
  try {
    const saved = localStorage.getItem('bahai-cal-settings');
    if (!saved) return 'system';
    return JSON.parse(saved).timeFormat || 'system';
  } catch {
    return 'system';
  }
}

/** Returns the `hour12` option for Intl based on the setting, or undefined for system. */
export function hour12Option(format = readTimeFormat()) {
  if (format === '12') return true;
  if (format === '24') return false;
  return undefined;
}

/** Format a Date as a clock time honoring the time-format setting. */
export function formatClockTime(date, format = readTimeFormat()) {
  if (!date) return '';
  const opts = { hour: '2-digit', minute: '2-digit' };
  const hour12 = hour12Option(format);
  if (hour12 !== undefined) opts.hour12 = hour12;
  return date.toLocaleTimeString([], opts);
}
