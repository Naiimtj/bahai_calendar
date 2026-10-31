import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Settings from './Settings';
import AddEventModal from './AddEventModal';

const capabilityState = vi.hoisted(() => ({
  isNative: false,
  platform: 'web',
}));

const contextMocks = vi.hoisted(() => ({
  useSettings: vi.fn(),
  usePersonalEvents: vi.fn(),
}));

function makeTestBase() {
  function BaseButton({ children, label }) {
    return createElement('button', null, children || label || 'button');
  }

  function BaseIcon() {
    return createElement('span', null, 'icon');
  }

  function BaseSegmentedControl({ options = [] }) {
    return createElement(
      'div',
      null,
      options.map((option) =>
        createElement(
          'span',
          { key: option.value },
          `seg:${option.value}:${option.label}`,
        ),
      ),
    );
  }

  function BaseModal({ visible = true, children }) {
    if (!visible) return null;
    return createElement('div', null, children);
  }

  function BaseToggleSwitch() {
    return createElement('span', null, 'toggle');
  }

  function BaseSelect({ options = [] }) {
    return createElement(
      'div',
      null,
      options.map((option) =>
        createElement(
          'span',
          { key: option.value },
          `sel:${option.value}:${option.label}`,
        ),
      ),
    );
  }

  function BaseCalendarPicker() {
    return createElement('div', null, 'calendarPicker');
  }

  function BaseMenu({ label, options = [] }) {
    return createElement(
      'div',
      null,
      options.map((option) =>
        createElement(
          'span',
          { key: option.value },
          `menu:${label}:${option.value}:${option.label}`,
        ),
      ),
    );
  }

  function BaseWheelPicker() {
    return createElement('div', null, 'wheelPicker');
  }

  return {
    BaseButton,
    BaseIcon,
    BaseSegmentedControl,
    BaseModal,
    BaseToggleSwitch,
    BaseSelect,
    BaseCalendarPicker,
    BaseMenu,
    BaseWheelPicker,
  };
}

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => capabilityState.isNative,
    getPlatform: () => capabilityState.platform,
  },
}));

vi.mock('../native/bahaiCalendarNative', () => ({
  CapacitorCalendar: {},
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en', resolvedLanguage: 'en' },
  }),
}));

vi.mock('../context/SettingsContext', () => ({
  useSettings: contextMocks.useSettings,
}));

vi.mock('../context/PersonalEventsContext', () => ({
  usePersonalEvents: contextMocks.usePersonalEvents,
}));

vi.mock('../services/personalCalendar', () => ({
  isNativePlatform: () => capabilityState.isNative,
  requestDeviceCalendarAccess: vi.fn(async () => true),
  getDeviceCalendars: vi.fn(async () => []),
  getReminderLists: vi.fn(async () => []),
  SOURCE_COLORS: ['#3b82f6'],
  colorForIndex: () => '#3b82f6',
  stableColorIndex: () => 0,
}));

vi.mock('../services/geocodingApi', () => ({
  searchEventLocations: vi.fn(async () => []),
}));

vi.mock('../hooks/useFastingAlarms', () => ({
  useFastingAlarms: () => ({ supported: false }),
}));

vi.mock('../hooks/useFastingSunTimes', () => ({
  useFastingSunTimes: () => ({
    location: null,
    saveLocation: vi.fn(),
    clearLocation: vi.fn(),
    sunTimes: null,
  }),
}));

vi.mock('../utils/devPreview', () => ({
  shouldPreviewNativeSettings: () => true,
}));

vi.mock('./About', () => ({
  default: () => createElement('div', null, 'about'),
}));

vi.mock('./FastingAlarmsModal', () => ({
  default: () => createElement('div', null, 'fastingAlarmsModal'),
}));

vi.mock('./LocationPicker', () => ({
  default: () => createElement('div', null, 'locationPicker'),
}));

vi.mock('./base', () => makeTestBase());

vi.mock('./base/BaseButton', () => ({
  default: makeTestBase().BaseButton,
}));

vi.mock('./base/BaseModal', () => ({
  default: makeTestBase().BaseModal,
}));

vi.mock('./base/BaseSelectInput', () => ({
  default: () => createElement('div', null, 'selectInput'),
}));

vi.mock('./base/BaseSpinner', () => ({
  default: () => createElement('div', null, 'spinner'),
}));

vi.mock('./base/BaseTextInput', () => ({
  default: () => createElement('input'),
}));

vi.mock('./base/BaseToggleSwitch', () => ({
  default: () => createElement('span', null, 'toggle'),
}));

function setPlatform(isNative, platform) {
  capabilityState.isNative = isNative;
  capabilityState.platform = platform;
}

