import { Capacitor } from '@capacitor/core';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal, BaseButton, BaseIcon, BaseAnchor } from './base';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import { useSettings } from '../context/SettingsContext';
import { hour12Option } from '../utils/timeFormat';
import { getLocationMapPreview } from '../services/mapPreview';
import AddEventModal, {
  alertOptions,
  cardClass,
  labelClass,
  rowClass,
  rowIconClass,
  rowInnerClass,
  repeatDisplayLabel,
  sectionTitleClass,
  showAsOptions,
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

/** Link target for an event URL: bare hosts get https://, and only http(s) is linkable. */
function eventUrlHref(value) {
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(value)
    ? value
    : `https://${value}`;
  try {
    const { protocol } = new URL(candidate);
    return protocol === 'http:' || protocol === 'https:' ? candidate : null;
  } catch {
    return null;
  }
}

function appleMapsUrl(location, coords) {
  const latitude = coords?.latitude;
  const longitude = coords?.longitude;
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return `https://maps.apple.com/?ll=${latitude},${longitude}&q=${encodeURIComponent(location)}`;
  }
  return `https://maps.apple.com/?q=${encodeURIComponent(location)}`;
}

function googleMapsUrl(location) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

const MAP_PREVIEW_WIDTH = 104;
const MAP_PREVIEW_HEIGHT = 96;
const OSM_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright';
// Reminders have no duration; give every timeline block at least 30 min.
const MIN_TIMELINE_BLOCK_HOURS = 0.5;
const TIMELINE_HEIGHT_CLASSES = { 2: 'h-20', 3: 'h-28', 4: 'h-36' };

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
      t('addEvent.alertNone')
    );
  }
  return formatAlertMinutes(raw?.alerts?.[0], t) || t('addEvent.alertNone');
}

/** Splits a location into name + address: iOS stores "Name\nAddress", our geocoder "Name, Address". */
function splitLocationLabel(location) {
  if (typeof location !== 'string') return { name: '', address: '' };
  const value = location.trim();
  if (!value || isLikelyUrl(value)) return { name: value, address: '' };

  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return { name: lines[0], address: lines.slice(1).join(', ') };
  }

  const singleLine = lines[0] || value;
  const commaIndex = singleLine.indexOf(',');
  if (commaIndex < 0) return { name: singleLine, address: '' };

  return {
    name: singleLine.slice(0, commaIndex).trim(),
    address: singleLine.slice(commaIndex + 1).trim(),
  };
}

function hoursSince(dayStart, date) {
  return (date.getTime() - dayStart.getTime()) / 3600000;
}

/** Places overlapping blocks side by side: adds `lane` and per-overlap-cluster `lanes`. */
function assignLaneMetadata(blocks) {
  const sorted = [...blocks].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.end - a.end;
  });

  const withLanes = [];
  let cluster = [];
  let clusterMaxEnd = -Infinity;

  const flushCluster = () => {
    if (!cluster.length) return;
    const laneEnds = [];
    cluster.forEach((block) => {
      let lane = laneEnds.findIndex((laneEnd) => laneEnd <= block.start);
      if (lane < 0) {
        laneEnds.push(block.end);
        lane = laneEnds.length - 1;
      } else {
        laneEnds[lane] = block.end;
      }
      withLanes.push({ ...block, lane });
    });

    const laneCount = laneEnds.length || 1;
    withLanes.slice(-cluster.length).forEach((block) => {
      block.lanes = laneCount;
    });

    cluster = [];
    clusterMaxEnd = -Infinity;
  };

  sorted.forEach((block) => {
    if (!cluster.length || block.start < clusterMaxEnd) {
      cluster.push(block);
      clusterMaxEnd = Math.max(clusterMaxEnd, block.end);
      return;
    }

    flushCluster();
    cluster.push(block);
    clusterMaxEnd = block.end;
  });

  flushCluster();
  return withLanes;
}

/**
 * Event detail view shown when tapping a personal event.
 * Displays event info, calendar, alert. Supports Edit and Delete.
 */
