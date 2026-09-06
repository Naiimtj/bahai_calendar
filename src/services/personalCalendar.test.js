import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const native = vi.hoisted(() => ({
  isNativePlatform: vi.fn(),
  calendar: {
    checkAllPermissions: vi.fn(),
    listCalendars: vi.fn(),
    listEventsInRange: vi.fn(),
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: native.isNativePlatform },
  CapacitorHttp: { get: vi.fn() },
}));

vi.mock('../native/bahaiCalendarNative', () => ({
  CapacitorCalendar: native.calendar,
  EventAvailability: { BUSY: 'busy', FREE: 'free', TENTATIVE: 'tentative' },
  EventSpan: { THIS_AND_FUTURE_EVENTS: 'thisAndFutureEvents' },
}));

import {
  aggregateEvents,
  clearCachedDeviceCalendar,
  clearCachedIcsSource,
  loadCachedSyncedCalendars,
  loadCachedSyncedEvents,
} from './personalCalendar';

const ICS_TEXT = [
  'BEGIN:VCALENDAR',
  'BEGIN:VEVENT',
  'UID:planning-1',
  'SUMMARY:Planning',
  'DTSTART:20260722T090000Z',
  'DTEND:20260722T100000Z',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

const source = {
  id: 'work',
  name: 'Work',
  url: 'https://example.com/work.ics',
  enabled: true,
};

const config = {
  deviceCalendarEnabled: false,
  deviceCalendars: {},
  icsSources: [source],
};

const windowStart = new Date('2026-07-01T00:00:00Z');
const windowEnd = new Date('2026-07-31T23:59:59Z');

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

describe('synced event cache', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorage(),
    });
    globalThis.fetch = vi.fn();
    native.isNativePlatform.mockReset();
    native.isNativePlatform.mockReturnValue(false);
    native.calendar.checkAllPermissions.mockReset();
    native.calendar.listCalendars.mockReset();
    native.calendar.listEventsInRange.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the latest ICS events during a failed refresh and removes a deleted source', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(ICS_TEXT),
    });

    await aggregateEvents(windowStart, windowEnd, config);

    const cached = loadCachedSyncedEvents(windowStart, windowEnd, config);
    expect(cached).toHaveLength(1);
    expect(cached[0]).toMatchObject({
      id: 'work-planning-1-0',
      sourceId: 'work',
      title: 'Planning',
    });
    expect(cached[0].start).toBeInstanceOf(Date);

    globalThis.fetch.mockRejectedValueOnce(new Error('offline'));
    await expect(
      aggregateEvents(windowStart, windowEnd, config),
    ).resolves.toEqual(cached);

    clearCachedIcsSource(source.id);
    expect(loadCachedSyncedEvents(windowStart, windowEnd, config)).toEqual([]);
  });

  it('persists device events and removes the selected calendar cache', async () => {
    native.isNativePlatform.mockReturnValue(true);
    native.calendar.checkAllPermissions.mockResolvedValue({
      result: { readCalendar: 'granted' },
    });
    native.calendar.listCalendars.mockResolvedValue({
      result: [
        {
          id: 'work-calendar',
          title: 'Work calendar',
          color: '#0055aa',
          source: { title: 'iCloud' },
        },
      ],
    });
    native.calendar.listEventsInRange.mockResolvedValue({
      result: [
        {
          id: 'device-event-1',
          calendarId: 'work-calendar',
          title: 'Review',
          startDate: new Date('2026-07-22T09:00:00Z').getTime(),
          endDate: new Date('2026-07-22T10:00:00Z').getTime(),
          isAllDay: false,
        },
      ],
    });

    const deviceConfig = {
      deviceCalendarEnabled: true,
      deviceCalendars: {},
      icsSources: [],
    };
    await aggregateEvents(windowStart, windowEnd, deviceConfig);

    expect(
      loadCachedSyncedEvents(windowStart, windowEnd, deviceConfig),
    ).toMatchObject([
      {
        id: 'device-event-1',
        calendarId: 'work-calendar',
        sourceType: 'device',
      },
    ]);
    expect(loadCachedSyncedCalendars()).toMatchObject([
      {
        id: 'work-calendar',
        sourceType: 'device',
        title: 'Work calendar',
      },
    ]);

    clearCachedDeviceCalendar('work-calendar');
    expect(
      loadCachedSyncedEvents(windowStart, windowEnd, deviceConfig),
    ).toEqual([]);
    expect(loadCachedSyncedCalendars()).toEqual([]);
  });
});