function buildSettingsState() {
  return {
    darkMode: 'system',
    language: 'en',
    dateShift: 'sunset',
    secondaryFormat: 'numbers',
    weekStart: 'sunday',
    showWeekNumbers: true,
    calendarView: 'mixed',
    timeFormat: '24',
    calendarDensity: 'compacta',
    hapticFeedback: false,
    notificationsEvents: true,
    notificationsBahaiEvents: true,
  };
}

function buildPersonalEventsState() {
  return {
    config: {
      deviceCalendarEnabled: false,
      deviceCalendars: {},
      icsSources: [],
      localCalendarName: 'Local',
      localCalendarColor: '#3b82f6',
    },
    setDeviceCalendarEnabled: vi.fn(),
    setLocalCalendarColor: vi.fn(),
    setLocalCalendarName: vi.fn(),
    addIcsSource: vi.fn(),
    updateIcsSource: vi.fn(),
    removeIcsSource: vi.fn(),
    setDeviceCalendarPref: vi.fn(),
    addLocalEventAndRefresh: vi.fn(),
    updateLocalEventAndRefresh: vi.fn(),
    addOptimisticEvent: vi.fn(),
    updateDeviceEventAndRefresh: vi.fn(async () => {}),
    updateDeviceReminderAndRefresh: vi.fn(async () => {}),
    refresh: vi.fn(),
  };
}

function renderSettings() {
  return renderToStaticMarkup(createElement(Settings));
}

function renderAddEventModal(props = {}) {
  return renderToStaticMarkup(
    createElement(AddEventModal, {
      visible: true,
      onClose: vi.fn(),
      initialDate: new Date('2026-10-02T12:00:00Z'),
      onSaved: vi.fn(),
      ...props,
    }),
  );
}

describe('reminders visibility regression', () => {
  beforeEach(() => {
    vi.stubGlobal('React', React);
    contextMocks.useSettings.mockReturnValue({
      lang: 'en',
      settings: buildSettingsState(),
      updateSetting: vi.fn(),
    });
    contextMocks.usePersonalEvents.mockReturnValue(buildPersonalEventsState());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows reminders in Settings and new-event mode on native iOS', () => {
    setPlatform(true, 'ios');

    const settingsHtml = renderSettings();
    const addEventHtml = renderAddEventModal();

    expect(settingsHtml).toContain('seg:reminder:settings.reminderSettings');
    expect(addEventHtml).toContain('seg:event:addEvent.event');
    expect(addEventHtml).toContain('seg:reminder:addEvent.reminder');
  });

  it('hides reminders on native Android, even with native-settings preview enabled', () => {
    setPlatform(true, 'android');

    const settingsHtml = renderSettings();
    const addEventHtml = renderAddEventModal();

    expect(settingsHtml).not.toContain(
      'seg:reminder:settings.reminderSettings',
    );
    expect(addEventHtml).toContain('seg:event:addEvent.event');
    expect(addEventHtml).not.toContain('seg:reminder:addEvent.reminder');
  });

  it('hides reminders on web browsers while preserving event creation', () => {
    setPlatform(false, 'web');

    const settingsHtml = renderSettings();
    const addEventHtml = renderAddEventModal();

    expect(settingsHtml).not.toContain(
      'seg:reminder:settings.reminderSettings',
    );
    expect(addEventHtml).toContain('seg:event:addEvent.event');
    expect(addEventHtml).not.toContain('seg:reminder:addEvent.reminder');
  });

  it('keeps reminder option visible when editing an existing reminder on unsupported platforms', () => {
    setPlatform(true, 'android');

    const addEventHtml = renderAddEventModal({
      editEvent: {
        id: 'rem-1',
        isReminder: true,
        sourceType: 'reminder',
      },
    });

    expect(addEventHtml).toContain('seg:event:addEvent.event');
    expect(addEventHtml).toContain('seg:reminder:addEvent.reminder');
  });

  it('renders iOS-style sheet menu structure on web for new events', () => {
    setPlatform(false, 'web');

    const addEventHtml = renderAddEventModal();

    expect(addEventHtml).toContain('seg:event:addEvent.event');
    expect(addEventHtml).toContain(
      'menu:addEvent.repeat:none:addEvent.repeatNone',
    );
    expect(addEventHtml).toContain(
      'menu:addEvent.repeat:custom:addEvent.repeatCustom',
    );
    expect(addEventHtml).toContain(
      'menu:addEvent.alert:customDate:addEvent.alertCustomDate',
    );
    expect(addEventHtml).toContain(
      'menu:addEvent.showAs:busy:addEvent.showAsBusy',
    );
    expect(addEventHtml).toContain('addEvent.calendar');

    expect(addEventHtml).toContain('calendar.location');
    expect(addEventHtml).toContain('addEvent.options');
    expect(addEventHtml).toContain('calendar.details');

    expect(addEventHtml).not.toContain('addEvent.endRepeat');
    expect(addEventHtml).not.toContain('addEvent.secondAlert');
  });
});
