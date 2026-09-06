import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import { BaseModal, BaseButton, BaseIcon, BaseAnchor } from './base';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import { useSettings } from '../context/SettingsContext';
import { hour12Option } from '../utils/timeFormat';
import { searchLocations } from '../services/geocodingApi';
import { CapacitorCalendar } from '../native/bahaiCalendarNative';
import AddEventModal, {
  alertOptions,
  repeatDisplayLabel,
} from './AddEventModal';

function eventLocationValue(raw, fallback = '') {
  if (typeof raw?.location === 'string' && raw.location.trim()) {
    return raw.location.trim();
  }
  if (typeof raw?.eventLocation === 'string' && raw.eventLocation.trim()) {
    return raw.eventLocation.trim();
  }
  if (
    typeof raw?.structuredLocation?.title === 'string' &&
    raw.structuredLocation.title.trim()
  ) {
    return raw.structuredLocation.title.trim();
  }
  if (typeof raw?.venue === 'string' && raw.venue.trim()) {
    return raw.venue.trim();
  }
  if (typeof fallback === 'string' && fallback.trim()) {
    return fallback.trim();
  }
  return '';
}

function isLikelyUrl(value) {
  return /^https?:\/\//i.test(value);
}

function appleMapsUrl(location) {
  return `https://maps.apple.com/?q=${encodeURIComponent(location)}`;
}

