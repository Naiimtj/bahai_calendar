import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { useSettings } from '../context/SettingsContext';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import {
  isNativePlatform,
  requestDeviceCalendarAccess,
  getDeviceCalendars,
  SOURCE_COLORS,
  colorForIndex,
} from '../services/personalCalendar';
import { reverseGeocode } from '../services/geocodingApi';
import ArrowLeftIcon from './base/icons/ArrowLeftIcon';
import BaseSelectInput from './base/BaseSelectInput';
import { BaseIcon, BaseSegmentedControl } from './base';
import BaseButton from './base/BaseButton';
import BaseModal from './base/BaseModal';
import BaseSpinner from './base/BaseSpinner';
import BaseTextInput from './base/BaseTextInput';
import BaseToggleSwitch from './base/BaseToggleSwitch';

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
                    ? 'fill-white filter-[drop-shadow(0_0_1px_rgba(0,0,0,0.5))]'
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
                className="px-0! py-0! text-sm!"
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
  };

  return (
    <div className="px-4 pt-6 pb-3">
      <label className="text-xs font-semibold tracking-wider block mb-2 text-gray-400 dark:text-gray-500">
        {t('settings.personalCalendars')}
      </label>

      {isNativePlatform() && (
        <>
          <div className="flex items-center justify-between rounded-lg px-3 py-3 mb-3 bg-gray-200 dark:bg-gray-800">
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
          className="px-0! py-0! mb-2 text-sm!"
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

      <div className="space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('settings.calendarSourceName')}
          className="w-full rounded-lg px-3 py-2 text-sm bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400 dark:placeholder-gray-500"
        />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t('settings.calendarSourceUrl')}
          className="w-full rounded-lg px-3 py-2 text-sm bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400 dark:placeholder-gray-500"
        />
        <BaseButton onClick={handleAdd} disabled={!url.trim()}>
          {t('settings.addCalendarSource')}
        </BaseButton>
      </div>

      <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
        {t('settings.calendarSourcesHint')}
      </p>

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
        <div className="flex gap-3 justify-center">
          <BaseButton variant="secondary" onClick={handleConfirmCancel}>
            {t('search.cancel')}
          </BaseButton>
          <BaseButton onClick={handleConfirm}>
            {t('settings.confirm')}
          </BaseButton>
        </div>
      </BaseModal>
    </div>
  );
}

