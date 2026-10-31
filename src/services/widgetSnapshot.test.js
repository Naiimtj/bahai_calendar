import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MONTHNAMES } from '../lib/badiCalendarData';
import { sunsetTimestamp } from '../lib/badiCalendar';
import {
  WIDGET_DAYS_AFTER,
  WIDGET_DAYS_BEFORE,
  WIDGET_MAX_EVENTS_PER_DAY,
  WIDGET_SNAPSHOT_VERSION,
  buildWidgetSnapshot,
  isWidgetSyncSupported,
  loadSavedLocation,
} from './widgetSnapshot';

const mocks = vi.hoisted(() => ({
  getPlatform: vi.fn(),
  updateWidgetSnapshot: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: mocks.getPlatform },
}));

vi.mock('../native/bahaiCalendarNative', () => ({
  CapacitorCalendar: {
    updateWidgetSnapshot: mocks.updateWidgetSnapshot,
  },
}));

const t = (key, opts) => (opts?.name ? `${key}:${opts.name}` : key);

function toLocalISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildSnapshot(overrides = {}) {
  return buildWidgetSnapshot({
    now: new Date(2026, 8, 29, 15, 30),
    lang: 'es',
    weekStart: 'monday',
    weekdayInitials: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    t,
    gregorianToBadi: (date) => ({
      year: 183,
      month: 5,
      day: date.getDate(),
    }),
    getHolyDayForDate: () => null,
    isRidvanPeriod: () => false,
    eventsForDate: () => [],
    sunsetLocation: null,
    ...overrides,
  });
}

async function loadWidgetSnapshotModule() {
  vi.resetModules();
  return import('./widgetSnapshot');
}

beforeEach(() => {
  mocks.getPlatform.mockReset();
  mocks.updateWidgetSnapshot.mockReset();
});

