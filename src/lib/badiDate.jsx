// ── Bahá'í (Badí') Calendar Logic ──
// Calculation functions (gregorianToBadi, badiToGregorian, holy days, etc.)
// are now provided by the API via BadiYearContext.
// This file retains only static data and formatting helpers.

import i18n from '../i18n';

export const BADI_MONTHS = [
  { num: 1, ar: 'Bahá' },
  { num: 2, ar: 'Jalál' },
  { num: 3, ar: 'Jamál' },
  { num: 4, ar: '\u2018Aẓamat' },
  { num: 5, ar: 'Núr' },
  { num: 6, ar: 'Raḥmat' },
  { num: 7, ar: 'Kalimát' },
  { num: 8, ar: 'Kamál' },
  { num: 9, ar: 'Asmá\u2019' },
  { num: 10, ar: '\u2018Izzat' },
  { num: 11, ar: 'Mashíyyat' },
  { num: 12, ar: '\u2018Ilm' },
  { num: 13, ar: 'Qudrat' },
  { num: 14, ar: 'Qawl' },
  { num: 15, ar: 'Masá\u2019il' },
  { num: 16, ar: 'Sharaf' },
  { num: 17, ar: 'Sulṭán' },
  { num: 18, ar: 'Mulk' },
  { num: 0, ar: 'Ayyám-i-Há' },
  { num: 19, ar: '\u2018Alá\u2019' },
];

export const BADI_WEEKDAYS = [
  { num: 1, ar: 'Jalál', gregDay: 6 }, // Saturday
  { num: 2, ar: 'Jamál', gregDay: 0 }, // Sunday
  { num: 3, ar: 'Kamál', gregDay: 1 }, // Monday
  { num: 4, ar: 'Fiḍál', gregDay: 2 }, // Tuesday
  { num: 5, ar: '\u2018Idál', gregDay: 3 }, // Wednesday
  { num: 6, ar: 'Istijlál', gregDay: 4 }, // Thursday
  { num: 7, ar: 'Istiqlál', gregDay: 5 }, // Friday
];

// Get month info by number
export function getMonthInfo(monthNum) {
  return BADI_MONTHS.find((m) => m.num === monthNum);
}

// Get month display name
export function getMonthName(monthNum, lang = 'en', inline = false) {
  const info = getMonthInfo(monthNum);
  if (!info) return '';
  if (lang === 'ar') return info.ar;
  const meaning = i18n.t(`badiMonths.${monthNum}`);
  if (inline) return `${info.ar} (${meaning})`;
  return (
    <span className="flex flex-col items-start leading-tight">
      <span>{info.ar}</span>
      <span className="text-xs">{meaning}</span>
    </span>
  );
}

// Get weekday translated name by Bahá'í weekday number
export function getWeekdayName(num) {
  return i18n.t(`badiWeekdays.${num}`);
}

// ── Gregorian formatting helpers ──

export function formatGregorianDate(date, lang = 'en') {
  return new Intl.DateTimeFormat(lang, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function getGregorianMonthName(monthIndex, lang = 'en') {
  return new Intl.DateTimeFormat(lang, { month: 'long' }).format(
    new Date(2000, monthIndex),
  );
}

export function getGregorianWeekdayShort(dayIndex, lang = 'en') {
  return new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(
    new Date(2000, 0, dayIndex + 2),
  );
}

export function getGregorianWeekdayFull(dayIndex, lang = 'en') {
  return new Intl.DateTimeFormat(lang, { weekday: 'long' }).format(
    new Date(2000, 0, dayIndex + 2),
  );
}

// Format secondary date according to user preference
export function formatSecondaryDate(date, format = 'name', lang = 'en') {
  const day = date.getDate();
  const month = date.getMonth();

  if (format === 'numbers') {
    // Format as MM/DD
    return `${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
  }

  // Format as "MMM DD" (default)
  const monthName = getGregorianMonthName(month, lang).slice(0, 3);
  return `${monthName} ${day}`;
}

// Format Badí' secondary date according to user preference
export function formatBadiSecondaryDate(badiMonth, badiDay, format = 'name') {
  if (format === 'numbers') {
    // Format as DD/MM (e.g., "15/3")
    return `${badiDay}/${badiMonth === 0 ? 'AH' : badiMonth}`;
  }

  // Format as "Month DD" (default) - e.g., "Jamál 15"
  const info = getMonthInfo(badiMonth);
  if (!info) return `${badiDay}`;
  return `${info.ar.length > 6 ? info.ar.slice(0, 6) + '.' : info.ar} ${badiDay}`;
}

// Reorder weekday headers based on week start setting
// Input: weekdayArray - array of 7 weekday labels starting with Monday
// weekStart: 'jalal' (Saturday) | 'sunday' | 'monday'
export function reorderWeekdays(weekdayArray, weekStart = 'monday') {
  if (!Array.isArray(weekdayArray) || weekdayArray.length !== 7) {
    return weekdayArray;
  }

  // weekdayArray is assumed to be [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  if (weekStart === 'jalal') {
    // Start with Saturday: [Sat, Sun, Mon, Tue, Wed, Thu, Fri]
    return [weekdayArray[5], weekdayArray[6], ...weekdayArray.slice(0, 5)];
  } else if (weekStart === 'sunday') {
    // Start with Sunday: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
    return [weekdayArray[6], ...weekdayArray.slice(0, 6)];
  }

  // Default: monday start (no change)
  return weekdayArray;
}

// Calculate first day offset for Gregorian calendar based on weekStart
// gregDay: 0=Sunday, 1=Monday, ..., 6=Saturday
// weekStart: 'jalal' (Saturday) | 'sunday' | 'monday'
// Returns: column index for the first day of the month
export function getFirstDayColumn(gregDay, weekStart = 'monday') {
  if (weekStart === 'jalal') {
    // Week starts Saturday (6): Sat=0, Sun=1, Mon=2, ..., Fri=6
    return (gregDay + 1) % 7;
  } else if (weekStart === 'sunday') {
    // Week starts Sunday (0): Sun=0, Mon=1, ..., Sat=6
    return gregDay;
  }
  // Default: monday (1): Mon=0, Tue=1, ..., Sun=6
  return gregDay === 0 ? 6 : gregDay - 1;
}
