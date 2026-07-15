import { describe, it, expect } from 'vitest';

import {
  ayyamIHaDays,
  badiToGregorian,
  badiYearFromGregorian,
  getBahaiMonths,
  getCompleteData,
  gregorianToBadi,
  isWorkSuspendedHolyDay,
  nawRuzDate,
  toISODate,
} from './badiCalendar';
import { resolveTranslations } from './badiCalendarData';

const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));

// ── badiYearFromGregorian ──────────────────────────────────────────────────
describe('badiYearFromGregorian', () => {
  it('2025 → 182', () => expect(badiYearFromGregorian(2025)).toBe(182));
  it('2026 → 183', () => expect(badiYearFromGregorian(2026)).toBe(183));
  it('epoch: 1844 → 1', () => expect(badiYearFromGregorian(1844)).toBe(1));
});

// ── nawRuzDate ─────────────────────────────────────────────────────────────
describe('nawRuzDate', () => {
  it('182 BE → 2025-03-20', () =>
    expect(toISODate(nawRuzDate(182))).toBe('2025-03-20'));
  it('183 BE → 2026-03-21', () =>
    expect(toISODate(nawRuzDate(183))).toBe('2026-03-21'));
  it('181 BE → 2024-03-20', () =>
    expect(toISODate(nawRuzDate(181))).toBe('2024-03-20'));

  // Years outside the pre-computed table exercise the astronomical fallback
  // (Meeus equinox + NOAA sunset). Naw-Rúz must land on the equinox window.
  it('falls back to astronomy outside the table (BE 223)', () => {
    const iso = toISODate(nawRuzDate(223)); // 2066, not tabulated
    expect(['2066-03-19', '2066-03-20', '2066-03-21']).toContain(iso);
  });
  it('falls back to astronomy before the table (BE 170)', () => {
    const iso = toISODate(nawRuzDate(170)); // 2013, not tabulated
    expect(['2013-03-20', '2013-03-21']).toContain(iso);
  });
});

// ── ayyamIHaDays ───────────────────────────────────────────────────────────
describe('ayyamIHaDays', () => {
  it('182 (leap) → 5', () => expect(ayyamIHaDays(182)).toBe(5));
  it('183 (regular) → 4', () => expect(ayyamIHaDays(183)).toBe(4));
  it('always 4 or 5 for BE 172–199', () => {
    for (let by = 172; by < 200; by++) {
      expect([4, 5]).toContain(ayyamIHaDays(by));
    }
  });
});

// ── badiToGregorian ────────────────────────────────────────────────────────
describe('badiToGregorian', () => {
  it('Naw-Rúz is month 1 day 1', () =>
    expect(toISODate(badiToGregorian(182, 1, 1))).toBe('2025-03-20'));
  it('month 2 day 1 = Naw-Rúz + 19 days', () =>
    expect(toISODate(badiToGregorian(182, 2, 1))).toBe('2025-04-08'));
  it('Ayyám-i-Há day 1', () =>
    expect(toISODate(badiToGregorian(182, 0, 1))).toBe('2026-02-25'));
  it('fasting month day 1', () =>
    expect(toISODate(badiToGregorian(182, 19, 1))).toBe('2026-03-02'));
  it('fasting month day 19 is the day before next Naw-Rúz', () => {
    const expected = toISODate(new Date(nawRuzDate(183).getTime() - 86400000));
    expect(toISODate(badiToGregorian(182, 19, 19))).toBe(expected);
  });
  it('invalid month throws', () =>
    expect(() => badiToGregorian(182, 20, 1)).toThrow());
});

// ── gregorianToBadi ────────────────────────────────────────────────────────
describe('gregorianToBadi', () => {
  it('Naw-Rúz 2025 → (182, 1, 1)', () =>
    expect(gregorianToBadi(utc(2025, 3, 20))).toEqual({
      year: 182,
      month: 1,
      day: 1,
    }));
  it('before Naw-Rúz falls in previous year', () =>
    expect(gregorianToBadi(utc(2025, 3, 19)).year).toBe(181));
  it('roundtrips Badí → Gregorian → Badí', () => {
    const greg = badiToGregorian(182, 7, 10);
    expect(gregorianToBadi(greg)).toEqual({ year: 182, month: 7, day: 10 });
  });
});

