// ── Bahá'í (Badí') calendar calculations ──
// Self-contained calendar engine: Naw-Rúz, holy days, feast months and
// Badí' ↔ Gregorian conversion. Pure functions, no React / no I/O, so the
// module is unit-testable in isolation.
//
// All dates are handled in UTC internally (Date.UTC + millisecond math) to
// avoid DST/timezone drift, and emitted as 'YYYY-MM-DD' strings — the exact
// shape the previous HTTP API returned.
//
// Calendar structure:
//   - 19 months × 19 days = 361 days
//   - Ayyám-i-Há (intercalary days, 4 or 5) between month 18 and 19
//   - Month 19 ('Alá') = fasting month
//   - Naw-Rúz (New Year) = vernal equinox as seen from Tehran (since 172 BE / 2015)

import {
  MONTHNAMES,
  EVENT_KEYS,
  resolveTranslations,
} from './badiCalendarData';

// Bahá'í year = Gregorian year − 1843
export const BADI_EPOCH_OFFSET = 1843;

// Tehran coordinates (matches the reference implementation)
const TEHRAN_LAT = 35.6944;
const TEHRAN_LON = 51.2887;

// Regular holy days (lunar-based Twin Holy Days are handled separately).
export const BAHAI_EVENTS = [
  { name: 'Naw-Rúz', month: 1, day: 1 },
  { name: 'First Day of Riḍván', month: 2, day: 13 },
  { name: 'Ninth Day of Riḍván', month: 3, day: 2 },
  { name: 'Twelfth Day of Riḍván', month: 3, day: 5 },
  { name: 'Declaration of the Báb', month: 4, day: 8 },
  { name: "Ascension of Bahá'u'lláh", month: 4, day: 13 },
  { name: 'Martyrdom of the Báb', month: 6, day: 17 },
  { name: 'Birth of the Báb', month: 12, day: 5 },
  { name: "Birth of Bahá'u'lláh", month: 12, day: 6 },
  { name: 'Day of the Covenant', month: 14, day: 4 },
  { name: "Ascension of 'Abdu'l-Bahá", month: 14, day: 6 },
];

// ---------------------------------------------------------------------------
//  Pre-computed Naw-Rúz (Western calendar) dates – Badí years 172–222
//  Source: verified against official Bahá'í calendar
// ---------------------------------------------------------------------------
const NAW_RUZ_TABLE = {
  172: [2015, 3, 21],
  173: [2016, 3, 20],
  174: [2017, 3, 20],
  175: [2018, 3, 21],
  176: [2019, 3, 21],
  177: [2020, 3, 20],
  178: [2021, 3, 20],
  179: [2022, 3, 21],
  180: [2023, 3, 21],
  181: [2024, 3, 20],
  182: [2025, 3, 20],
  183: [2026, 3, 21],
  184: [2027, 3, 21],
  185: [2028, 3, 20],
  186: [2029, 3, 20],
  187: [2030, 3, 20],
  188: [2031, 3, 21],
  189: [2032, 3, 20],
  190: [2033, 3, 20],
  191: [2034, 3, 20],
  192: [2035, 3, 21],
  193: [2036, 3, 20],
  194: [2037, 3, 20],
  195: [2038, 3, 20],
  196: [2039, 3, 21],
  197: [2040, 3, 20],
  198: [2041, 3, 20],
  199: [2042, 3, 20],
  200: [2043, 3, 21],
  201: [2044, 3, 20],
  202: [2045, 3, 20],
  203: [2046, 3, 20],
  204: [2047, 3, 21],
  205: [2048, 3, 20],
  206: [2049, 3, 20],
  207: [2050, 3, 20],
  208: [2051, 3, 21],
  209: [2052, 3, 20],
  210: [2053, 3, 20],
  211: [2054, 3, 20],
  212: [2055, 3, 21],
  213: [2056, 3, 20],
  214: [2057, 3, 20],
  215: [2058, 3, 20],
  216: [2059, 3, 20],
  217: [2060, 3, 20],
  218: [2061, 3, 20],
  219: [2062, 3, 20],
  220: [2063, 3, 20],
  221: [2064, 3, 20],
  222: [2065, 3, 20],
};