function googleMapsUrl(location) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function staticMapUrl(lat, lon) {
  const center = `${lat},${lon}`;
  const marker = `${lat},${lon},lightblue1`;
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${encodeURIComponent(center)}&zoom=15&size=768x320&markers=${encodeURIComponent(marker)}`;
}

function locationQueryCandidates(location) {
  if (!location) return [];
  const compact = location.replace(/\s+/g, ' ').trim();
  const parts = compact
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const candidates = [compact];
  if (parts.length >= 2) candidates.push(`${parts[0]}, ${parts[1]}`);
  if (parts.length >= 1) candidates.push(parts[0]);
  return [...new Set(candidates)].filter((q) => q.length >= 3);
}

function supportsNativeAppleMapPreview() {
  return (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === 'ios' &&
    typeof CapacitorCalendar.appleMapsPreview === 'function'
  );
}

function isDataImageUrl(value) {
  return typeof value === 'string' && value.startsWith('data:image/');
}

async function getNativeAppleMapPreview(queries) {
  if (!supportsNativeAppleMapPreview()) return '';
  for (const query of queries) {
    try {
      const res = await CapacitorCalendar.appleMapsPreview({
        query,
        width: 768,
        height: 320,
      });
      const imageDataUrl = res?.result?.imageDataUrl;
      if (isDataImageUrl(imageDataUrl)) return imageDataUrl;
    } catch {
      // Try next query candidate.
    }
  }
  return '';
}

async function getWebMapPreview(queries, language) {
  for (const query of queries) {
    try {
      const results = await searchLocations(query, {
        count: 1,
        language,
      });
      const first = Array.isArray(results) ? results[0] : null;
      const lat = first?.latitude;
      const lon = first?.longitude;
      if (typeof lat === 'number' && typeof lon === 'number') {
        return staticMapUrl(lat, lon);
      }
    } catch {
      // Try next query candidate.
    }
  }
  return '';
}

/** Formats a raw native alert offset (minutes relative to start) that doesn't match one of our presets. */
function formatAlertMinutes(minutes, t) {
  if (minutes === undefined || minutes === null) return null;
  const abs = Math.abs(minutes);
  if (abs === 0) return t('addEvent.alertAtTime');
  if (abs % 10080 === 0)
    return t('addEvent.alertWeekBefore', { count: abs / 10080 });
  if (abs % 1440 === 0)
    return t('addEvent.alertDayBefore', { count: abs / 1440 });
  if (abs % 60 === 0) return t('addEvent.alertHourBefore', { count: abs / 60 });
  return t('addEvent.alertMinBefore', { count: abs });
}

/** Human-readable repeat summary for a stored/native event, or "None". */
function getRepeatLabel(raw, t) {
  if (!raw?.repeat || raw.repeat === 'none') return t('calendar.none');
  return repeatDisplayLabel(
    raw.repeat,
    raw.repeatCustomInterval,
    raw.repeatCustomUnit,
    t,
  );
}

/** Human-readable alert summary for a stored/native event, or "None". */
function getAlertLabel(raw, t) {
  if (raw?.alert && raw.alert !== 'none') {
    return (
      alertOptions(t).find((o) => o.value === raw.alert)?.label ||
      t('calendar.none')
    );
  }
  return formatAlertMinutes(raw?.alerts?.[0], t) || t('calendar.none');
}

/**
 * Event detail view shown when tapping a personal event.
 * Displays event info, calendar, alert. Supports Edit and Delete.
 */
export default function EventDetailModal({ visible, event, onClose }) {
  const { t, i18n } = useTranslation();
  const { settings, lang } = useSettings();
  const {
    removeLocalEventAndRefresh,
    removeDeviceEventAndRefresh,
    removeDeviceReminderAndRefresh,
  } = usePersonalEvents();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [mapPreviewUrl, setMapPreviewUrl] = useState('');
  const [loadingMapPreview, setLoadingMapPreview] = useState(false);

  const raw = event?._raw;
  const isLocal = raw?.id?.startsWith('local-');
  const isDevice = raw?.sourceType === 'device';
  const isReminder = raw?.sourceType === 'reminder';
  const isEditable = isLocal || isDevice || isReminder;

  const startDate = raw?.start ? new Date(raw.start) : null;
  const endDate = raw?.end ? new Date(raw.end) : null;

  const dateOpts = {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const timeOpts = { hour: '2-digit', minute: '2-digit' };
  const hour12 = hour12Option(settings.timeFormat);
  if (hour12 !== undefined) timeOpts.hour12 = hour12;

  const dateStr = startDate ? startDate.toLocaleDateString(lang, dateOpts) : '';
  const startTimeStr =
    startDate && !raw?.allDay
      ? startDate.toLocaleTimeString(lang, timeOpts)
      : '';
  const endTimeStr =
    endDate && !raw?.allDay ? endDate.toLocaleTimeString(lang, timeOpts) : '';

  const repeatLabel = getRepeatLabel(raw, t);
  const alertLabel = getAlertLabel(raw, t);
  const location = eventLocationValue(raw, event?.location);
  const showMapsLinks = location && !isLikelyUrl(location);

  useEffect(() => {
    let active = true;
    if (!visible || !event || !showMapsLinks || location.length < 3) {
      setMapPreviewUrl('');
      setLoadingMapPreview(false);
      return () => {
        active = false;
      };
    }

    const fetchPreview = async () => {
      setLoadingMapPreview(true);
      setMapPreviewUrl('');

      const queries = locationQueryCandidates(location);

      const language = (i18n.resolvedLanguage || 'en').slice(0, 2);
      const nativePreview = await getNativeAppleMapPreview(queries);
      if (!active) return;
      if (nativePreview) {
        setMapPreviewUrl(nativePreview);
        setLoadingMapPreview(false);
        return;
      }

      const webPreview = await getWebMapPreview(queries, language);
      if (!active) return;
      setMapPreviewUrl(webPreview || '');
      setLoadingMapPreview(false);
    };

    fetchPreview();

    return () => {
      active = false;
    };
  }, [visible, event, location, showMapsLinks, i18n.resolvedLanguage]);

  if (!visible || !event) return null;

  const handleDelete = async () => {
    if (isReminder && raw?.id) {
      await removeDeviceReminderAndRefresh(raw.id);
    } else if (isDevice && raw?.id) {
      await removeDeviceEventAndRefresh(raw.id);
    } else if (raw?.id) {
      removeLocalEventAndRefresh(raw.id);
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleEditClose = () => {
    setShowEdit(false);
    onClose();
  };

  if (showEdit) {
    return (
      <AddEventModal
        visible
        onClose={handleEditClose}
        initialDate={startDate}
        editEvent={raw}
        onSaved={onClose}
      />
    );
  }

  return (
    <>
      <BaseModal visible={visible} onClose={onClose} closeButtonHidden>
        <div className="flex flex-col gap-5 -m-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg sm:min-w-md">
          {/* Header */}
          <div className="flex items-center justify-between">
            
          <BaseButton text icon="arrowLeft" size="md" onClick={onClose} />

            {isEditable && (
              <BaseButton
                variant="primary"
                text
                onClick={() => setShowEdit(true)}
              >
                {t('calendar.edit')}
              </BaseButton>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {event.name}
          </h2>

          {/* Date & time */}
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="">{dateStr}</p>
            {startTimeStr && (
              <p>
                {startTimeStr}
                {endTimeStr ? ` - ${endTimeStr}` : ''}
              </p>
            )}
          </div>

          {/* Mini timeline */}
          {startDate && endDate && !raw?.allDay && (
            <MiniTimeline start={startDate} end={endDate} title={event.name} />
          )}

          {/* Calendar */}
          <div className="rounded-xl bg-white dark:bg-gray-800/60 px-4 py-3 flex items-center justify-between">
            <span className="text-gray-900 dark:text-gray-100">
              {t('addEvent.calendar')}
            </span>
            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: event.color?.startsWith('#')
                    ? event.color
                    : '#3b82f6',
                }}
              />
              {raw?.sourceName || t('addEvent.localCalendar')}
            </span>
          </div>

          {/* Location */}
          {location && (
            <div className="rounded-xl bg-white dark:bg-gray-800/60 px-4 py-3">
              <div className="flex items-start gap-3">
                <BaseIcon
                  icon="locationOn"
                  size="sm"
                  className="fill-gray-500 dark:fill-gray-400 mt-0.5 shrink-0"
                />
                <p className="text-sm text-gray-900 dark:text-gray-100 break-words flex-1">
                  {location}
                </p>
              </div>
              {showMapsLinks && mapPreviewUrl && (
                <BaseAnchor
                  href={appleMapsUrl(location)}
                  className="mt-3 block"
                >
                  <img
                    src={mapPreviewUrl}
                    alt={t('calendar.location')}
                    loading="lazy"
                    className="w-full h-44 object-cover rounded-xl border border-gray-200 dark:border-gray-700"
                  />
                </BaseAnchor>
              )}
              {showMapsLinks && loadingMapPreview && !mapPreviewUrl && (
                <div className="mt-3 w-full h-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-700/70 animate-pulse" />
              )}
              {showMapsLinks && (
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <BaseAnchor href={appleMapsUrl(location)} size="sm">
                    {t('calendar.openInAppleMaps')}
                  </BaseAnchor>
                  <BaseAnchor href={googleMapsUrl(location)} size="sm">
                    {t('calendar.openInGoogleMaps')}
                  </BaseAnchor>
                </div>
              )}
            </div>
          )}

          {/* Repeat */}
          <div className="rounded-xl bg-white dark:bg-gray-800/60 px-4 py-3 flex items-center justify-between">
            <span className="text-gray-900 dark:text-gray-100">
              {t('addEvent.repeat')}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {repeatLabel}
            </span>
          </div>

          {/* Alert */}
          <div className="rounded-xl bg-white dark:bg-gray-800/60 px-4 py-3 flex items-center justify-between">
            <span className="text-gray-900 dark:text-gray-100">
              {t('calendar.alert')}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {alertLabel}
            </span>
          </div>

          {/* Delete */}
          {isEditable && (
            <div className="flex justify-center pt-4">
              <BaseButton
                variant="danger"
                outlined
                onClick={() => setShowDeleteConfirm(true)}
              >
                {t('calendar.deleteEvent')}
              </BaseButton>
            </div>
          )}
        </div>
      </BaseModal>

      {/* Delete confirmation */}
      <BaseModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        closeButtonHidden
      >
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-center text-gray-700 dark:text-gray-300">
            {t('calendar.confirmDelete')}
          </p>
          <div className="flex gap-3">
            <BaseButton
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
            >
              {t('search.cancel')}
            </BaseButton>
            <BaseButton variant="primary" onClick={handleDelete}>
              {t('calendar.deleteEvent')}
            </BaseButton>
          </div>
        </div>
      </BaseModal>
    </>
  );
}

/** Small timeline block showing the event on a mini hour grid. */
function MiniTimeline({ start, end, title }) {
  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;
  const gridStart = Math.floor(startHour);
  const totalRange = 3;
  const hourOffsets = [0, 1, 2, 3];
  const hourTicks = hourOffsets.map((offset) => offset / totalRange);
  const halfHourTicks = [1, 3, 5].map((slot) => slot / 6);

  const pad = (n) => String(n).padStart(2, '0');
  const hourLabel = (hour) => {
    const normalized = ((hour % 24) + 24) % 24;
    return `${pad(normalized)}:00`;
  };
  const timeLabel = `${pad(start.getHours())}:${pad(start.getMinutes())} \u2013 ${pad(end.getHours())}:${pad(end.getMinutes())}`;

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800/60 p-4 relative md:h-60 h-36 overflow-hidden">
      <div className="relative h-full">
        {hourTicks.map((tick) => (
          <div
            key={`hour-line-${tick}`}
            className="absolute left-14 right-0 border-t border-gray-200 dark:border-gray-700"
            style={{ top: `${tick * 100}%` }}
          />
        ))}
        {hourOffsets.map((offset) => (
          <span
            key={`hour-label-${offset}`}
            className="absolute left-0 w-12 -translate-y-1/2 text-xs text-gray-400"
            style={{ top: `${(offset / totalRange) * 100}%` }}
          >
            {hourLabel(gridStart + offset)}
          </span>
        ))}
        {halfHourTicks.map((tick) => (
          <div
            key={`half-${tick}`}
            className="absolute left-14 right-0 border-t border-gray-100 dark:border-gray-700/50"
            style={{ top: `${tick * 100}%` }}
          />
        ))}
        {/* Event block */}
        <div
          className="absolute left-14 right-2 rounded-md bg-blue-500 text-white px-2 py-1 text-xs"
          style={{
            top: `${((startHour - gridStart) / totalRange) * 100}%`,
            height: `${((endHour - startHour) / totalRange) * 100}%`,
            minHeight: '1.5rem',
          }}
        >
          <div className="font-medium truncate">{title}</div>
          <div className="opacity-80 text-[10px]">{timeLabel}</div>
        </div>
      </div>
    </div>
  );
}
