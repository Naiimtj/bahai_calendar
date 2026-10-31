import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const platformState = vi.hoisted(() => ({
  platform: 'ios',
}));

const timelineState = vi.hoisted(() => ({
  dayEvents: [],
}));

const contextMocks = vi.hoisted(() => ({
  useSettings: vi.fn(),
  usePersonalEvents: vi.fn(),
}));

const mapPreviewMock = vi.hoisted(() => ({
  getLocationMapPreview: vi.fn(() => Promise.resolve(null)),
}));

function makeBaseStubs() {
  function BaseModal({ visible = true, children }) {
    if (!visible) return null;
    return createElement('div', null, children);
  }

  function BaseIcon(props) {
    return createElement('span', {
      'data-icon': props.icon,
      'aria-label': props['aria-label'],
    });
  }

  function BaseButton({ children, label }) {
    return createElement('button', null, children || label || 'button');
  }

  function BaseAnchor({ href, label, children, ...props }) {
    return createElement(
      'a',
      { href, 'aria-label': props['aria-label'] },
      label || children,
    );
  }

  function BaseCalendarPicker() {
    return createElement('div', null, 'calendarPicker');
  }

  function BaseMenu() {
    return createElement('div', null, 'menu');
  }

  function BaseSegmentedControl() {
    return createElement('div', null, 'segmented');
  }

  function BaseToggleSwitch() {
    return createElement('div', null, 'toggle');
  }

  function BaseWheelPicker() {
    return createElement('div', null, 'wheel');
  }

  return {
    BaseModal,
    BaseIcon,
    BaseButton,
    BaseAnchor,
    BaseCalendarPicker,
    BaseMenu,
    BaseSegmentedControl,
    BaseToggleSwitch,
    BaseWheelPicker,
  };
}

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => platformState.platform,
    isNativePlatform: () =>
      platformState.platform === 'ios' || platformState.platform === 'android',
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { resolvedLanguage: 'es', language: 'es' },
  }),
}));

vi.mock('../context/SettingsContext', () => ({
  useSettings: contextMocks.useSettings,
}));

vi.mock('../context/PersonalEventsContext', () => ({
  usePersonalEvents: contextMocks.usePersonalEvents,
}));

vi.mock('../services/mapPreview', () => ({
  getLocationMapPreview: mapPreviewMock.getLocationMapPreview,
}));

vi.mock('../native/bahaiCalendarNative', () => ({
  CapacitorCalendar: {},
}));

vi.mock('../services/calendarSync', () => ({
  getAvailableCalendars: vi.fn(async () => []),
  createEvent: vi.fn(async () => ({})),
  createNativeReminder: vi.fn(async () => ({})),
  requestRemindersAccess: vi.fn(async () => true),
  isNativePlatform: vi.fn(() => false),
  supportsNativeReminders: vi.fn(() => false),
}));

vi.mock('../services/personalCalendar', () => ({
  colorForIndex: () => '#3b82f6',
  getReminderLists: vi.fn(async () => []),
  stableColorIndex: () => 0,
}));

vi.mock('../services/geocodingApi', () => ({
  searchEventLocations: vi.fn(async () => []),
}));

vi.mock('./base', () => makeBaseStubs());

vi.mock('./AddEventModal', async (importOriginal) => ({
  ...(await importOriginal()),
  default: () => null,
}));

import EventDetailModal from './EventDetailModal';

function setPlatform(platform) {
  platformState.platform = platform;
}

function setDayEvents(events) {
  timelineState.dayEvents = events;
}

function makeRaw(overrides = {}) {
  return {
    id: 'local-main',
    sourceType: 'device',
    start: new Date(2026, 9, 26, 9, 40),
    end: new Date(2026, 9, 26, 10, 40),
    allDay: false,
    location: '',
    notes: '',
    alert: 'none',
    alert2: 'none',
    alerts: [],
    availability: 'busy',
    repeat: 'none',
    isReminder: false,
    sourceName: 'Calendario',
    locationCoords: null,
    ...overrides,
  };
}

function makeEvent(overrides = {}, rawOverrides = {}) {
  const raw = makeRaw(rawOverrides);
  return {
    name: 'Consulta',
    color: '#3b82f6',
    location: raw.location,
    ...overrides,
    _raw: {
      ...raw,
      ...(overrides._raw || {}),
    },
  };
}

function renderModal({ visible = true, event, onClose = vi.fn() } = {}) {
  return renderToStaticMarkup(
    createElement(EventDetailModal, {
      visible,
      event,
      onClose,
    }),
  );
}

function occurrenceCount(text, needle) {
  return text.split(needle).length - 1;
}