// ── getCompleteData (full year payload) ──────────────────────────────────────
describe('getCompleteData', () => {
  it('returns the requested year and language', () => {
    const data = getCompleteData(2025, 'en');
    expect(data.year).toBe(2025);
    expect(data.language).toBe('en');
  });
  it('events list is not empty', () =>
    expect(getCompleteData(2025).events.length).toBeGreaterThan(0));
  it('every event has the required fields', () => {
    for (const ev of getCompleteData(2025).events) {
      expect(ev).toHaveProperty('event');
      expect(ev).toHaveProperty('event_type');
      expect(ev).toHaveProperty('gregorian_date');
      expect(ev).toHaveProperty('badi_month');
      expect(ev).toHaveProperty('badi_day');
    }
  });
  it('Naw-Rúz 2025 is present', () => {
    const dates = getCompleteData(2025, 'en').events.map(
      (e) => e.gregorian_date,
    );
    expect(dates).toContain('2025-03-20');
  });
  it('event dates are chronologically ordered', () => {
    const dates = getCompleteData(2025).events.map((e) => e.gregorian_date);
    expect(dates).toEqual([...dates].sort());
  });
  it('derives Twin Holy Day Badí dates and work suspension from event type', () => {
    const events = getCompleteData(2026, 'es').events;
    const twinHolyDays = events.filter((event) =>
      ['Birth of the Báb', "Birth of Bahá'u'lláh"].includes(event.event_type),
    );

    for (const event of twinHolyDays) {
      const badiDate = gregorianToBadi(
        utc(...event.gregorian_date.split('-').map(Number)),
      );
      expect([event.badi_month, event.badi_day]).toEqual([
        badiDate.month,
        badiDate.day,
      ]);
      expect(isWorkSuspendedHolyDay(event)).toBe(true);
    }
  });
  it('preserves configured Spanish holy-day time notes', () => {
    const events = getCompleteData(2026, 'es').events;
    const timedEventTypes = [
      'First Day of Riḍván',
      "Ascension of Bahá'u'lláh",
      'Declaration of the Báb',
      'Martyrdom of the Báb',
      "Ascension of 'Abdu'l-Bahá",
    ];

    for (const event_type of timedEventTypes) {
      const event = events.find((item) => item.event_type === event_type);
      expect(event.time_note).toBeTruthy();
    }
  });
});

describe('isWorkSuspendedHolyDay', () => {
  it('includes exactly the nine holy days with work suspension', () => {
    const suspendedEventTypes = [
      'Naw-Rúz',
      'First Day of Riḍván',
      'Ninth Day of Riḍván',
      'Twelfth Day of Riḍván',
      'Declaration of the Báb',
      "Ascension of Bahá'u'lláh",
      'Martyrdom of the Báb',
      'Birth of the Báb',
      "Birth of Bahá'u'lláh",
    ];

    for (const event_type of suspendedEventTypes) {
      expect(isWorkSuspendedHolyDay({ event_type })).toBe(true);
    }
    expect(
      isWorkSuspendedHolyDay({ event_type: "Ascension of 'Abdu'l-Bahá" }),
    ).toBe(false);
  });
});

// ── getBahaiMonths (former /bahai-months/{year}) ───────────────────────────
describe('getBahaiMonths', () => {
  it('returns 20 months (19 + Ayyám-i-Há)', () =>
    expect(getBahaiMonths(2025).months).toHaveLength(20));
  it('every month has the required fields', () => {
    for (const m of getBahaiMonths(2025).months) {
      expect(m).toHaveProperty('badi_month');
      expect(m).toHaveProperty('badi_month_name');
      expect(m).toHaveProperty('gregorian_date');
    }
  });
  it('first month starts on Naw-Rúz', () => {
    const first = getBahaiMonths(2025).months.find((m) => m.badi_month === 1);
    expect(first.gregorian_date).toBe('2025-03-20');
  });
});

// ── translations — all project languages ───────────────────────────────────
describe('translations', () => {
  const LANGS = ['en', 'es', 'ar', 'de', 'fa', 'fr'];

  it('every shipped language has complete event + month data', () => {
    for (const lang of LANGS) {
      const b = resolveTranslations(lang);
      expect(Object.keys(b.events.names)).toHaveLength(13);
      expect(Object.keys(b.events.descriptions)).toHaveLength(14);
      expect(Object.keys(b.month.names)).toHaveLength(20);
      expect(Object.keys(b.month.descriptions)).toHaveLength(20);
      expect(b.events.names.nawruz).toBeTruthy();
      expect(b.title).toBeTruthy();
    }
  });

  it('event names are distinct per language (no silent fallback)', () => {
    const names = ['en', 'es', 'de', 'fr'].map(
      (l) => resolveTranslations(l).events.names['1Ridvan'],
    );
    expect(new Set(names).size).toBe(4);
  });

  it('unknown language falls back to English', () => {
    expect(resolveTranslations('zz')).toBe(resolveTranslations('en'));
  });

  it('builds localised events end-to-end (fr)', () => {
    const nawruz = getCompleteData(2025, 'fr').events.find(
      (e) => e.badi_month === 1 && e.badi_day === 1,
    );
    expect(nawruz.event).toBe('Naw-Rúz');
    expect(nawruz.desc).toContain('Nouvel An');
  });
});