export default function Settings({ onClose }) {
  const { settings, updateSetting, lang, refreshEffectiveToday } =
    useSettings();
  const { t } = useTranslation();

  const [savedLocation, setSavedLocation] = useState(() => {
    try {
      const s = localStorage.getItem('bahai-location');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [loadingLocationCities, setLoadingLocationCities] = useState(false);
  const [loadingLocationGPS, setLoadingLocationGPS] = useState(false);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    if (!locationQuery.trim() || locationQuery.length < 2) {
      setLocationSuggestions([]);
      setLoadingLocationCities(false);
      return;
    }
    setLoadingLocationCities(true);
    const timer = setTimeout(() => {
      fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationQuery)}&count=5&language=${lang}`,
      )
        .then((r) => r.json())
        .then((data) => setLocationSuggestions(data.results || []))
        .catch(() => setLocationSuggestions([]))
        .finally(() => setLoadingLocationCities(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [locationQuery, lang]);

  const saveLocationToStorage = (loc) => {
    localStorage.setItem('bahai-location', JSON.stringify(loc));
    setSavedLocation(loc);
    setShowLocationSearch(false);
    setLocationQuery('');
    setLocationSuggestions([]);
    setLocationError(null);
    refreshEffectiveToday();
  };

  const handleLocationGPS = () => {
    setLocationError(null);
    setLoadingLocationGPS(true);
    const onSuccess = async (coords) => {
      const name =
        (await reverseGeocode(coords.latitude, coords.longitude, lang)) ||
        t('fasting.myLocation');
      saveLocationToStorage({
        lat: coords.latitude,
        lon: coords.longitude,
        name,
      });
      setLoadingLocationGPS(false);
    };
    const onError = () => {
      setLocationError(t('fasting.locationError'));
      setLoadingLocationGPS(false);
    };
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/geolocation').then(({ Geolocation }) =>
        Geolocation.requestPermissions()
          .then(() =>
            Geolocation.getCurrentPosition({ enableHighAccuracy: true }),
          )
          .then((pos) => onSuccess(pos.coords))
          .catch(onError),
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => onSuccess(pos.coords),
        onError,
      );
    }
  };

  const handleSelectLocationCity = (city) => {
    saveLocationToStorage({
      lat: city.latitude,
      lon: city.longitude,
      name: `${city.name}${city.admin1 ? `, ${city.admin1}` : ''}, ${city.country}`,
    });
  };

  const handleClearSettingsLocation = () => {
    localStorage.removeItem('bahai-location');
    setSavedLocation(null);
    setLocationError(null);
    refreshEffectiveToday();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={onClose}
          className="text-primary-text font-semibold text-sm inline-flex items-center gap-1"
        >
          <ArrowLeftIcon size="small" color="currentColor" />
          {t('settings.done')}
        </button>
        <h2 className="text-lg font-semibold">{t('settings.settings')}</h2>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Dark mode */}
        <div className="px-4 pt-6 pb-3">
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
        <div className="px-4 pt-4 pb-3 border-t border-gray-200 dark:border-gray-800">
          <label className="text-xs font-semibold tracking-wider block mb-2 text-gray-400 dark:text-gray-500">
            {t('settings.languageLabel')}
          </label>
          <BaseSelectInput
            selectedValue={settings.language}
            onSelect={(v) => updateSetting('language', v)}
            enableSearch={false}
            disableSort
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

        {/* Date shift */}
        <div className="px-4 pt-4 pb-3 border-t border-gray-200 dark:border-gray-800">
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
        <div className="px-4 pt-4 pb-3 border-t border-gray-200 dark:border-gray-800">
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
        <div className="px-4 pt-4 pb-3 border-t border-gray-200 dark:border-gray-800">
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
        <div className="px-4 pt-4 pb-3 border-t border-gray-200 dark:border-gray-800">
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
        <div className="px-4 pt-4 pb-3 border-t border-gray-200 dark:border-gray-800">
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
              { value: 'badi', label: "Badí'" },
              { value: 'mixed', label: t('settings.mixed') },
            ]}
          />
        </div>

        {/* Time format */}
        <div className="px-4 pt-4 pb-3 border-t border-gray-200 dark:border-gray-800">
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
        <div className="px-4 pt-4 pb-3 border-t border-gray-200 dark:border-gray-800">
          <label className="text-xs font-semibold tracking-wider block mb-2 text-gray-400 dark:text-gray-500">
            {t('calendar.density')}
          </label>
          <BaseSegmentedControl
            variant="rounded"
            value={settings.calendarDensity}
            onChange={(v) => updateSetting('calendarDensity', v)}
            options={[
              { value: 'compacta', label: t('calendar.compact') },
              { value: 'detalles', label: t('calendar.details') },
              { value: 'lista', label: t('calendar.list') },
            ]}
          />
        </div>

        {/* Location */}
        <div className="px-4 pt-4 pb-6 border-t border-gray-200 dark:border-gray-800">
          <label className="text-xs font-semibold tracking-wider block mb-2 text-gray-400 dark:text-gray-500">
            {t('settings.locationLabel')}
          </label>

          {savedLocation ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <BaseIcon
                  icon="locationOn"
                  size="xs"
                  className="fill-gray-400"
                />
                <span className="text-sm text-primary-text">
                  {savedLocation.name}
                </span>
              </div>
              <BaseIcon
                icon="close"
                size="xs"
                className="fill-gray-400"
                onClick={handleClearSettingsLocation}
              />
            </div>
          ) : !showLocationSearch && !loadingLocationGPS ? (
            <div className="flex gap-2">
              <BaseButton
                label={t('fasting.useMyLocation')}
                icon="locationOn"
                outlined
                onClick={handleLocationGPS}
                className="flex-1 text-xs"
              />
              <BaseButton
                label={t('fasting.searchCity')}
                icon="search"
                outlined
                onClick={() => {
                  setShowLocationSearch(true);
                  setLocationError(null);
                }}
                className="flex-1 text-xs"
              />
            </div>
          ) : null}

          {loadingLocationGPS && (
            <div className="flex justify-center py-2">
              <BaseSpinner />
            </div>
          )}

          {showLocationSearch && !savedLocation && (
            <div>
              <div className="relative">
                <input
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder={t('fasting.cityPlaceholder')}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-primary-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                {loadingLocationCities && (
                  <div className="absolute right-2 top-2.5">
                    <BaseSpinner />
                  </div>
                )}
              </div>
              {locationSuggestions.length > 0 && (
                <div className="mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                  {locationSuggestions.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleSelectLocationCity(city)}
                      className="w-full text-left px-3 py-2 text-sm text-primary-text hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      {city.name}
                      {city.admin1 ? `, ${city.admin1}` : ''}, {city.country}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowLocationSearch(false);
                  setLocationQuery('');
                  setLocationSuggestions([]);
                }}
                className="mt-2 text-xs text-gray-400 underline"
              >
                {t('fasting.cancel')}
              </button>
            </div>
          )}

          {locationError && (
            <p className="text-red-400 text-xs mt-2">{locationError}</p>
          )}
          {!savedLocation && !showLocationSearch && !loadingLocationGPS && (
            <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
              {t('settings.locationHint')}
            </p>
          )}
        </div>

        <CalendarSourcesSection />
      </div>
    </div>
  );
}