// Periodic terms for the March equinox — Meeus Table 27.c
const EQUINOX_TERMS = [
  [485, 324.96, 1934.136],
  [203, 337.23, 32964.467],
  [199, 342.08, 20.186],
  [182, 27.85, 445267.112],
  [156, 73.14, 45036.886],
  [136, 171.52, 22518.443],
  [77, 222.54, 65928.934],
  [74, 296.72, 3034.906],
  [70, 243.58, 9037.513],
  [58, 119.81, 33718.147],
  [52, 297.17, 150.678],
  [50, 21.02, 2281.226],
  [45, 247.54, 29929.562],
  [44, 325.15, 31555.956],
  [29, 60.93, 4443.417],
  [18, 155.12, 67555.328],
  [17, 288.79, 4562.452],
  [16, 198.04, 62894.029],
  [14, 199.76, 31436.921],
  [12, 95.39, 14577.848],
  [12, 287.11, 31931.756],
  [12, 320.81, 34777.259],
  [9, 227.73, 1222.114],
  [8, 15.45, 16859.074],
];

// Twin Holy Days official dates (based on lunar calendar calculations).
// Source: Bahá'í Dates 172 to 221 B.E. (2015 – 2065), Universal House of Justice.
// Format: year: [Birth of the Báb, Birth of Bahá'u'lláh]
const TWIN_HOLY_DAYS = {
  2015: ['2015-10-29', '2015-10-30'],
  2016: ['2016-10-17', '2016-10-18'],
  2017: ['2017-11-06', '2017-11-07'],
  2018: ['2018-10-26', '2018-10-27'],
  2019: ['2019-10-15', '2019-10-16'],
  2020: ['2020-11-02', '2020-11-03'],
  2021: ['2021-10-22', '2021-10-23'],
  2022: ['2022-10-11', '2022-10-12'],
  2023: ['2023-10-30', '2023-10-31'],
  2024: ['2024-10-18', '2024-10-19'],
  2025: ['2025-10-22', '2025-10-23'],
  2026: ['2026-11-10', '2026-11-11'],
  2027: ['2027-10-30', '2027-10-31'],
  2028: ['2028-10-18', '2028-10-19'],
  2029: ['2029-11-06', '2029-11-07'],
  2030: ['2030-10-26', '2030-10-27'],
  2031: ['2031-10-15', '2031-10-16'],
  2032: ['2032-11-02', '2032-11-03'],
  2033: ['2033-10-22', '2033-10-23'],
  2034: ['2034-10-11', '2034-10-12'],
  2035: ['2035-10-30', '2035-10-31'],
  2036: ['2036-10-18', '2036-10-19'],
  2037: ['2037-11-06', '2037-11-07'],
  2038: ['2038-10-26', '2038-10-27'],
  2039: ['2039-10-15', '2039-10-16'],
  2040: ['2040-11-02', '2040-11-03'],
  2041: ['2041-10-22', '2041-10-23'],
  2042: ['2042-10-11', '2042-10-12'],
  2043: ['2043-10-30', '2043-10-31'],
  2044: ['2044-10-18', '2044-10-19'],
  2045: ['2045-11-06', '2045-11-07'],
  2046: ['2046-10-26', '2046-10-27'],
  2047: ['2047-10-15', '2047-10-16'],
  2048: ['2048-11-02', '2048-11-03'],
  2049: ['2049-10-22', '2049-10-23'],
  2050: ['2050-10-11', '2050-10-12'],
  2051: ['2051-10-30', '2051-10-31'],
  2052: ['2052-10-18', '2052-10-19'],
  2053: ['2053-11-06', '2053-11-07'],
  2054: ['2054-10-26', '2054-10-27'],
  2055: ['2055-10-15', '2055-10-16'],
  2056: ['2056-11-02', '2056-11-03'],
  2057: ['2057-10-22', '2057-10-23'],
  2058: ['2058-10-11', '2058-10-12'],
  2059: ['2059-10-30', '2059-10-31'],
  2060: ['2060-10-18', '2060-10-19'],
  2061: ['2061-11-06', '2061-11-07'],
  2062: ['2062-10-26', '2062-10-27'],
  2063: ['2063-10-15', '2063-10-16'],
  2064: ['2064-11-02', '2064-11-03'],
};

// ---------------------------------------------------------------------------
//  Date helpers — everything is a UTC-midnight Date so day arithmetic is exact
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86400000;

function utcDate(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function diffDays(a, b) {
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}

/** UTC date → 'YYYY-MM-DD'. */
export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

/** 'YYYY-MM-DD' → UTC-midnight Date. */
function fromISODate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return utcDate(y, m, d);
}