describe('EventDetailModal', () => {
  beforeEach(() => {
    vi.stubGlobal('React', React);
    setPlatform('ios');
    setDayEvents([]);

    contextMocks.useSettings.mockReturnValue({
      settings: { timeFormat: '24' },
      lang: 'es',
      dark: false,
    });

    contextMocks.usePersonalEvents.mockReturnValue({
      eventsForDate: vi.fn(() => timelineState.dayEvents),
      removeLocalEventAndRefresh: vi.fn(),
      removeDeviceEventAndRefresh: vi.fn(),
      removeDeviceReminderAndRefresh: vi.fn(),
      config: {
        deviceCalendarEnabled: false,
        deviceCalendars: {},
        icsSources: [],
        localCalendarName: 'Local',
        localCalendarColor: '#3b82f6',
      },
      addLocalEventAndRefresh: vi.fn(),
      updateLocalEventAndRefresh: vi.fn(),
      addOptimisticEvent: vi.fn(),
      updateDeviceEventAndRefresh: vi.fn(async () => {}),
      updateDeviceReminderAndRefresh: vi.fn(async () => {}),
      refresh: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders empty markup when closed and event is null', () => {
    const html = renderModal({ visible: false, event: null });
    expect(html).toBe('');
  });

  it('splits iOS multiline location into name and address nodes', () => {
    const location =
      'Centro de Salud la Princesa\nCalle de Severo Ochoa, 4, 28932 Móstoles, Madrid, España';
    const event = makeEvent({ location }, { location });

    const html = renderModal({ event });

    expect(html).toContain('>calendar.location<');
    expect(html).toContain('>Centro de Salud la Princesa<');
    expect(html).toContain(
      '>Calle de Severo Ochoa, 4, 28932 Móstoles, Madrid, España<',
    );
  });

  it('splits single-line comma location into name and address', () => {
    const location = 'Hospital Rey Juan Carlos, Calle Gladiolo, s/n, Móstoles';
    const event = makeEvent({ location }, { location });

    const html = renderModal({ event });

    expect(html).toContain('>Hospital Rey Juan Carlos<');
    expect(html).toContain('>Calle Gladiolo, s/n, Móstoles<');
  });

  it('renders platform-aware maps links and skips link for URL locations', () => {
    const textLocation =
      'Centro de Salud la Princesa\nCalle de Severo Ochoa, 4';

    setPlatform('android');
    const androidHtml = renderModal({
      event: makeEvent({ location: textLocation }, { location: textLocation }),
    });
    expect(androidHtml).toContain('aria-label="calendar.openInGoogleMaps"');
    expect(androidHtml).toContain(
      'href="https://www.google.com/maps/search/?api=1&amp;query=',
    );

    setPlatform('ios');
    const iosHtml = renderModal({
      event: makeEvent({ location: textLocation }, { location: textLocation }),
    });
    expect(iosHtml).toContain('aria-label="calendar.openInAppleMaps"');
    expect(iosHtml).toContain('href="https://maps.apple.com/?q=');

    const urlLocation = 'https://meet.example.com/abc';
    const urlHtml = renderModal({
      event: makeEvent({ location: urlLocation }, { location: urlLocation }),
    });
    expect(urlHtml).not.toContain('calendar.openInGoogleMaps');
    expect(urlHtml).not.toContain('calendar.openInAppleMaps');
  });

  it('renders details section with normalized https href for bare host urls', () => {
    const html = renderModal({
      event: makeEvent({}, { notes: '', url: 'example.com/agenda' }),
    });

    expect(html).toContain('>calendar.details<');
    expect(html).toContain('href="https://example.com/agenda"');
  });

  it('keeps https urls unchanged in details link', () => {
    const html = renderModal({
      event: makeEvent({}, { notes: '', url: 'https://zoom.us/j/1' }),
    });

    expect(html).toContain('>calendar.details<');
    expect(html).toContain('href="https://zoom.us/j/1"');
  });

  it('renders non-http schemes as plain text without link href', () => {
    const html = renderModal({
      event: makeEvent({}, { notes: '', url: 'javascript:alert(1)' }),
    });

    expect(html).toContain('>calendar.details<');
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('>javascript:alert(1)<');
  });

  it('shows only neighbours in the visible timeline window and expected hour labels', () => {
    const currentRaw = makeRaw({
      id: 'local-current',
      sourceType: 'device',
      start: new Date(2026, 9, 26, 9, 40),
      end: new Date(2026, 9, 26, 10, 40),
    });
    const currentEvent = makeEvent(
      { name: 'Consulta principal', color: '#2563eb' },
      currentRaw,
    );

    setDayEvents([
      {
        name: 'Consulta principal',
        color: '#2563eb',
        _raw: currentRaw,
      },
      {
        name: 'Tirar basura pañales',
        color: '#ef4444',
        _raw: {
          id: 'rem-1',
          sourceType: 'reminder',
          start: new Date(2026, 9, 26, 9, 0),
          end: new Date(2026, 9, 26, 9, 0),
          allDay: false,
          isReminder: true,
        },
      },
      {
        name: 'Cena',
        color: '#22c55e',
        _raw: {
          id: 'dev-2',
          sourceType: 'device',
          start: new Date(2026, 9, 26, 20, 0),
          end: new Date(2026, 9, 26, 21, 0),
          allDay: false,
          isReminder: false,
        },
      },
    ]);

    const html = renderModal({ event: currentEvent });

    expect(occurrenceCount(html, 'Tirar basura pañales')).toBe(1);
    expect(html).not.toContain('Cena');

    const hour9 = new Date(2026, 9, 26, 9).toLocaleTimeString('es', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
    const hour10 = new Date(2026, 9, 26, 10).toLocaleTimeString('es', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
    const hour11 = new Date(2026, 9, 26, 11).toLocaleTimeString('es', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });

    expect(html).toContain(`>${hour9}<`);
    expect(html).toContain(`>${hour10}<`);
    expect(html).toContain(`>${hour11}<`);
  });

  it('renders half-width lanes only when there is an overlap', () => {
    const currentEvent = makeEvent(
      { name: 'Consulta principal', color: '#2563eb' },
      {
        id: 'local-current',
        sourceType: 'device',
        start: new Date(2026, 9, 26, 9, 40),
        end: new Date(2026, 9, 26, 10, 40),
      },
    );

    setDayEvents([
      {
        name: 'Solapa',
        color: '#ef4444',
        _raw: {
          id: 'dev-overlap',
          sourceType: 'device',
          start: new Date(2026, 9, 26, 10, 0),
          end: new Date(2026, 9, 26, 11, 0),
          allDay: false,
        },
      },
    ]);
    const overlapHtml = renderModal({ event: currentEvent });
    expect(occurrenceCount(overlapHtml, 'width:50%')).toBeGreaterThanOrEqual(2);

    setDayEvents([]);
    const noOverlapHtml = renderModal({ event: currentEvent });
    expect(noOverlapHtml).not.toContain('width:50%');
  });

  it('shows options rows conditionally for repeat, alerts and show-as', () => {
    const repeatNoneHtml = renderModal({
      event: makeEvent({}, { repeat: 'none', alert: 'none', alerts: [] }),
    });
    expect(repeatNoneHtml).not.toContain('>addEvent.repeat<');
    expect(repeatNoneHtml).not.toContain('>addEvent.secondAlert<');

    const weeklyHtml = renderModal({
      event: makeEvent(
        {},
        {
          repeat: 'weekly',
          alert: '15m',
          alert2: 'none',
          availability: 'busy',
          isReminder: false,
        },
      ),
    });
    expect(weeklyHtml).toContain('>addEvent.repeat<');
    expect(weeklyHtml).toContain('>addEvent.repeatWeekly<');
    expect(weeklyHtml).toContain('>addEvent.secondAlert<');
    expect(weeklyHtml).toContain('>addEvent.showAs<');
    expect(weeklyHtml).toContain('>addEvent.showAsBusy<');

    const reminderHtml = renderModal({
      event: makeEvent(
        {},
        {
          id: 'reminder-1',
          sourceType: 'reminder',
          isReminder: true,
          availability: 'busy',
          alert: '15m',
        },
      ),
    });
    expect(reminderHtml).not.toContain('>addEvent.showAs<');
    expect(reminderHtml).not.toContain('>addEvent.showAsBusy<');
  });

  it('shows edit/delete only for editable events and always exposes close aria-label', () => {
    const icsHtml = renderModal({
      event: makeEvent(
        { name: 'Evento ICS' },
        {
          id: 'ics-1',
          sourceType: 'ics',
        },
      ),
    });

    expect(icsHtml).not.toContain('>calendar.edit<');
    expect(icsHtml).not.toContain('>calendar.deleteEvent<');
    expect(icsHtml).toContain('aria-label="calendar.close"');

    const localHtml = renderModal({
      event: makeEvent(
        { name: 'Evento local' },
        {
          id: 'local-1',
          sourceType: 'local',
        },
      ),
    });

    expect(localHtml).toContain('>calendar.edit<');
    expect(localHtml).toContain('>calendar.deleteEvent<');
    expect(localHtml).toContain('aria-label="calendar.close"');
  });
});
