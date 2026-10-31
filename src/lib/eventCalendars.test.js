import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/personalCalendar', () => ({
  colorForIndex: (i) => `color-${i}`,
  stableColorIndex: () => 3,
}));

import {
  buildEventCalendars,
  resolveDefaultCalendarId,
  toCalendarMenuOptions,
} from './eventCalendars';

describe('resolveDefaultCalendarId', () => {
  const calendars = [{ id: 'local' }, { id: 'dev-1' }, { id: 'dev-2' }];

  it('returns the preferred device calendar when deviceCalendarEnabled is true, listed, and not disabled', () => {
    const result = resolveDefaultCalendarId(calendars, 'dev-1', {
      deviceCalendarEnabled: true,
      deviceCalendars: { 'dev-1': { enabled: true } },
    });

    expect(result).toBe('dev-1');
  });

  it("falls back to 'local' when deviceCalendarEnabled is false", () => {
    const result = resolveDefaultCalendarId(calendars, 'dev-1', {
      deviceCalendarEnabled: false,
      deviceCalendars: { 'dev-1': { enabled: true } },
    });

    expect(result).toBe('local');
  });

  it("falls back to 'local' when config.deviceCalendars[id].enabled is false", () => {
    const result = resolveDefaultCalendarId(calendars, 'dev-1', {
      deviceCalendarEnabled: true,
      deviceCalendars: { 'dev-1': { enabled: false } },
    });

    expect(result).toBe('local');
  });

  it("falls back to 'local' when the preferred id is not in the list", () => {
    const result = resolveDefaultCalendarId(calendars, 'deleted-calendar', {
      deviceCalendarEnabled: true,
      deviceCalendars: { 'deleted-calendar': { enabled: true } },
    });

    expect(result).toBe('local');
  });

  it("falls back to 'local' when preferredId is undefined", () => {
    const result = resolveDefaultCalendarId(calendars, undefined, {
      deviceCalendarEnabled: true,
      deviceCalendars: {},
    });

    expect(result).toBe('local');
  });

  it("keeps 'local' when preferredId is 'local'", () => {
    const result = resolveDefaultCalendarId(calendars, 'local', {
      deviceCalendarEnabled: false,
      deviceCalendars: {},
    });

    expect(result).toBe('local');
  });
});

describe('resolveDefaultCalendarId with reminder lists', () => {
  const lists = [
    { id: 'list-a', title: 'A' },
    { id: 'list-b', title: 'B' },
    { id: 'list-c', title: 'C' },
  ];

  it('returns the preferred list when device calendars are enabled and the list is not disabled', () => {
    const result = resolveDefaultCalendarId(lists, 'list-c', {
      deviceCalendarEnabled: true,
      deviceCalendars: {
        'list-a': { enabled: true },
        'list-b': { enabled: true },
        'list-c': { enabled: true },
      },
    });

    expect(result).toBe('list-c');
  });

  it('falls back to the first shown list when preferred list is disabled', () => {
    const result = resolveDefaultCalendarId(lists, 'list-c', {
      deviceCalendarEnabled: true,
      deviceCalendars: {
        'list-a': { enabled: false },
        'list-b': { enabled: true },
        'list-c': { enabled: false },
      },
    });

    expect(result).toBe('list-b');
  });

  it('falls back to the first shown list when preferred id is missing', () => {
    const result = resolveDefaultCalendarId(lists, 'missing-list', {
      deviceCalendarEnabled: true,
      deviceCalendars: {
        'list-a': { enabled: false },
        'list-b': { enabled: true },
        'list-c': { enabled: true },
      },
    });

    expect(result).toBe('list-b');
  });

  it('falls back to the first shown list when preferredId is null', () => {
    const result = resolveDefaultCalendarId(lists, null, {
      deviceCalendarEnabled: true,
      deviceCalendars: {
        'list-a': { enabled: true },
        'list-b': { enabled: true },
        'list-c': { enabled: true },
      },
    });

    expect(result).toBe('list-a');
  });

  it('falls back to the first list when deviceCalendarEnabled is false', () => {
    const result = resolveDefaultCalendarId(lists, 'list-c', {
      deviceCalendarEnabled: false,
      deviceCalendars: {
        'list-a': { enabled: true },
        'list-b': { enabled: true },
        'list-c': { enabled: true },
      },
    });

    expect(result).toBe('list-a');
  });

  it("returns '' for an empty list", () => {
    const result = resolveDefaultCalendarId([], 'list-c', {
      deviceCalendarEnabled: true,
      deviceCalendars: {
        'list-c': { enabled: true },
      },
    });

    expect(result).toBe('');
  });
});

describe('buildEventCalendars', () => {
  it("puts local first using config values, and falls back to localName/'color-0' when missing", () => {
    const withConfig = buildEventCalendars(
      [],
      {
        localCalendarName: 'My Local',
        localCalendarColor: 'my-local-color',
        deviceCalendars: {},
      },
      'Fallback Local',
    );

    expect(withConfig[0]).toEqual({
      id: 'local',
      name: 'My Local',
      sourceType: 'local',
      color: 'my-local-color',
    });

    const withoutConfig = buildEventCalendars(
      [],
      { deviceCalendars: {} },
      'Fallback Local',
    );

    expect(withoutConfig[0]).toEqual({
      id: 'local',
      name: 'Fallback Local',
      sourceType: 'local',
      color: 'color-0',
    });
  });

  it('applies customName and color precedence: pref.color, pref.colorIndex, native color, then stable fallback', () => {
    const deviceCalendars = [
      { id: 'pref-color', name: 'Original A', color: 'native-A' },
      { id: 'pref-index', name: 'Original B', color: 'native-B' },
      { id: 'native-color', name: 'Original C', color: 'native-C' },
      { id: 'stable-fallback', name: 'Original D' },
    ];

    const result = buildEventCalendars(
      deviceCalendars,
      {
        deviceCalendars: {
          'pref-color': { customName: 'Custom A', color: 'pref-A' },
          'pref-index': { colorIndex: 9 },
        },
      },
      'Local',
    );

    expect(result.slice(1)).toEqual([
      { id: 'pref-color', name: 'Custom A', color: 'pref-A' },
      { id: 'pref-index', name: 'Original B', color: 'color-9' },
      { id: 'native-color', name: 'Original C', color: 'native-C' },
      { id: 'stable-fallback', name: 'Original D', color: 'color-3' },
    ]);
  });
});

describe('toCalendarMenuOptions', () => {
  it('lists calendars without an account first, then groups by account in first-appearance order', () => {
    const calendars = [
      { id: 'icloud-a', name: 'A', account: 'iCloud', color: 'blue' },
      { id: 'gmail-b', name: 'B', account: 'Gmail', color: 'red' },
      { id: 'local', name: 'Local Calendar', color: '' },
      { id: 'icloud-c', name: 'C', account: 'iCloud', color: 'green' },
    ];

    const result = toCalendarMenuOptions(calendars);

    expect(result).toEqual([
      {
        value: 'local',
        label: 'Local Calendar',
        color: undefined,
        group: undefined,
      },
      { value: 'icloud-a', label: 'A', color: 'blue', group: 'iCloud' },
      { value: 'icloud-c', label: 'C', color: 'green', group: 'iCloud' },
      { value: 'gmail-b', label: 'B', color: 'red', group: 'Gmail' },
    ]);
  });
});
