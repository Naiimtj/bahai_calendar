import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';

const native = vi.hoisted(() => ({
  isNativePlatform: vi.fn(),
  calendar: {
    checkAllPermissions: vi.fn(),
    listCalendars: vi.fn(),
    listEventsInRange: vi.fn(),
    modifyEvent: vi.fn(),
    modifyReminder: vi.fn(),
    addListener: vi.fn(),
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
  addLocalEvent,
  aggregateEvents,
  birthdayPersonInfo,
  birthdayPersonName,
  clearCachedDeviceCalendar,
  clearCachedIcsSource,
  loadCachedSyncedCalendars,
  loadCachedSyncedEvents,
  loadLocalEvents,
  onDeviceCalendarChange,
  updateDeviceEvent,
  updateDeviceReminder,
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

describe('Apple birthday titles', () => {
  it('recognizes only titles of events identified as birthdays', () => {
    expect(
      birthdayPersonName({ title: "Alex's Birthday", isBirthday: true }),
    ).toBe('Alex');
    expect(
      birthdayPersonName({ title: 'Sam’s Birthday', isBirthday: true }),
    ).toBe('Sam');
    expect(
      birthdayPersonName({ title: 'Birthday of Noor', isBirthday: true }),
    ).toBe('Noor');
    expect(
      birthdayPersonName({ title: "Alex's Birthday", isBirthday: false }),
    ).toBeNull();
    expect(
      birthdayPersonName({ title: 'Birthday party', isBirthday: true }),
    ).toBeNull();
    expect(
      birthdayPersonName({
        title: "Alicia Medina Ortega's 28th Birthday",
        isBirthday: true,
      }),
    ).toBe('Alicia Medina Ortega');

    expect(
      birthdayPersonInfo({
        title: "Alicia Medina Ortega's 28th Birthday",
        isBirthday: true,
      }),
    ).toEqual({ name: 'Alicia Medina Ortega', age: 28 });
  });

  it('uses the selected app language without changing the Apple title', () => {
    const event = { title: "Alex's Birthday", isBirthday: true };
    const name = birthdayPersonName(event);
    expect(i18n.t('personalEvents.birthday', { lng: 'es', name })).toBe(
      'Cumpleaños de Alex',
    );
    expect(i18n.t('personalEvents.birthday', { lng: 'fr', name })).toBe(
      'Anniversaire de Alex',
    );
    expect(event.title).toBe("Alex's Birthday");
  });

  it('supports age-aware birthday translation format', () => {
    expect(
      i18n.t('personalEvents.birthdayWithAge', {
        lng: 'es',
        name: 'Alicia Medina Ortega',
        age: 28,
      }),
    ).toBe('Alicia Medina Ortega (28) Cumpleaños');
  });
});

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
    native.calendar.modifyEvent.mockReset();
    native.calendar.modifyReminder.mockReset();
    native.calendar.addListener.mockReset();
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
          isBirthday: true,
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
        isBirthday: true,
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

  it('maps structured native coordinates into locationCoords only when finite', async () => {
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
          id: 'device-event-coords',
          calendarId: 'work-calendar',
          title: 'Mapped coords',
          startDate: new Date('2026-07-22T09:00:00Z').getTime(),
          endDate: new Date('2026-07-22T10:00:00Z').getTime(),
          isAllDay: false,
          structuredLocation: { latitude: 40.4168, longitude: -3.7038 },
        },
        {
          id: 'device-event-no-coords',
          calendarId: 'work-calendar',
          title: 'No coords',
          startDate: new Date('2026-07-23T09:00:00Z').getTime(),
          endDate: new Date('2026-07-23T10:00:00Z').getTime(),
          isAllDay: false,
          structuredLocation: { latitude: Number.NaN, longitude: -3.7038 },
        },
      ],
    });

    const deviceConfig = {
      deviceCalendarEnabled: true,
      deviceCalendars: {},
      icsSources: [],
    };

    const aggregated = await aggregateEvents(
      windowStart,
      windowEnd,
      deviceConfig,
    );
    const mapped = aggregated.find(
      (event) => event.id === 'device-event-coords',
    );
    const unmapped = aggregated.find(
      (event) => event.id === 'device-event-no-coords',
    );

    expect(mapped).toMatchObject({
      id: 'device-event-coords',
      locationCoords: { latitude: 40.4168, longitude: -3.7038 },
    });
    expect(unmapped).toMatchObject({
      id: 'device-event-no-coords',
      locationCoords: null,
    });
  });

  it('maps native url into device events and defaults to empty string', async () => {
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
          id: 'device-event-url',
          calendarId: 'work-calendar',
          title: 'With URL',
          startDate: new Date('2026-07-24T09:00:00Z').getTime(),
          endDate: new Date('2026-07-24T10:00:00Z').getTime(),
          isAllDay: false,
          url: 'https://example.com/meet',
        },
        {
          id: 'device-event-no-url',
          calendarId: 'work-calendar',
          title: 'Without URL',
          startDate: new Date('2026-07-25T09:00:00Z').getTime(),
          endDate: new Date('2026-07-25T10:00:00Z').getTime(),
          isAllDay: false,
        },
      ],
    });

    const deviceConfig = {
      deviceCalendarEnabled: true,
      deviceCalendars: {},
      icsSources: [],
    };

    const aggregated = await aggregateEvents(
      windowStart,
      windowEnd,
      deviceConfig,
    );
    const withUrl = aggregated.find((event) => event.id === 'device-event-url');
    const withoutUrl = aggregated.find(
      (event) => event.id === 'device-event-no-url',
    );

    expect(withUrl).toMatchObject({
      id: 'device-event-url',
      url: 'https://example.com/meet',
    });
    expect(withoutUrl).toMatchObject({
      id: 'device-event-no-url',
      url: '',
    });
  });

  it('sends the all-day flag with a reminder due date', async () => {
    native.isNativePlatform.mockReturnValue(true);
    native.calendar.modifyReminder.mockResolvedValue({ result: true });
    const due = new Date(2026, 6, 22);

    await updateDeviceReminder('rem-all-day', { start: due, allDay: true });
    await updateDeviceReminder('rem-timed', { start: due, allDay: false });

    expect(native.calendar.modifyReminder.mock.calls).toEqual([
      [{ id: 'rem-all-day', dueDate: due.getTime(), isAllDay: true }],
      [{ id: 'rem-timed', dueDate: due.getTime(), isAllDay: false }],
    ]);
  });

  it('subscribes to device calendar changes only on native', async () => {
    const callback = vi.fn();
    native.isNativePlatform.mockReturnValue(false);
    const unsubscribeWeb = onDeviceCalendarChange(callback);
    expect(native.calendar.addListener).not.toHaveBeenCalled();
    unsubscribeWeb();

    const remove = vi.fn();
    native.isNativePlatform.mockReturnValue(true);
    native.calendar.addListener.mockResolvedValue({ remove });
    const unsubscribeNative = onDeviceCalendarChange(callback);

    expect(native.calendar.addListener).toHaveBeenCalledWith(
      'eventStoreChanged',
      callback,
    );
    unsubscribeNative();
    await vi.waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
  });
});

