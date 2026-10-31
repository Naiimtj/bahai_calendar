import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSettings } from '../context/SettingsContext';
import { useBadiYear } from '../context/BadiYearContext';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import {
  cancelEventNotifications,
  scheduleEventNotifications,
} from '../services/eventNotifications';
import { useEventNotifications } from './useEventNotifications';

vi.mock('react', () => ({
  useEffect: (effect) => effect(),
  useRef: () => ({ current: false }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) =>
      ({
        'notifications.feast': 'Fiesta de 19 Días',
        'notifications.holyDay': 'Día Sagrado',
      })[key] ?? key,
  }),
}));
vi.mock('../context/SettingsContext', () => ({ useSettings: vi.fn() }));
vi.mock('../context/BadiYearContext', () => ({ useBadiYear: vi.fn() }));
vi.mock('../context/PersonalEventsContext', () => ({
  usePersonalEvents: vi.fn(),
}));
vi.mock('../services/eventNotifications', () => ({
  isEventNotificationsSupported: () => true,
  checkEventNotificationPermission: () => Promise.resolve('granted'),
  requestEventNotificationPermission: vi.fn(),
  scheduleEventNotifications: vi.fn(),
  cancelEventNotifications: vi.fn(),
  personalEventNotificationId: () => 1,
  bahaiEventNotificationId: () => 2,
}));

describe('useEventNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30));
    const entries = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key) => entries.get(key) ?? null,
      setItem: (key, value) => entries.set(key, value),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('keeps personal titles and schedules feasts and holy-day time notes', async () => {
    useSettings.mockReturnValue({
      lang: 'es',
      settings: { notificationsEvents: true, notificationsBahaiEvents: true },
    });
    usePersonalEvents.mockReturnValue({
      upcomingEvents: [
        {
          id: 'event',
          title: 'Reunión',
          location: 'Sala 1',
          start: new Date(2026, 9, 1, 12),
        },
      ],
    });
    useBadiYear.mockReturnValue({
      allEvents: [
        {
          event: 'Nacimiento del Báb',
          event_type: 'Birth of the Báb',
          desc: 'Descripción',
          gregDate: new Date(2026, 9, 3),
        },
        {
          event: 'Ascensión de ‘Abdu’l-Bahá',
          event_type: "Ascension of 'Abdu'l-Bahá",
          time_note: 'A la una de la madrugada',
          desc: 'Descripción',
          gregDate: new Date(2026, 9, 5),
        },
      ],
      allMonthStarts: [
        { badiMonth: 11, start: new Date(2026, 9, 2) },
        { badiMonth: 0, start: new Date(2026, 9, 4) },
      ],
    });

    useEventNotifications();
    await vi.waitFor(() =>
      expect(scheduleEventNotifications).toHaveBeenCalledTimes(2),
    );

    const notifications = scheduleEventNotifications.mock.calls.flatMap(
      ([entries]) => entries,
    );
    expect(notifications.map(({ title, body }) => ({ title, body }))).toEqual(
      expect.arrayContaining([
        { title: 'Reunión', body: 'Sala 1' },
        { title: 'Día Sagrado', body: 'Nacimiento del Báb' },
        {
          title: 'Día Sagrado',
          body: 'Ascensión de ‘Abdu’l-Bahá\nA la una de la madrugada',
        },
        {
          title: 'Fiesta de 19 Días',
          body: 'Mashíyyat (Voluntad)',
        },
      ]),
    );
    expect(notifications).toHaveLength(4);
    expect(
      notifications.find(({ title }) => title === 'Reunión').schedule.at,
    ).toEqual(new Date(2026, 9, 1, 12));
  });

  it('leaves Apple Reminders to the Reminders app and cancels notifications scheduled before', async () => {
    useSettings.mockReturnValue({
      lang: 'es',
      settings: { notificationsEvents: true, notificationsBahaiEvents: false },
    });
    const due = new Date(2026, 9, 1, 17);
    usePersonalEvents.mockReturnValue({
      upcomingEvents: [
        {
          id: 'reminder',
          title: 'Poner la lavadora',
          start: due,
          sourceType: 'reminder',
          isReminder: true,
          isCompleted: false,
        },
      ],
    });
    useBadiYear.mockReturnValue({ allEvents: [], allMonthStarts: [] });
    localStorage.setItem(
      'bahai-personal-event-notifications',
      JSON.stringify({
        reminder: {
          notifId: 1,
          signature: `Recordatorios|Poner la lavadora|${due.getTime()}`,
        },
      }),
    );

    useEventNotifications();

    await vi.waitFor(() => {
      expect(cancelEventNotifications).toHaveBeenCalledWith([1]);
      expect(
        JSON.parse(localStorage.getItem('bahai-personal-event-notifications')),
      ).toEqual({});
    });
    expect(scheduleEventNotifications).not.toHaveBeenCalled();
  });

  it('cancels pending notifications for completed local reminders', async () => {
    useSettings.mockReturnValue({
      lang: 'es',
      settings: { notificationsEvents: true, notificationsBahaiEvents: false },
    });
    const due = new Date(2026, 9, 1, 17);
    usePersonalEvents.mockReturnValue({
      upcomingEvents: [
        {
          id: 'local-reminder',
          title: 'Poner la lavadora',
          start: due,
          sourceType: 'local',
          isReminder: true,
          isCompleted: true,
        },
      ],
    });
    useBadiYear.mockReturnValue({ allEvents: [], allMonthStarts: [] });
    localStorage.setItem(
      'bahai-personal-event-notifications',
      JSON.stringify({
        'local-reminder': {
          notifId: 1,
          signature: `Poner la lavadora||${due.getTime()}`,
        },
      }),
    );

    useEventNotifications();

    await vi.waitFor(() => {
      expect(cancelEventNotifications).toHaveBeenCalledWith([1]);
      expect(
        JSON.parse(localStorage.getItem('bahai-personal-event-notifications')),
      ).toEqual({});
    });
    expect(scheduleEventNotifications).not.toHaveBeenCalled();
  });
});