const radians = (deg) => (deg * Math.PI) / 180;
const degrees = (rad) => (rad * 180) / Math.PI;

// ---------------------------------------------------------------------------
//  Astronomical helpers  (Meeus, "Astronomical Algorithms")
// ---------------------------------------------------------------------------

/** JDE of the March equinox (Meeus Ch. 27, years ≥ 2000). */
function marchEquinoxJde(year) {
  const y = (year - 2000) / 1000.0;
  const jde0 =
    2451623.80984 +
    365242.37404 * y +
    0.05169 * y ** 2 -
    0.00411 * y ** 3 -
    0.00057 * y ** 4;
  const T = (jde0 - 2451545.0) / 36525.0;
  const W = radians(35999.373 * T - 2.47);
  const dl = 1 + 0.0334 * Math.cos(W) + 0.0007 * Math.cos(2 * W);
  const S = EQUINOX_TERMS.reduce(
    (acc, [A, B, C]) => acc + A * Math.cos(radians(B + C * T)),
    0,
  );
  return jde0 + (0.00001 * S) / dl;
}

/**
 * Convert JDE → { date: UTC-midnight Date, hour: UTC hour-of-day 0..24 }.
 * Ignores ΔT (≈ 69 s in 2025) — error < 2 min, negligible here.
 */