export default function EventDetailModal({ visible, event, onClose }) {
  const { t, i18n } = useTranslation();
  const { settings, lang, dark } = useSettings();
  const {
    eventsForDate,
    removeLocalEventAndRefresh,
    removeDeviceEventAndRefresh,
    removeDeviceReminderAndRefresh,
  } = usePersonalEvents();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [duplicate, setDuplicate] = useState(null);
  const [mapPreview, setMapPreview] = useState(null);
  const [loadingMapPreview, setLoadingMapPreview] = useState(false);
  const [titleCollapsed, setTitleCollapsed] = useState(false);
  const headerRef = useRef(null);
  const titleRef = useRef(null);

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
    month: 'long',
    year: 'numeric',
  };
  const timeOpts = { hour: 'numeric', minute: '2-digit' };
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
  const { name: locationName, address: locationAddress } =
    splitLocationLabel(location);
  const notes = typeof raw?.notes === 'string' ? raw.notes.trim() : '';
  const url = typeof raw?.url === 'string' ? raw.url.trim() : '';
  const urlHref = url ? eventUrlHref(url) : null;
  const showMapsLinks = location && !isLikelyUrl(location);
  const isAndroid = Capacitor.getPlatform() === 'android';
  const hasEvent = Boolean(event);
  const coordLatitude = raw?.locationCoords?.latitude;
  const coordLongitude = raw?.locationCoords?.longitude;
  const mapLanguage = (i18n.resolvedLanguage || 'en').slice(0, 2);
  const appleMapsHref = appleMapsUrl(
    location,
    mapPreview ?? raw?.locationCoords,
  );
  const mapsHref = isAndroid ? googleMapsUrl(location) : appleMapsHref;
  const mapsLabel = isAndroid
    ? t('calendar.openInGoogleMaps')
    : t('calendar.openInAppleMaps');
  const accentColor = event?.color?.startsWith('#') ? event.color : '#3b82f6';
  const showAsLabel = raw?.isReminder
    ? ''
    : showAsOptions(t).find((option) => option.value === raw?.availability)
        ?.label;

  const hasFirstAlert =
    (raw?.alert && raw.alert !== 'none') || (raw?.alerts?.length || 0) > 0;
  const secondAlertLabel =
    (raw?.alert2 &&
      raw.alert2 !== 'none' &&
      alertOptions(t).find((option) => option.value === raw.alert2)?.label) ||
    formatAlertMinutes(raw?.alerts?.[1], t) ||
    t('addEvent.alertNone');

  useEffect(() => {
    if (!visible || !hasEvent || showEdit) {
      setTitleCollapsed(false);
      return undefined;
    }
    if (typeof IntersectionObserver === 'undefined') return undefined;
    if (!headerRef.current || !titleRef.current) return undefined;

    const root = titleRef.current.closest('dialog');
    if (!root) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setTitleCollapsed(!entry.isIntersecting),
      {
        root,
        rootMargin: `-${headerRef.current.offsetHeight}px 0px 0px 0px`,
      },
    );

    observer.observe(titleRef.current);
    return () => observer.disconnect();
  }, [visible, hasEvent, showEdit]);

  useEffect(() => {
    let active = true;
    if (!visible || !hasEvent || !showMapsLinks || location.length < 3) {
      setMapPreview(null);
      setLoadingMapPreview(false);
      return () => {
        active = false;
      };
    }

    setMapPreview(null);
    setLoadingMapPreview(true);

    getLocationMapPreview(location, {
      latitude: coordLatitude,
      longitude: coordLongitude,
      width: MAP_PREVIEW_WIDTH,
      height: MAP_PREVIEW_HEIGHT,
      dark,
      language: mapLanguage,
    }).then((preview) => {
      if (!active) return;
      setMapPreview(preview);
      setLoadingMapPreview(false);
    });

    return () => {
      active = false;
    };
  }, [
    visible,
    hasEvent,
    location,
    showMapsLinks,
    coordLatitude,
    coordLongitude,
    dark,
    mapLanguage,
  ]);

  if (!visible || !event) return null;

  const dayEvents = startDate ? eventsForDate(startDate) : [];

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
    setDuplicate(null);
    onClose();
  };

  if (duplicate) {
    return (
      <AddEventModal
        visible
        onClose={handleEditClose}
        initialDate={startDate}
        editEvent={duplicate}
        onSaved={onClose}
      />
    );
  }

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
      <BaseModal
        visible
        onClose={onClose}
        sheet
        ariaLabel={event.name}
        closeHidden
      >
        <div className="flex flex-col">
          <div
            ref={headerRef}
            className="sticky top-0 z-20 -mx-4 grid grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-3 bg-gray-100/80 px-4 pb-3 pt-4 backdrop-blur-xl dark:bg-gray-900/80"
          >
            <BaseIcon
              icon="close"
              size="large"
              onClick={onClose}
              aria-label={t('calendar.close')}
              className="fill-gray-900 dark:fill-gray-100"
              wrapperClassName="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-transform active:scale-95 dark:bg-gray-700/80 dark:ring-white/10"
            />

            <p
              aria-hidden="true"
              className={`truncate text-center text-[17px] font-semibold text-gray-900 transition-opacity duration-200 ease-out motion-reduce:transition-none dark:text-gray-100 ${
                titleCollapsed ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {event.name}
            </p>

            {isEditable ? (
              <BaseButton
                variant="primary"
                outlined
                className="justify-self-end !h-11 !rounded-full !px-5 !text-[17px] !font-medium !text-gray-900 !bg-white/80 !shadow-sm !ring-1 !ring-black/5 !backdrop-blur-md md:hover:!bg-white/80 md:hover:!text-gray-900 md:hover:!no-underline active:!bg-gray-200 dark:!bg-gray-700/80 dark:!text-gray-100 dark:!ring-white/10 dark:active:!bg-gray-600"
                onClick={() => setShowEdit(true)}
              >
                {t('calendar.edit')}
              </BaseButton>
            ) : (
              <span aria-hidden="true" />
            )}
          </div>

          <div className="flex flex-col gap-7 pb-4 pt-2">
            <div className="flex gap-3">
              <span
                aria-hidden="true"
                className="relative w-1.5 shrink-0 overflow-hidden rounded-full"
              >
                <BaseIcon
                  icon="colorBar"
                  color={accentColor}
                  className="absolute inset-0 h-full w-full"
                />
              </span>

              <div className="min-w-0 flex-1">
                <h2
                  ref={titleRef}
                  className="break-words text-[28px] font-bold leading-tight text-gray-900 dark:text-gray-100"
                >
                  {event.name}
                </h2>
                <p className="mt-1 text-[17px] text-gray-900 dark:text-gray-100">
                  {dateStr}
                </p>
                <p className="text-[17px] tabular-nums text-gray-900 dark:text-gray-100">
                  {raw?.allDay
                    ? t('addEvent.allDay')
                    : `${startTimeStr}${endTimeStr ? `–${endTimeStr}` : ''}`}
                </p>
              </div>
            </div>

            {location && (
              <section>
                <h3 className={sectionTitleClass}>{t('calendar.location')}</h3>
                <div
                  className={`${cardClass} relative flex items-center gap-4 px-5 py-4`}
                >
                  {showMapsLinks && (
                    <BaseAnchor
                      href={mapsHref}
                      aria-label={mapsLabel}
                      className="absolute inset-0 rounded-[1.625rem] px-0 active:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark dark:active:bg-white/5"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-[17px] text-gray-900 dark:text-gray-100">
                      {locationName || location}
                    </p>
                    {locationAddress && (
                      <p className="mt-0.5 break-words text-[17px] leading-snug text-gray-500 dark:text-gray-400">
                        {locationAddress}
                      </p>
                    )}
                    {mapPreview?.source === 'osm' && (
                      <BaseAnchor
                        href={OSM_COPYRIGHT_URL}
                        size="xs"
                        label={t('calendar.mapAttribution')}
                        className="relative z-10 mt-2 inline-flex px-0 text-gray-500 dark:text-gray-400"
                      />
                    )}
                  </div>

                  {showMapsLinks && (loadingMapPreview || mapPreview) && (
                    <div className="pointer-events-none relative h-24 w-[6.5rem] shrink-0 overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
                      {mapPreview ? (
                        <>
                          <img
                            src={mapPreview.imageUrl}
                            alt=""
                            onError={() => setMapPreview(null)}
                            className={`h-full w-full object-cover ${
                              mapPreview.source === 'osm'
                                ? 'dark:invert dark:hue-rotate-180 dark:brightness-95 dark:contrast-[.9]'
                                : ''
                            }`}
                          />
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute left-1/2 top-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 shadow-md ring-2 ring-white"
                          >
                            <BaseIcon
                              icon="locationOn"
                              size="small"
                              className="fill-white"
                            />
                          </span>
                        </>
                      ) : (
                        <div className="h-full w-full animate-pulse bg-gray-200 dark:bg-gray-700/70" />
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {startDate && endDate && !raw?.allDay && (
              <div className={`${cardClass} px-4 py-5`} aria-hidden="true">
                <MiniTimeline
                  start={startDate}
                  end={endDate}
                  title={event.name}
                  accentColor={accentColor}
                  locationName={locationName}
                  dayEvents={dayEvents}
                  currentId={raw?.id}
                  lang={lang}
                  hour12={hour12}
                />
              </div>
            )}

            <section>
              <h3 className={sectionTitleClass}>{t('addEvent.options')}</h3>
              <div className="flex flex-col gap-2.5">
                <div className={cardClass}>
                  <DetailRow
                    icon="calendar"
                    label={t('addEvent.calendar')}
                    value={raw?.sourceName || t('addEvent.localCalendar')}
                    color={accentColor}
                  />
                </div>

                <div className={cardClass}>
                  {showAsLabel && (
                    <DetailRow
                      icon="eye"
                      label={t('addEvent.showAs')}
                      value={showAsLabel}
                    />
                  )}
                  <DetailRow
                    icon="bell"
                    label={t('addEvent.alert')}
                    value={alertLabel}
                  />
                  {hasFirstAlert && (
                    <DetailRow
                      icon="bell"
                      label={t('addEvent.secondAlert')}
                      value={secondAlertLabel}
                    />
                  )}
                  {raw?.repeat && raw.repeat !== 'none' && (
                    <DetailRow
                      icon="repeat"
                      label={t('addEvent.repeat')}
                      value={repeatLabel}
                    />
                  )}
                </div>
              </div>
            </section>

            {(notes || url) && (
              <section>
                <h3 className={sectionTitleClass}>{t('calendar.details')}</h3>
                <div className={cardClass}>
                  {notes && (
                    <p className="whitespace-pre-wrap break-words border-b border-gray-200 px-5 py-4 text-[17px] text-gray-900 last:border-b-0 dark:border-gray-700 dark:text-gray-100">
                      {notes}
                    </p>
                  )}

                  {url && (
                    <div className={rowClass}>
                      <BaseIcon
                        icon="link"
                        size="large"
                        strokeWidth={1.75}
                        className={rowIconClass}
                      />
                      <div className={rowInnerClass}>
                        {urlHref ? (
                          <BaseAnchor
                            href={urlHref}
                            label={url}
                            className="min-w-0 break-all text-[17px]"
                          />
                        ) : (
                          <span className="min-w-0 break-all text-[17px] text-gray-500 dark:text-gray-400">
                            {url}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {isEditable && (
              <div className="flex flex-col gap-2.5">
                <BaseButton
                  variant="primary"
                  surface
                  className="w-full"
                  onClick={() => setDuplicate({ ...raw, id: undefined })}
                >
                  {t('calendar.duplicateEvent')}
                </BaseButton>
                <BaseButton
                  variant="danger"
                  surface
                  className="w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  {t('calendar.deleteEvent')}
                </BaseButton>
              </div>
            )}
          </div>
        </div>
      </BaseModal>

      <BaseModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        closeButtonHidden
      >
        <div className="flex flex-col items-center gap-4 pb-4">
          <p className="text-sm text-center text-gray-700 dark:text-gray-300">
            {t('calendar.confirmDelete')}
          </p>
          <div className="flex w-full gap-3">
            <BaseButton
              variant="danger"
              surface
              className="w-full"
              onClick={handleDelete}
            >
              {t('calendar.deleteEvent')}
            </BaseButton>
          </div>
        </div>
      </BaseModal>
    </>
  );
}

/** Read-only options row: icon, label and a trailing value (optional colour dot). */
function DetailRow({ icon, label, value, color }) {
  return (
    <div className={rowClass}>
      <BaseIcon
        icon={icon}
        size="large"
        strokeWidth={1.75}
        className={rowIconClass}
      />
      <div className={rowInnerClass}>
        <span className={labelClass}>{label}</span>
        <span className="flex min-w-0 items-center gap-2 text-[17px] text-gray-500 dark:text-gray-400">
          {color && (
            <BaseIcon
              icon="circle"
              size="small"
              color={color}
              className="shrink-0"
            />
          )}
          <span className="truncate">{value}</span>
        </span>
      </div>
    </div>
  );
}

/** iOS-style mini day timeline: the event plus the day's neighbouring events. */
function MiniTimeline({
  start,
  end,
  title,
  accentColor,
  locationName,
  dayEvents,
  currentId,
  lang,
  hour12,
}) {
  const dayStart = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const startHour = hoursSince(dayStart, start);
  const endHour = Math.max(
    hoursSince(dayStart, end),
    startHour + MIN_TIMELINE_BLOCK_HOURS,
  );
  const gridStart = Math.floor(startHour);
  const span = Math.min(4, Math.max(2, Math.ceil(endHour) - gridStart));
  const gridEnd = gridStart + span;

  // iOS-style hour labels: "9 AM" on a 12-hour clock, "9:00" on a 24-hour one.
  const uses12h = new Intl.DateTimeFormat(lang, {
    hour: 'numeric',
    ...(hour12 !== undefined && { hour12 }),
  }).resolvedOptions().hour12;
  const timeOptions = uses12h
    ? { hour: 'numeric', hour12: true }
    : { hour: 'numeric', minute: '2-digit', hourCycle: 'h23' };

  const neighbors = dayEvents
    .filter(
      ({ _raw: item }) =>
        item && item.id !== currentId && !item.allDay && item.start,
    )
    .map(({ _raw: item, name, color }) => {
      const itemStart = new Date(item.start);
      const blockStart = hoursSince(dayStart, itemStart);
      const blockEnd = item.end
        ? hoursSince(dayStart, new Date(item.end))
        : blockStart;
      return {
        key: `${item.sourceType}-${item.id}-${itemStart.getTime()}`,
        name,
        color: color?.startsWith('#') ? color : '#9ca3af',
        start: blockStart,
        end: Math.max(blockEnd, blockStart + MIN_TIMELINE_BLOCK_HOURS),
      };
    })
    .filter((block) => block.end > gridStart && block.start < gridEnd);

  const blocks = assignLaneMetadata([
    { key: 'current', current: true, start: startHour, end: endHour },
    ...neighbors,
  ]);

  return (
    <div className={`relative ${TIMELINE_HEIGHT_CLASSES[span]}`}>
      {Array.from({ length: span + 1 }, (_, i) => {
        const labelDate = new Date(dayStart);
        labelDate.setHours(gridStart + i, 0, 0, 0);
        return (
          <div
            key={`hour-${gridStart + i}`}
            className="absolute inset-x-0 flex -translate-y-1/2 items-center gap-2"
            style={{ top: `${(i / span) * 100}%` }}
          >
            <span className="w-12 shrink-0 whitespace-nowrap text-end text-[13px] tabular-nums text-gray-400 dark:text-gray-500">
              {labelDate.toLocaleTimeString(lang, timeOptions)}
            </span>
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>
        );
      })}

      <div className="absolute inset-y-0 left-14 right-0">
        {blocks.map((block) => {
          const top = Math.max(block.start, gridStart);
          const bottom = Math.min(block.end, gridEnd);
          const geometry = {
            top: `${((top - gridStart) / span) * 100}%`,
            height: `${((bottom - top) / span) * 100}%`,
            left: `${(block.lane / block.lanes) * 100}%`,
            width: `${100 / block.lanes}%`,
          };

          if (!block.current) {
            return (
              <div key={block.key} className="absolute p-px" style={geometry}>
                <div className="h-full overflow-hidden rounded-md border border-gray-200 bg-white text-xs leading-tight text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  <div className="flex items-center gap-1.5 px-2 py-px">
                    <BaseIcon
                      icon="circle"
                      size="x-small"
                      color={block.color}
                      className="shrink-0"
                    />
                    <span className="truncate">{block.name}</span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={block.key}
              className="absolute z-10 p-px"
              style={geometry}
            >
              <div className="relative h-full overflow-hidden rounded-md">
                <BaseIcon
                  icon="colorBar"
                  color={accentColor}
                  className="absolute inset-0 h-full w-full opacity-30 dark:opacity-40"
                />
                <BaseIcon
                  icon="colorBar"
                  color={accentColor}
                  className="absolute inset-y-0 left-0 h-full w-1"
                />
                <div className="relative py-0.5 pl-3 pr-2 text-xs leading-tight">
                  <p className="truncate font-semibold text-gray-900 dark:text-gray-50">
                    {title}
                  </p>
                  {locationName && endHour - startHour >= 1 && (
                    <p className="flex items-center gap-1 text-gray-700 dark:text-gray-200">
                      <BaseIcon
                        icon="locationOn"
                        size="x-small"
                        className="shrink-0 fill-current"
                      />
                      <span className="truncate">{locationName}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