describe('updateDeviceEvent', () => {
  beforeEach(() => {
    native.isNativePlatform.mockReset();
    native.isNativePlatform.mockReturnValue(true);
    native.calendar.modifyEvent.mockReset();
    native.calendar.modifyEvent.mockResolvedValue({ result: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forwards latitude and longitude when locationCoords are provided', async () => {
    const updates = {
      location:
        'Centro de Salud la Princesa\nCalle de Severo Ochoa, 4, 28932 Móstoles, Madrid, España',
      locationCoords: { latitude: 40.3227, longitude: -3.8649 },
    };

    const result = await updateDeviceEvent('evt-1', updates);

    expect(result).toBe(true);
    expect(native.calendar.modifyEvent).toHaveBeenCalledTimes(1);
    expect(native.calendar.modifyEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'evt-1',
        location:
          'Centro de Salud la Princesa\nCalle de Severo Ochoa, 4, 28932 Móstoles, Madrid, España',
        latitude: 40.3227,
        longitude: -3.8649,
      }),
    );
  });

  it('omits latitude and longitude when locationCoords is null', async () => {
    const updates = {
      location: 'Centro de Salud la Princesa\nCalle de Severo Ochoa, 4',
      locationCoords: null,
    };

    await updateDeviceEvent('evt-2', updates);

    expect(native.calendar.modifyEvent).toHaveBeenCalledTimes(1);
    const options = native.calendar.modifyEvent.mock.calls[0][0];
    expect(options.location).toBe(
      'Centro de Salud la Princesa\nCalle de Severo Ochoa, 4',
    );
    expect(options).not.toHaveProperty('latitude');
    expect(options).not.toHaveProperty('longitude');
  });

  it('forwards url updates including empty string clears and undefined omission', async () => {
    await updateDeviceEvent('evt-url', { url: 'https://example.com/meet' });

    const withUrl = native.calendar.modifyEvent.mock.calls[0][0];
    expect(withUrl.url).toBe('https://example.com/meet');

    await updateDeviceEvent('evt-url', { url: '' });

    const clearUrl = native.calendar.modifyEvent.mock.calls[1][0];
    expect(clearUrl.url).toBe('');

    await updateDeviceEvent('evt-url', { notes: 'unchanged url field' });

    const omitUrl = native.calendar.modifyEvent.mock.calls[2][0];
    expect(omitUrl).not.toHaveProperty('url');
  });
});

describe('addLocalEvent', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorage(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores and returns locationCoords when provided', () => {
    const event = {
      title: 'Consulta',
      location: 'Centro de Salud la Princesa',
      locationCoords: { latitude: 40.3227, longitude: -3.8649 },
      allDay: false,
      start: new Date('2026-07-22T09:00:00.000Z'),
      end: new Date('2026-07-22T10:00:00.000Z'),
    };

    const stored = addLocalEvent(event);
    const persisted = loadLocalEvents();

    expect(stored.locationCoords).toEqual({
      latitude: 40.3227,
      longitude: -3.8649,
    });
    expect(persisted).toHaveLength(1);
    expect(persisted[0].locationCoords).toEqual({
      latitude: 40.3227,
      longitude: -3.8649,
    });
  });

  it('stores null locationCoords when absent', () => {
    const event = {
      title: 'Consulta',
      location: 'Centro de Salud la Princesa',
      allDay: false,
      start: new Date('2026-07-22T09:00:00.000Z'),
      end: new Date('2026-07-22T10:00:00.000Z'),
    };

    const stored = addLocalEvent(event);
    const persisted = loadLocalEvents();

    expect(stored.locationCoords).toBeNull();
    expect(persisted).toHaveLength(1);
    expect(persisted[0].locationCoords).toBeNull();
  });
});