describe('buildWidgetSnapshot', () => {
  it('builds the full day window from local date components with badi fields and more=0', () => {
    const snapshot = buildSnapshot();

    expect(WIDGET_DAYS_BEFORE).toBeGreaterThanOrEqual(30);
    expect(snapshot.days).toHaveLength(
      WIDGET_DAYS_BEFORE + WIDGET_DAYS_AFTER + 1,
    );
    expect(snapshot.days[0].date).toBe('2026-08-29');
    expect(snapshot.days[snapshot.days.length - 1].date).toBe('2027-01-27');

    for (const day of snapshot.days) {
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(day.year).toBe(183);
      expect(day.month).toBe(5);
      expect(typeof day.day).toBe('number');
      expect(day.more).toBe(0);
    }
  });

  it('skips days where gregorianToBadi returns null', () => {
    const skipped = '2026-09-11';
    const snapshot = buildSnapshot({
      gregorianToBadi: (date) => {
        if (toLocalISO(date) === skipped) return null;
        return { year: 183, month: 5, day: date.getDate() };
      },
    });

    expect(snapshot.days).toHaveLength(WIDGET_DAYS_BEFORE + WIDGET_DAYS_AFTER);
    expect(snapshot.days.some((day) => day.date === skipped)).toBe(false);
  });

  it('orders events holy day -> feast -> personal, caps to max, and keeps ridvan out when holy day exists', () => {
    const targetDate = '2026-09-29';
    const snapshot = buildSnapshot({
      gregorianToBadi: () => ({ year: 183, month: 1, day: 1 }),
      getHolyDayForDate: (date) =>
        toLocalISO(date) === targetDate
          ? { en: 'Naw-Rúz', es: 'Naw-Rúz' }
          : null,
      isRidvanPeriod: () => true,
      eventsForDate: (date) =>
        toLocalISO(date) === targetDate
          ? [
              { name: 'A', color: '#ff0000' },
              { name: 'B', color: '#00ff00' },
            ]
          : [],
    });

    const day = snapshot.days.find((entry) => entry.date === targetDate);
    expect(day.events).toEqual([
      { title: 'Naw-Rúz', kind: 'holyDay' },
      { title: `calendar.feastShort:${MONTHNAMES[1]}`, kind: 'feast' },
      { title: 'A', kind: 'personal', color: '#ff0000' },
    ]);
    expect(day.events).toHaveLength(WIDGET_MAX_EVENTS_PER_DAY);
    expect(day.more).toBe(1);
    expect(day.events.some((event) => event.kind === 'ridvan')).toBe(false);
  });

  it('adds ridvan when in ridvan period and no holy day', () => {
    const targetDate = '2026-09-30';
    const snapshot = buildSnapshot({
      gregorianToBadi: () => ({ year: 183, month: 2, day: 2 }),
      getHolyDayForDate: () => null,
      isRidvanPeriod: (date) => toLocalISO(date) === targetDate,
    });

    const day = snapshot.days.find((entry) => entry.date === targetDate);
    expect(day.events).toEqual([{ title: 'Riḍván', kind: 'ridvan' }]);
  });

  it('includes completion only for reminders in widget events', () => {
    const snapshot = buildSnapshot({
      eventsForDate: () => [
        { name: 'Pending', _raw: { isReminder: true, isCompleted: false } },
        { name: 'Done', _raw: { isReminder: true, isCompleted: true } },
        { name: 'Meeting', _raw: { isReminder: false, isCompleted: true } },
      ],
    });

    expect(snapshot.days[0].events).toEqual([
      {
        title: 'Pending',
        kind: 'personal',
        isReminder: true,
        isCompleted: false,
      },
      { title: 'Done', kind: 'personal', isReminder: true, isCompleted: true },
      { title: 'Meeting', kind: 'personal' },
    ]);
  });

  it('does not add feast for Ayyam-i-Ha and uses translated month name for regular feast', () => {
    const targetAyyam = '2026-09-29';
    const targetFeast = '2026-09-30';

    const snapshot = buildSnapshot({
      gregorianToBadi: (date) => {
        const key = toLocalISO(date);
        if (key === targetAyyam) return { year: 183, month: 0, day: 1 };
        if (key === targetFeast) return { year: 183, month: 11, day: 1 };
        return { year: 183, month: 11, day: 2 };
      },
    });

    const ayyamDay = snapshot.days.find((entry) => entry.date === targetAyyam);
    const feastDay = snapshot.days.find((entry) => entry.date === targetFeast);

    expect(ayyamDay.events.some((event) => event.kind === 'feast')).toBe(false);
    expect(feastDay.events).toContainEqual({
      title: `calendar.feastShort:${MONTHNAMES[11]}`,
      kind: 'feast',
    });
  });

  it('truncates titles to 60 chars and only keeps color for personal events with string color', () => {
    const longHoly = `H${'x'.repeat(80)}`;
    const longPersonal = `P${'y'.repeat(80)}`;

    const snapshot = buildSnapshot({
      getHolyDayForDate: () => ({ en: longHoly, es: longHoly }),
      eventsForDate: () => [{ name: longPersonal, color: 42 }],
    });

    const day = snapshot.days[0];
    expect(day.events[0].title).toHaveLength(60);
    expect(day.events[0].kind).toBe('holyDay');
    expect('color' in day.events[0]).toBe(false);

    const personal = day.events.find((event) => event.kind === 'personal');
    expect(personal.title).toHaveLength(60);
    expect('color' in personal).toBe(false);

    const feast = day.events.find((event) => event.kind === 'feast');
    if (feast) expect('color' in feast).toBe(false);
  });

  it('maps firstWeekday for jalal/sunday/monday and defaults unknown to monday', () => {
    expect(buildSnapshot({ weekStart: 'jalal' }).firstWeekday).toBe(6);
    expect(buildSnapshot({ weekStart: 'sunday' }).firstWeekday).toBe(0);
    expect(buildSnapshot({ weekStart: 'monday' }).firstWeekday).toBe(1);
    expect(buildSnapshot({ weekStart: 'unknown' }).firstWeekday).toBe(1);
  });

  it('builds badiWeekdays in Sunday-first order with seven entries', () => {
    const snapshot = buildSnapshot();
    expect(snapshot.badiWeekdays).toHaveLength(7);
    expect(snapshot.badiWeekdays[0]).toBe(t('badiWeekdays.2'));
    expect(snapshot.badiWeekdays[6]).toBe(t('badiWeekdays.1'));
  });

  it('builds months metadata with expected transliterations and translated meanings', () => {
    const snapshot = buildSnapshot();
    expect(snapshot.months).toHaveLength(20);
    expect(snapshot.months[0].name).toBe('Ayyám-i-Há');
    expect(snapshot.months[11].name).toBe('Mashíyyat');
    expect(snapshot.months[11].meaning).toBe('badiMonths.11');
  });

  it('passes through weekdayInitials as seven strings and returns empty list when invalid', () => {
    const valid = buildSnapshot({
      weekdayInitials: ['1', 2, true, null, undefined, 'S', 'D'],
    });
    expect(valid.weekdayInitials).toEqual([
      '1',
      '2',
      'true',
      'null',
      'undefined',
      'S',
      'D',
    ]);

    const invalidType = buildSnapshot({ weekdayInitials: 'MTWTFSS' });
    const invalidLength = buildSnapshot({
      weekdayInitials: ['M', 'T', 'W', 'T', 'F', 'S'],
    });

    expect(invalidType.weekdayInitials).toEqual([]);
    expect(invalidLength.weekdayInitials).toEqual([]);
  });

  it('sets rtl by language and always includes version and lang', () => {
    expect(buildSnapshot({ lang: 'ar' })).toMatchObject({
      rtl: true,
      lang: 'ar',
      version: WIDGET_SNAPSHOT_VERSION,
    });
    expect(buildSnapshot({ lang: 'fa' })).toMatchObject({
      rtl: true,
      lang: 'fa',
      version: WIDGET_SNAPSHOT_VERSION,
    });
    expect(buildSnapshot({ lang: 'es' })).toMatchObject({
      rtl: false,
      lang: 'es',
      version: WIDGET_SNAPSHOT_VERSION,
    });
  });

  it('omits sunset without location and computes it for each day when location is provided', () => {
    const withoutLocation = buildSnapshot({ sunsetLocation: null });
    expect(withoutLocation.days.every((day) => !('sunset' in day))).toBe(true);

    const lat = 40.4168;
    const lon = -3.7038;
    const withLocation = buildSnapshot({ sunsetLocation: { lat, lon } });

    for (const day of withLocation.days) {
      const [year, month, date] = day.date.split('-').map(Number);
      expect(day.sunset).toBe(sunsetTimestamp(year, month, date, lat, lon));
    }
  });
});

