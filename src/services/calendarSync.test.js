import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  isNativePlatform: vi.fn(),
  getPlatform: vi.fn(),
  createEvent: vi.fn(),
  createEventWithPrompt: undefined,
  createEventInteractively: undefined,
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: mockState.isNativePlatform,
    getPlatform: mockState.getPlatform,
  },
  CapacitorHttp: {
    get: vi.fn(),
  },
}));

vi.mock('../native/bahaiCalendarNative', () => ({
  CapacitorCalendar: {
    createEvent: mockState.createEvent,
    createEventWithPrompt: mockState.createEventWithPrompt,
    createEventInteractively: mockState.createEventInteractively,
  },
  EventAvailability: { BUSY: 'busy', FREE: 'free', TENTATIVE: 'tentative' },
  EventSpan: { THIS_AND_FUTURE_EVENTS: 'thisAndFutureEvents' },
}));

import { createEvent } from './calendarSync';

describe('createEvent native payload', () => {
  beforeEach(() => {
    mockState.isNativePlatform.mockReset();
    mockState.getPlatform.mockReset();
    mockState.createEvent.mockReset();
    mockState.isNativePlatform.mockReturnValue(true);
    mockState.getPlatform.mockReturnValue('ios');
    mockState.createEvent.mockResolvedValue({ result: 'evt-1' });
  });

  it('includes latitude and longitude when locationCoords are provided', async () => {
    const event = {
      title: 'Test',
      location: 'Name\nAddress',
      locationCoords: { latitude: 40.3227, longitude: -3.8649 },
      allDay: false,
      start: new Date('2026-07-22T09:00:00.000Z'),
      end: new Date('2026-07-22T10:00:00.000Z'),
    };

    await createEvent(event, { id: 'cal-1', provider: 'native' });

    expect(mockState.createEvent).toHaveBeenCalledTimes(1);
    expect(mockState.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test',
        calendarId: 'cal-1',
        location: 'Name\nAddress',
        latitude: 40.3227,
        longitude: -3.8649,
      }),
    );
  });

  it('omits latitude and longitude when locationCoords are missing', async () => {
    const event = {
      title: 'Test',
      location: 'Name\nAddress',
      allDay: false,
      start: new Date('2026-07-22T09:00:00.000Z'),
      end: new Date('2026-07-22T10:00:00.000Z'),
    };

    await createEvent(event, { id: 'cal-1', provider: 'native' });

    expect(mockState.createEvent).toHaveBeenCalledTimes(1);
    const payload = mockState.createEvent.mock.calls[0][0];
    expect(payload.calendarId).toBe('cal-1');
    expect(payload.location).toBe('Name\nAddress');
    expect(payload).not.toHaveProperty('latitude');
    expect(payload).not.toHaveProperty('longitude');
  });

  it('forwards url when present', async () => {
    const event = {
      title: 'Test',
      location: 'Name\nAddress',
      url: 'https://example.com/meet',
      allDay: false,
      start: new Date('2026-07-22T09:00:00.000Z'),
      end: new Date('2026-07-22T10:00:00.000Z'),
    };

    await createEvent(event, { id: 'cal-1', provider: 'native' });

    expect(mockState.createEvent).toHaveBeenCalledTimes(1);
    expect(mockState.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarId: 'cal-1',
        url: 'https://example.com/meet',
      }),
    );
  });

  it('omits url when empty', async () => {
    const event = {
      title: 'Test',
      location: 'Name\nAddress',
      url: '',
      allDay: false,
      start: new Date('2026-07-22T09:00:00.000Z'),
      end: new Date('2026-07-22T10:00:00.000Z'),
    };

    await createEvent(event, { id: 'cal-1', provider: 'native' });

    expect(mockState.createEvent).toHaveBeenCalledTimes(1);
    const payload = mockState.createEvent.mock.calls[0][0];
    expect(payload.url).toBeUndefined();
    expect(JSON.parse(JSON.stringify(payload))).not.toHaveProperty('url');
  });
});