function jdeToUtc(jde) {
  const z = Math.trunc(jde + 0.5);
  const f = jde + 0.5 - z;
  let a;
  if (z < 2299161) {
    a = z;
  } else {
    const alpha = Math.trunc((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.trunc((b - 122.1) / 365.25);
  const d = Math.trunc(365.25 * c);
  const e = Math.trunc((b - d) / 30.6001);
  const day = b - d - Math.trunc(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  return { date: utcDate(year, month, day), hour: f * 24.0 };
}

/**
 * Approximate sunset time (UTC decimal hours) for `date` at `lat`/`lon`.
 * Uses NOAA solar equations with standard refraction correction (−0.8333°).
 */
function sunsetUtcHour(date, lat = TEHRAN_LAT, lon = TEHRAN_LON) {
  const n = diffDays(date, utcDate(date.getUTCFullYear(), 1, 1)) + 1;
  const gamma = (2 * Math.PI * (n - 1)) / 365.0;

  // Solar declination (radians)
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  // Equation of time (minutes)
  const eqtime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  const latRad = radians(lat);
  const zenith = radians(90.8333);
  let cosHa =
    (Math.cos(zenith) - Math.sin(latRad) * Math.sin(decl)) /
    (Math.cos(latRad) * Math.cos(decl));
  cosHa = Math.max(-1.0, Math.min(1.0, cosHa)); // clamp for safety
  const ha = degrees(Math.acos(cosHa));

  const sunsetMin = 720.0 + ha * 4 - eqtime - lon * 4;
  return sunsetMin / 60.0;
}

/**
 * Calculate Naw-Rúz from the vernal equinox for `gregYear`.
 * Rule: if the equinox occurs before sunset in Tehran, Naw-Rúz is that day;
 * otherwise it is the following day.
 */
function computeNawRuz(gregYear) {
  const jde = marchEquinoxJde(gregYear);
  const { date: eqDate, hour: eqUtcH } = jdeToUtc(jde);
  const sunsetUtcH = sunsetUtcHour(eqDate);
  return eqUtcH < sunsetUtcH ? eqDate : addDays(eqDate, 1);
}

// ---------------------------------------------------------------------------
//  Public calendar API
// ---------------------------------------------------------------------------

/** Western calendar date (UTC-midnight) of Naw-Rúz for the given Badí year. */
export function nawRuzDate(badiYear) {
  const entry = NAW_RUZ_TABLE[badiYear];
  if (entry) return utcDate(entry[0], entry[1], entry[2]);
  return computeNawRuz(badiYear + BADI_EPOCH_OFFSET);
}

/** Return the Badí year whose Naw-Rúz falls in `gregYear`. */
export function badiYearFromGregorian(gregYear) {
  return gregYear - BADI_EPOCH_OFFSET;
}

/** Number of Ayyám-i-Há (intercalary) days in the given Badí year. */
export function ayyamIHaDays(badiYear) {
  const nr = nawRuzDate(badiYear);
  const nextNr = nawRuzDate(badiYear + 1);
  return diffDays(nextNr, nr) - 361; // total days minus 19×19
}

/**
 * Convert a Badí date to a UTC-midnight Western calendar Date.
 * month 1–18 = regular months, month 0 = Ayyám-i-Há, month 19 = 'Alá' (fast).
 */
export function badiToGregorian(badiYear, month, day) {
  const nr = nawRuzDate(badiYear);
  if (month >= 1 && month <= 18) {
    return addDays(nr, (month - 1) * 19 + (day - 1));
  }
  if (month === 0) {
    return addDays(nr, 342 + (day - 1));
  }
  if (month === 19) {
    const nextNr = nawRuzDate(badiYear + 1);
    return addDays(nextNr, -19 + (day - 1));
  }
  throw new Error(`Invalid Badí month: ${month}`);
}

/**
 * Convert a Western calendar Date to { year, month, day } (month=0 = Ayyám-i-Há).
 * Accepts any Date; only its UTC calendar day is used.
 */
export function gregorianToBadi(date) {
  const d = utcDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
  let badiYear = d.getUTCFullYear() - BADI_EPOCH_OFFSET;
  let nr = nawRuzDate(badiYear);
  if (d.getTime() < nr.getTime()) {
    badiYear -= 1;
    nr = nawRuzDate(badiYear);
  }
  const offset = diffDays(d, nr);

  if (offset < 342) {
    return {
      year: badiYear,
      month: Math.floor(offset / 19) + 1,
      day: (offset % 19) + 1,
    };
  }
  const ayyam = ayyamIHaDays(badiYear);
  if (offset < 342 + ayyam) {
    return { year: badiYear, month: 0, day: offset - 342 + 1 };
  }
  return { year: badiYear, month: 19, day: offset - 342 - ayyam + 1 };
}

// Python-style modulo (differs from JS for negative operands).
const pyMod = (a, b) => ((a % b) + b) % b;

/**
 * Twin Holy Days (Birth of the Báb, Birth of Bahá'u'lláh) for a Gregorian year.
 * Uses official UHJ dates when available, else a Metonic-cycle estimation.
 * Returns [babISO, bahaullahISO].
 */
export function calculateTwinHolyDays(year) {
  if (TWIN_HOLY_DAYS[year]) return TWIN_HOLY_DAYS[year];

  const years = Object.keys(TWIN_HOLY_DAYS).map(Number);
  const closestYear = years.reduce(
    (best, y) => (Math.abs(y - year) < Math.abs(best - year) ? y : best),
    years[0],
  );
  const yearDiff = year - closestYear;
  const [babBase, bahaullahBase] = TWIN_HOLY_DAYS[closestYear];

  const remainder = pyMod(yearDiff, 19);
  const estimatedShift = pyMod(remainder * -11, 365);

  const shift = (iso) => {
    const base = fromISODate(iso);
    const withYear = utcDate(year, base.getUTCMonth() + 1, base.getUTCDate());
    return toISODate(addDays(withYear, estimatedShift));
  };
  return [shift(babBase), shift(bahaullahBase)];
}

// ---------------------------------------------------------------------------
//  Event / month builders (mirrors main.py)
// ---------------------------------------------------------------------------

function translateEvent(bundle, eventName, { isFirstFast, isLastFast } = {}) {
  let key;
  if (isFirstFast) key = '1fast';
  else if (isLastFast) key = '19fast';
  else key = EVENT_KEYS[eventName] ?? eventName;

  return {
    name: bundle.events.names[key] ?? eventName,
    desc: bundle.events.descriptions[key] ?? '',
    url: bundle.events.urls?.[key] ?? '',
    time_note: bundle.events.time_notes?.[key] ?? '',
  };
}

function createEventDict(name, desc, badiMonth, badiDay, date, url, timeNote) {
  return {
    event: name,
    desc,
    time_note: timeNote,
    badi_month: badiMonth,
    badi_month_name: MONTHNAMES[badiMonth] ?? String(badiMonth),
    badi_day: badiDay,
    gregorian_date: toISODate(date),
    url,
  };
}

/** Build the ordered list of Bahá'í events for a Gregorian year. */
export function getBahaiEventsForGregorianYear(year, lang = 'es') {
  const bundle = resolveTranslations(lang);
  const badiYear = badiYearFromGregorian(year);
  const start = nawRuzDate(badiYear).getTime();
  const end = nawRuzDate(badiYear + 1).getTime();
  const inRange = (date) => start <= date.getTime() && date.getTime() < end;

  const events = [];

  // 1. Regular events (Twin Holy Days handled separately below).
  for (const event of BAHAI_EVENTS) {
    if (
      event.name === 'Birth of the Báb' ||
      event.name === "Birth of Bahá'u'lláh"
    ) {
      continue;
    }
    const eventDate = badiToGregorian(badiYear, event.month, event.day);
    if (inRange(eventDate)) {
      const t = translateEvent(bundle, event.name);
      events.push(
        createEventDict(
          t.name,
          t.desc,
          event.month,
          event.day,
          eventDate,
          t.url,
          t.time_note,
        ),
      );
    }
  }

  // 1b. Twin Holy Days (lunar-based, consecutive days).
  const [babISO, bahaullahISO] = calculateTwinHolyDays(year);
  const babDate = fromISODate(babISO);
  const bahaullahDate = fromISODate(bahaullahISO);
  if (inRange(babDate)) {
    const t = translateEvent(bundle, 'Birth of the Báb');
    events.push(
      createEventDict(t.name, t.desc, 12, 5, babDate, t.url, t.time_note),
    );
  }
  if (inRange(bahaullahDate)) {
    const t = translateEvent(bundle, "Birth of Bahá'u'lláh");
    events.push(
      createEventDict(t.name, t.desc, 12, 6, bahaullahDate, t.url, t.time_note),
    );
  }

  // 2. Ayyám-i-Há (intercalary days).
  const ayyamStart = badiToGregorian(badiYear, 0, 1);
  const ayyamDays = ayyamIHaDays(badiYear);
  for (let day = 1; day <= ayyamDays; day++) {
    const ayyamDate = addDays(ayyamStart, day - 1);
    if (inRange(ayyamDate)) {
      const t = translateEvent(bundle, 'Ayyám-i-Há');
      events.push(
        createEventDict(
          t.name || 'Ayyám-i-Há',
          t.desc || 'Días Intercalares',
          0,
          day,
          ayyamDate,
          t.url,
          t.time_note,
        ),
      );
    }
  }

  // 3. Fasting (month 19, first and last day).
  const fastStart = badiToGregorian(badiYear, 19, 1);
  if (inRange(fastStart)) {
    const t = translateEvent(bundle, 'Fast', { isFirstFast: true });
    events.push(
      createEventDict(t.name, t.desc, 19, 1, fastStart, t.url, t.time_note),
    );
  }
  const fastEnd = badiToGregorian(badiYear, 19, 19);
  if (inRange(fastEnd)) {
    const t = translateEvent(bundle, 'Fast', { isLastFast: true });
    events.push(
      createEventDict(t.name, t.desc, 19, 19, fastEnd, t.url, t.time_note),
    );
  }

  // 4. Order: Naw-Rúz first, last day of Fast last, rest chronological.
  const nawruzName = translateEvent(bundle, 'Naw-Rúz').name;
  const rank = (ev) => {
    if (ev.event === nawruzName) return 0;
    if (ev.badi_month === 19 && ev.badi_day === 19) return 2;
    return 1;
  };
  events.sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return a.gregorian_date.localeCompare(b.gregorian_date);
  });

  return events;
}

/** Build the first-day-of-each-month list for a Gregorian year. */
export function getBahaiMonths(year, lang = 'es') {
  const bundle = resolveTranslations(lang);
  const monthNames = bundle.month.names;
  const monthDescriptions = bundle.month.descriptions;
  const badiYear = badiYearFromGregorian(year);

  const createMonthEntry = (monthNum) => ({
    badi_month: monthNum,
    badi_month_name: `${MONTHNAMES[monthNum]} (${monthNames[monthNum]})`,
    gregorian_date: toISODate(badiToGregorian(badiYear, monthNum, 1)),
    desc: monthDescriptions[monthNum],
    info: 'Comienza en el atardecer del día anterior',
  });

  const months = [];
  for (let month = 1; month <= 19; month++)
    months.push(createMonthEntry(month));
  months.push(createMonthEntry(0)); // Ayyám-i-Há

  return { year, months };
}

/**
 * Full year payload for a Gregorian year (events + month starts).
 * @param {number} year Gregorian year
 * @param {string} lang 'en' or 'es' (any other value falls back to 'es')
 */
export function getCompleteData(year, lang = 'es') {
  return {
    year,
    language: lang,
    events: getBahaiEventsForGregorianYear(year, lang),
    months: getBahaiMonths(year, lang).months,
  };
}