describe('pushWidgetSnapshot', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false and does not call plugin on web', async () => {
    mocks.getPlatform.mockReturnValue('web');
    const { pushWidgetSnapshot } = await loadWidgetSnapshotModule();

    await expect(pushWidgetSnapshot({ id: 'web' })).resolves.toBe(false);
    expect(mocks.updateWidgetSnapshot).not.toHaveBeenCalled();
  });

  it.each(['ios', 'android'])(
    'pushes once on %s, dedupes identical payload, and pushes changed snapshot',
    async (platform) => {
      mocks.getPlatform.mockReturnValue(platform);
      mocks.updateWidgetSnapshot.mockResolvedValue(undefined);

      const { pushWidgetSnapshot } = await loadWidgetSnapshotModule();
      const snapshot = { a: 1 };

      await expect(pushWidgetSnapshot(snapshot)).resolves.toBe(true);
      expect(mocks.updateWidgetSnapshot).toHaveBeenCalledTimes(1);
      expect(mocks.updateWidgetSnapshot).toHaveBeenCalledWith({
        snapshot: JSON.stringify(snapshot),
      });

      await expect(pushWidgetSnapshot({ a: 1 })).resolves.toBe(false);
      expect(mocks.updateWidgetSnapshot).toHaveBeenCalledTimes(1);

      await expect(pushWidgetSnapshot({ a: 2 })).resolves.toBe(true);
      expect(mocks.updateWidgetSnapshot).toHaveBeenCalledTimes(2);
    },
  );

  it('does not dedupe failed push attempts and retries the same payload', async () => {
    mocks.getPlatform.mockReturnValue('ios');
    const err = new Error('native failure');
    mocks.updateWidgetSnapshot.mockRejectedValueOnce(err);
    mocks.updateWidgetSnapshot.mockResolvedValueOnce(undefined);

    const { pushWidgetSnapshot } = await loadWidgetSnapshotModule();
    const snapshot = { same: true };

    await expect(pushWidgetSnapshot(snapshot)).rejects.toThrow(
      'native failure',
    );
    await expect(pushWidgetSnapshot(snapshot)).resolves.toBe(true);
    expect(mocks.updateWidgetSnapshot).toHaveBeenCalledTimes(2);
  });
});

describe('location and support helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('loads saved location only when lat/lon are finite numbers', () => {
    const getItem = vi.fn().mockReturnValue('{"lat":40.4,"lon":-3.7}');
    vi.stubGlobal('localStorage', { getItem });
    expect(loadSavedLocation()).toEqual({ lat: 40.4, lon: -3.7 });

    getItem.mockReturnValue(null);
    expect(loadSavedLocation()).toBeNull();

    getItem.mockReturnValue('{"lat":"40.4","lon":"-3.7"}');
    expect(loadSavedLocation()).toBeNull();

    getItem.mockReturnValue('{bad json');
    expect(loadSavedLocation()).toBeNull();
  });

  it('reports widget sync support on ios and android', () => {
    mocks.getPlatform.mockReturnValue('ios');
    expect(isWidgetSyncSupported()).toBe(true);

    mocks.getPlatform.mockReturnValue('android');
    expect(isWidgetSyncSupported()).toBe(true);

    mocks.getPlatform.mockReturnValue('web');
    expect(isWidgetSyncSupported()).toBe(false);
  });
});
