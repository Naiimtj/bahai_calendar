import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import {
  isNativePlatform,
  requestDeviceCalendarAccess,
  getDeviceCalendars,
  getReminderLists,
  SOURCE_COLORS,
  colorForIndex,
} from '../services/personalCalendar';
import {
  getAvailableCalendars,
  supportsNativeReminders,
} from '../services/calendarSync';
import BaseSelectInput from './base/BaseSelectInput';
import { BaseIcon, BaseMenu, BaseSegmentedControl } from './base';
import BaseButton from './base/BaseButton';
import BaseModal from './base/BaseModal';
import BaseSpinner from './base/BaseSpinner';
import BaseTextInput from './base/BaseTextInput';
import BaseToggleSwitch from './base/BaseToggleSwitch';
import About from './About';
import FastingAlarmsModal from './FastingAlarmsModal';
import { useFastingAlarms } from '../hooks/useFastingAlarms';
import { useFastingSunTimes } from '../hooks/useFastingSunTimes';
import { shouldPreviewNativeSettings } from '../utils/devPreview';
import LocationPicker from './LocationPicker';
import {
  buildEventCalendars,
  resolveDefaultCalendarId,
  toCalendarMenuOptions,
} from '../lib/eventCalendars';

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function ColorPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(value || '#3b82f6');

  const handleHexInput = (raw) => {
    const next = raw.startsWith('#') ? raw : `#${raw}`;
    setHex(next);
    if (HEX_RE.test(next)) onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {SOURCE_COLORS.map((hexColor) => (
          <BaseIcon
            key={hexColor}
            icon="circle"
            size="sm"
            color={hexColor}
            onClick={() => onChange(hexColor)}
            wrapperClassName={`rounded-full ${
              value?.toLowerCase() === hexColor.toLowerCase()
                ? 'ring-2 ring-offset-1 ring-primary dark:ring-offset-gray-800'
                : ''
            }`}
          />
        ))}
        {(() => {
          const isCustom =
            value &&
            !SOURCE_COLORS.some((c) => c.toLowerCase() === value.toLowerCase());
          return (
            <span
              role="button"
              tabIndex={0}
              className={`relative inline-flex items-center justify-center rounded-full cursor-pointer ${
                isCustom
                  ? 'ring-2 ring-offset-1 ring-primary dark:ring-offset-gray-800'
                  : ''
              }`}
              style={isCustom ? { backgroundColor: value } : undefined}
              onClick={() => setOpen((o) => !o)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setOpen((o) => !o);
              }}
            >
              <BaseIcon
                icon="plus"
                size="sm"
                className={
                  isCustom
                    ? 'fill-white [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.5))]'
                    : 'fill-gray-500 hover:fill-gray-800 dark:hover:fill-gray-200'
                }
              />
            </span>
          );
        })()}
      </div>

      {open && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={HEX_RE.test(hex) ? hex : '#3b82f6'}
            onChange={(e) => handleHexInput(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border-none bg-transparent p-0"
          />
          <input
            type="text"
            value={hex}
            onChange={(e) => handleHexInput(e.target.value)}
            placeholder="#RRGGBB"
            maxLength={7}
            className="w-28 rounded-lg px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      )}
    </div>
  );
}

function DeviceCalendarList() {
  const { t } = useTranslation();
  const { config, setDeviceCalendarPref } = usePersonalEvents();
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const prefs = config.deviceCalendars || {};

  useEffect(() => {
    let active = true;
    getDeviceCalendars().then((list) => {
      if (active) {
        setCalendars(list);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-3">
        <BaseSpinner />
      </div>
    );
  }

  if (calendars.length === 0) {
    return (
      <p className="text-xs px-1 py-2 text-gray-400 dark:text-gray-500">
        {t('settings.noDeviceCalendars')}
      </p>
    );
  }

  return (
    <div className="space-y-2 mb-3">
      {calendars.map((cal) => (
        <div
          key={cal.id}
          className="rounded-lg px-3 py-2 bg-gray-200 dark:bg-gray-800"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <BaseTextInput
                value={prefs[cal.id]?.customName ?? ''}
                placeholder={cal.title}
                variant="plain"
                hideDetails
                updateOnBlur
                onChange={(v) =>
                  setDeviceCalendarPref(cal.id, {
                    customName: v.trim() || undefined,
                  })
                }
                className="!px-0 !py-0 !text-sm"
              />
              {cal.sourceName && (
                <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                  {cal.sourceName}
                </p>
              )}
            </div>
            <BaseToggleSwitch
              value={prefs[cal.id]?.enabled !== false}
              onChange={(enabled) => setDeviceCalendarPref(cal.id, { enabled })}
            />
          </div>
          {prefs[cal.id]?.enabled !== false && (
            <div className="mt-2">
              <ColorPicker
                value={prefs[cal.id]?.color ?? cal.color ?? null}
                onChange={(color) => setDeviceCalendarPref(cal.id, { color })}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DefaultCalendarSelect() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();
  const { config } = usePersonalEvents();
  const [deviceCalendars, setDeviceCalendars] = useState([]);

  useEffect(() => {
    let active = true;
    getAvailableCalendars().then((list) => {
      if (active) setDeviceCalendars(list);
    });
    return () => {
      active = false;
    };
  }, []);

  const calendars = buildEventCalendars(
    deviceCalendars.filter(
      (calendar) => config.deviceCalendars?.[calendar.id]?.enabled !== false,
    ),
    config,
    t('addEvent.localCalendar'),
  );

  if (calendars.length < 2) return null;

  return (
    <div className="rounded-lg px-3 py-3 mb-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {t('settings.defaultCalendar')}
        </span>
        <BaseMenu
          label={t('settings.defaultCalendar')}
          value={resolveDefaultCalendarId(
            calendars,
            settings.defaultCalendarId,
            config,
          )}
          options={toCalendarMenuOptions(calendars)}
          onChange={(id) => updateSetting('defaultCalendarId', id)}
          className="!text-sm"
        />
      </div>
      <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
        {t('settings.defaultCalendarHint')}
      </p>
    </div>
  );
}

function CalendarSourcesSection() {
  const { t } = useTranslation();
  const {
    config,
    setDeviceCalendarEnabled,
    setLocalCalendarColor,
    setLocalCalendarName,
    addIcsSource,
    updateIcsSource,
    removeIcsSource,
  } = usePersonalEvents();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmPending, setConfirmPending] = useState(null); // null | true | false

  const handleDeviceToggle = (enabled) => {
    setConfirmPending(enabled);
  };

  const handleConfirm = async () => {
    const enabled = confirmPending;
    setConfirmPending(null);
    if (enabled) {
      const granted = await requestDeviceCalendarAccess();
      if (!granted) return;
    }
    setDeviceCalendarEnabled(enabled);
  };

  const handleConfirmCancel = () => {
    setConfirmPending(null);
  };

  const handleAdd = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    addIcsSource({ name: name.trim(), url: trimmed });
    setName('');
    setUrl('');
    setShowAddModal(false);
  };

  const handleAddModalClose = () => {
    setShowAddModal(false);
    setName('');
    setUrl('');
  };

  return (
    <div className="px-4 py-3 mb-8">
      <label className="text-xs font-semibold tracking-wider block mb-2 text-gray-400 dark:text-gray-500">
        {t('settings.personalCalendars')}
      </label>
      {config.deviceCalendarEnabled && <DefaultCalendarSelect />}
      {(isNativePlatform() || shouldPreviewNativeSettings()) && (
        <>
          <div className="flex items-center justify-between rounded-lg px-3 py-3 mb-3 ">
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {t('settings.deviceCalendar')}
            </span>
            <BaseToggleSwitch
              value={config.deviceCalendarEnabled}
              onChange={handleDeviceToggle}
            />
          </div>
          {config.deviceCalendarEnabled && <DeviceCalendarList />}
        </>
      )}

      <div className="rounded-lg px-3 py-2 mb-3 bg-gray-200 dark:bg-gray-800">
        <BaseTextInput
          value={config.localCalendarName ?? ''}
          placeholder={t('addEvent.localCalendar')}
          variant="plain"
          hideDetails
          updateOnBlur
          onChange={(v) => setLocalCalendarName(v.trim() || undefined)}
          className="!px-0 !py-0 mb-2 !text-sm"
        />
        <ColorPicker
          value={config.localCalendarColor ?? colorForIndex(0)}
          onChange={setLocalCalendarColor}
        />
      </div>

      <div className="space-y-2 mb-3">
        {(config.icsSources || []).map((src) => (
          <div
            key={src.id}
            className="rounded-lg px-3 py-2 bg-gray-200 dark:bg-gray-800"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-gray-100">
                {src.name}
              </span>
              <BaseIcon
                icon="close"
                size="sm"
                onClick={() => removeIcsSource(src.id)}
                className="fill-gray-500 hover:fill-error"
              />
            </div>
            <div className="mt-2">
              <ColorPicker
                value={src.color ?? null}
                onChange={(color) => updateIcsSource(src.id, { color })}
              />
            </div>
          </div>
        ))}
        {(config.icsSources || []).length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t('settings.noCalendarSources')}
          </p>
        )}
      </div>

      <BaseButton
        surface
        onClick={() => setShowAddModal(true)}
        className="w-full"
      >
        {t('settings.addCalendarSource')}
      </BaseButton>

      <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
        {t('settings.calendarSourcesHint')}
      </p>

      <BaseModal
        visible={showAddModal}
        title={t('settings.addCalendarSource')}
        onClose={handleAddModalClose}
      >
        <div className="flex flex-col gap-3">
          <BaseTextInput
            value={name}
            onChange={setName}
            placeholder={t('settings.calendarSourceName')}
          />
          <BaseTextInput
            value={url}
            onChange={setUrl}
            placeholder={t('settings.calendarSourceUrl')}
            type="url"
          />
          <BaseButton
            surface
            className="w-full"
            onClick={handleAdd}
            disabled={!url.trim()}
          >
            {t('settings.addCalendarSource')}
          </BaseButton>
        </div>
      </BaseModal>

      <BaseModal
        visible={confirmPending !== null}
        title={
          confirmPending
            ? t('settings.deviceCalendarConfirmGrant')
            : t('settings.deviceCalendarConfirmRevoke')
        }
        onClose={handleConfirmCancel}
        closeButtonHidden
      >
        <p className="text-sm text-center text-gray-600 dark:text-gray-300 mb-6">
          {confirmPending
            ? t('settings.deviceCalendarConfirmHint')
            : t('settings.deviceCalendarRevokeHint')}
        </p>
        <div className="flex gap-3">
          <BaseButton surface className="flex-1" onClick={handleConfirm}>
            {t('settings.confirm')}
          </BaseButton>
        </div>
      </BaseModal>
    </div>
  );
}

function RemindersListItems({ lists, loading }) {
  const { t } = useTranslation();
  const { config, setDeviceCalendarPref } = usePersonalEvents();
  const prefs = config.deviceCalendars || {};

  if (loading) {
    return (
      <div className="flex justify-center py-3">
        <BaseSpinner />
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <p className="text-xs px-1 py-2 text-gray-400 dark:text-gray-500">
        {t('settings.noReminderLists')}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {lists.map((list) => (
        <div
          key={list.id}
          className="rounded-lg px-3 py-2 bg-gray-200 dark:bg-gray-800"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-gray-100">
              {list.title}
            </span>
            <BaseToggleSwitch
              value={prefs[list.id]?.enabled !== false}
              onChange={(listEnabled) =>
                setDeviceCalendarPref(list.id, { enabled: listEnabled })
              }
            />
          </div>
          {prefs[list.id]?.enabled !== false && (
            <div className="mt-2">
              <ColorPicker
                value={prefs[list.id]?.color ?? list.color ?? null}
                onChange={(color) => setDeviceCalendarPref(list.id, { color })}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Shortcut to the same Fasting-alarms editor shown on the Fasting page, so
 * sunrise/sunset alerts can be reviewed from either screen. */
function FastingAlarmsSection() {
  const { t } = useTranslation();
  const { lang } = useSettings();
  const { supported } = useFastingAlarms();
  const { location, saveLocation, clearLocation, sunTimes } =
    useFastingSunTimes();
  const [showAlarms, setShowAlarms] = useState(false);

  if (!supported && !shouldPreviewNativeSettings()) return null;

  return (
    <div className="px-4 py-4 mb-8">
      <div className="text-xs font-semibold tracking-wider block mb-2 text-gray-400 dark:text-gray-500 uppercase">
        {t('fasting.alarms.title')}
      </div>
      <p className="text-xs mb-3 text-gray-400 dark:text-gray-500">
        {t('settings.fastingAlarmsHint')}
      </p>

      {location && (
        <div className="flex flex-row items-center gap-3">
          <div className="flex flex-row items-center w-full gap-3">
            <div className="flex flex-row items-center">
              <BaseIcon icon="locationOn" size="xs" className="fill-gray-400" />
              <span className="text-xs text-gray-400">{location.name}</span>
            </div>
            <BaseIcon
              icon="delete"
              className="stroke-primary-text md:hover:stroke-red-500 cursor-pointer md:size-4 size-6"
              onClick={clearLocation}
            />
          </div>

          <div className="flex justify-end w-full">
            <BaseButton
              label={t('settings.openFastingAlarms')}
              icon="alarm"
              outlined
              onClick={() => setShowAlarms(true)}
              className="text-xs"
            />
          </div>
        </div>
      )}
      {!location && (
        <LocationPicker
          location={location}
          language={lang}
          onLocationChange={saveLocation}
          onClear={clearLocation}
          className="flex-1 gap-2 w-full"
        />
      )}

      <FastingAlarmsModal
        visible={showAlarms}
        onClose={() => setShowAlarms(false)}
        sunTimes={sunTimes}
        lang={lang}
      />
    </div>
  );
}

function DefaultReminderListSelect({ lists }) {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();
  const { config } = usePersonalEvents();
  const prefs = config.deviceCalendars || {};
  const shownLists = lists.filter((list) => prefs[list.id]?.enabled !== false);

  if (shownLists.length < 2) return null;

  return (
    <div className="mt-3 rounded-lg px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {t('settings.defaultReminderList')}
        </span>
        <BaseMenu
          label={t('settings.defaultReminderList')}
          value={resolveDefaultCalendarId(
            lists,
            settings.defaultReminderListId,
            config,
          )}
          options={shownLists.map((list) => ({
            value: list.id,
            label: list.title,
            color: prefs[list.id]?.color ?? list.color,
          }))}
          onChange={(id) => updateSetting('defaultReminderListId', id)}
          className="!text-sm"
        />
      </div>
      <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
        {t('settings.defaultReminderListHint')}
      </p>
    </div>
  );
}

function RemindersListSection() {
  const { t } = useTranslation();
  const { config } = usePersonalEvents();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const enabled = supportsNativeReminders() && config.deviceCalendarEnabled;

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    setLoading(true);
    getReminderLists().then((result) => {
      if (active) {
        setLists(result);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="px-4 pt-6 pb-3">
      <label className="text-xs font-semibold tracking-wider block mb-2 text-gray-400 dark:text-gray-500 uppercase">
        {t('settings.reminders')}
      </label>
      {!loading && <DefaultReminderListSelect lists={lists} />}

      <RemindersListItems lists={lists} loading={loading} />
      <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
        {t('settings.remindersHint')}
      </p>
    </div>
  );
}

export default function Settings() {
  const { settings, updateSetting } = useSettings();
  const { t } = useTranslation();
  const remindersSupported = supportsNativeReminders();

  const [showAboutModal, setShowAboutModal] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (remindersSupported || activeTab !== 'reminder') return;
    setActiveTab('general');
  }, [activeTab, remindersSupported]);

  const tabOptions = [
    {
      value: 'general',
      label: t('settings.generalSettings'),
    },
    {
      value: 'calendar',
      label: t('settings.calendarAndLocation'),
    },
    ...(remindersSupported
      ? [
          {
            value: 'reminder',
            label: t('settings.reminderSettings'),
          },
        ]
      : []),
    {
      value: 'notification',
      label: t('settings.notificationSettings'),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div />
        <h2 className="text-lg font-semibold">{t('settings.settings')}</h2>
        <BaseButton
          icon="info"
          size="sm"
          text
          tooltip={t('about.title')}
          tooltipPosition="left"
          aria-label={t('about.title')}
          onClick={() => setShowAboutModal(true)}
        />
      </div>

      <div className="pb-4 px-4">
        <BaseSegmentedControl
          variant="rounded"
          value={activeTab}
          onChange={setActiveTab}
          options={tabOptions}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'general' && (
          <>
            {/* Dark mode */}
            <div className="px-4 py-3">
              <label className="text-xs font-semibold tracking-wider block mb-2 text-gray-400 dark:text-gray-500">
                {t('settings.appearance')}
              </label>
              <BaseSegmentedControl
                variant="rounded"
                value={settings.darkMode}
                onChange={(v) => updateSetting('darkMode', v)}
                options={[
                  { value: 'light', label: t('settings.light') },
                  { value: 'dark', label: t('settings.dark') },
                  { value: 'system', label: t('settings.system') },
                ]}
              />
            </div>

            {/* Language */}
            <div className="px-4 pt-4 pb-3">
              <label className="text-xs font-semibold tracking-wider block mb-2 text-gray-400 dark:text-gray-500">
                {t('settings.languageLabel')}
              </label>
              <BaseSelectInput
                selectedValue={settings.language}
                onSelect={(v) => updateSetting('language', v)}
                enableSearch={false}
                disableSort
                label
                options={[
                  { value: 'system', label: t('settings.system') },
                  {
                    value: 'ar',
                    label: t('settings.arabic'),
                    icon: '/static/flags/sa.svg',
                  },
                  {
                    value: 'fa',
                    label: t('settings.persian'),
                    icon: '/static/flags/ir.svg',
                  },
                  {
                    value: 'en',
                    label: t('settings.english'),
                    icon: '/static/flags/gb.svg',
                  },
                  {
                    value: 'es',
                    label: t('settings.spanish'),
                    icon: '/static/flags/es.svg',
                  },
                  {
                    value: 'fr',
                    label: t('settings.french'),
                    icon: '/static/flags/fr.svg',
                  },
                  {
                    value: 'de',
                    label: t('settings.german'),
                    icon: '/static/flags/de.svg',
                  },
                ]}
              />
              <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
                {t('settings.languageHint')}
              </p>
            </div>
            <div className="flex flex-col w-full md:mb-8">
              {/* Date shift */}
              <div className="px-4 pt-6 pb-3">
                <label className="text-xs font-semibold tracking-wider block mb-2 text-gray-400 dark:text-gray-500">
                  {t('settings.dateShiftLabel')}
                </label>
                <BaseSegmentedControl
                  variant="rounded"
                  value={settings.dateShift}
                  onChange={(v) => updateSetting('dateShift', v)}
                  options={[
                    {
                      value: 'sunset',
                      label: t('settings.localSunset'),
                    },
                    {
                      value: 'clock',
                      label: t('settings.theClock'),
                    },
                  ]}
                />
                <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
                  {t('settings.dateShiftHint')}
                </p>
              </div>

              {/* Secondary date format */}
              <div className="px-4 pt-4 pb-3">
                <label className="text-xs font-semibold tracking-wider block mb-2 text-gray-400 dark:text-gray-500">
                  {t('settings.secondaryLabel')}
                </label>
                <BaseSegmentedControl
                  variant="rounded"
                  value={settings.secondaryFormat}
                  onChange={(v) => updateSetting('secondaryFormat', v)}
                  options={[
                    {
                      value: 'numbers',
                      label: t('settings.numbers'),
                    },
                    {
                      value: 'name',
                      label: t('settings.monthDay'),
                    },
                  ]}
                />
                <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
                  {t('settings.secondaryHint')}
                </p>
              </div>

              {/* Week start */}
              <div className="px-4 pt-4 pb-3">
                <label className="text-xs font-semibold tracking-wider block mb-2 text-gray-400 dark:text-gray-500">
                  {t('settings.weekStartLabel')}
                </label>
                <BaseSegmentedControl
                  variant="rounded"
                  value={settings.weekStart}
                  onChange={(v) => updateSetting('weekStart', v)}
                  options={[
                    { value: 'jalal', label: 'Jalál (Glory)' },
                    { value: 'sunday', label: t('settings.sunday') },
                    { value: 'monday', label: t('settings.monday') },
                  ]}
                />
                <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
                  {t('settings.weekStartHint')}
                </p>
              </div>
              {/* Week numbers */}
              <div className="px-4 pt-4 pb-3">
                <label className="text-xs font-semibold tracking-wider block mb-2 text-gray-400 dark:text-gray-500">
                  {t('settings.weekNumbersLabel')}
                </label>
                <BaseSegmentedControl
                  variant="rounded"
                  value={settings.showWeekNumbers ? 'on' : 'off'}
                  onChange={(v) => updateSetting('showWeekNumbers', v === 'on')}
                  options={[
                    { value: 'on', label: t('settings.show') },
                    { value: 'off', label: t('settings.hide') },
                  ]}
                />
              </div>
              {/* Calendar view */}
              <div className="px-4 pt-4 pb-3">
                <label className="text-xs font-semibold tracking-wider block mb-2 text-gray-400 dark:text-gray-500">
                  {t('settings.calendarViewLabel')}
                </label>
                <BaseSegmentedControl
                  variant="rounded"
                  value={settings.calendarView}
                  onChange={(v) => updateSetting('calendarView', v)}
                  options={[
                    {
                      value: 'gregorian',
                      label: t('settings.gregorian'),
                    },
                    { value: 'mixed', label: t('settings.mixed') },
                    { value: 'badi', label: "Badí'" },
                  ]}
                />
              </div>

              {/* Time format */}
              <div className="px-4 pt-4 pb-3">
                <label className="text-xs font-semibold tracking-wider block mb-2 text-gray-400 dark:text-gray-500">
                  {t('settings.timeFormatLabel')}
                </label>
                <BaseSegmentedControl
                  variant="rounded"
                  value={settings.timeFormat}
                  onChange={(v) => updateSetting('timeFormat', v)}
                  options={[
                    { value: '24', label: t('settings.timeFormat24') },
                    { value: '12', label: t('settings.timeFormat12') },
                    { value: 'system', label: t('settings.system') },
                  ]}
                />
              </div>

              {/* Calendar density */}
              <div className="px-4 pt-4 pb-3">
                <label className="text-xs font-semibold tracking-wider block mb-2 text-gray-400 dark:text-gray-500">
                  {t('calendar.visualization')}
                </label>
                <BaseSegmentedControl
                  variant="rounded"
                  value={settings.calendarDensity}
                  onChange={(v) => updateSetting('calendarDensity', v)}
                  options={[
                    { value: 'compacta', label: t('calendar.compact') },
                    { value: 'detalles', label: t('calendar.details') },
                  ]}
                />
              </div>
            </div>
          </>
        )}

        {/* Haptic feedback */}
        {activeTab === 'general' &&
          (isNativePlatform() || shouldPreviewNativeSettings()) && (
            <div className="px-4 pt-4 pb-3 mb-8">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold tracking-wider text-gray-400 dark:text-gray-500">
                  {t('settings.hapticFeedbackLabel')}
                </label>
                <BaseToggleSwitch
                  value={settings.hapticFeedback}
                  onChange={(v) => updateSetting('hapticFeedback', v)}
                />
              </div>
              <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
                {t('settings.hapticFeedbackHint')}
              </p>
            </div>
          )}

        {activeTab === 'calendar' && (
          <>
            <CalendarSourcesSection />
          </>
        )}
        {activeTab === 'reminder' && remindersSupported && (
          <>
            <RemindersListSection />
          </>
        )}
        {activeTab === 'notification' && (
          <div className="px-4 pt-4 pb-3">
            <label className="text-xs font-semibold tracking-wider uppercase text-gray-400 dark:text-gray-500">
              {t('settings.notificationSettings')}
            </label>
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {t('settings.notificationsEvents')}
                </span>
                <BaseToggleSwitch
                  value={settings.notificationsEvents}
                  onChange={(v) => updateSetting('notificationsEvents', v)}
                />
              </div>
              <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
                {t('settings.notificationsEventsHint')}
              </p>
              <div className="flex items-center justify-between gap-2 mt-3">
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {t('settings.notificationsBahaiEvents')}
                </span>
                <BaseToggleSwitch
                  value={settings.notificationsBahaiEvents}
                  onChange={(v) => updateSetting('notificationsBahaiEvents', v)}
                />
              </div>
              <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
                {t('settings.notificationsBahaiEventsHint')}
              </p>
            </div>
          </div>
        )}
        {activeTab === 'notification' && <FastingAlarmsSection />}
      </div>

      <BaseModal
        visible={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      >
        <About />
      </BaseModal>
    </div>
  );
}
