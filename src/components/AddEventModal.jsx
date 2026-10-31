import { useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import {
  BaseCalendarPicker,
  BaseIcon,
  BaseMenu,
  BaseModal,
  BaseSegmentedControl,
  BaseToggleSwitch,
  BaseWheelPicker,
} from './base';
import {
  getAvailableCalendars,
  createEvent,
  createNativeReminder,
  requestRemindersAccess,
  isNativePlatform,
  supportsNativeReminders,
} from '../services/calendarSync';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import { colorForIndex, getReminderLists } from '../services/personalCalendar';
import {
  buildEventCalendars,
  resolveDefaultCalendarId,
  toCalendarMenuOptions,
} from '../lib/eventCalendars';
import { searchEventLocations } from '../services/geocodingApi';
import { useSettings } from '../context/SettingsContext';
import { hour12Option } from '../utils/timeFormat';

function pad(n) {
  return String(n).padStart(2, '0');
}

function toDateInput(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInput(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromInputs(dateStr, timeStr) {
  const d = new Date(
    `${dateStr || toDateInput(new Date())}T${timeStr || '00:00'}:00`,
  );
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function formatDateDisplay(dateStr, locale) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function formatTimeDisplay(dateStr, timeStr, locale, hour12) {
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    ...(hour12 !== undefined && { hour12 }),
  }).format(fromInputs(dateStr, timeStr));
}

function combine(dateStr, timeStr, allDay) {
  if (!dateStr) return null;
  const time = allDay ? '00:00' : timeStr || '00:00';
  return new Date(`${dateStr}T${time}:00`);
}

function addMinutes(dateStr, timeStr, minutes) {
  const d = new Date(`${dateStr}T${timeStr || '00:00'}:00`);
  d.setMinutes(d.getMinutes() + minutes);
  return { date: toDateInput(d), time: toTimeInput(d) };
}

function eventLocationValue(event) {
  if (!event) return '';
  if (typeof event.location === 'string' && event.location) {
    return event.location;
  }
  if (typeof event.eventLocation === 'string' && event.eventLocation) {
    return event.eventLocation;
  }
  if (
    typeof event.structuredLocation?.title === 'string' &&
    event.structuredLocation.title
  ) {
    return event.structuredLocation.title;
  }
  if (typeof event.venue === 'string' && event.venue) {
    return event.venue;
  }
  return '';
}

const DURATIONS = [15, 30, 60, 90, 120];
const MIN_EVENT_DURATION_MINUTES = 60;

function durationLabel(min) {
  if (min < 60) return `${min} min`;
  if (min % 60 === 0) return `${min / 60} h`;
  return `${min} min`;
}

export function repeatOptions(t) {
  return [
    { value: 'none', label: t('addEvent.repeatNone') },
    { value: 'daily', label: t('addEvent.repeatDaily') },
    { value: 'weekly', label: t('addEvent.repeatWeekly') },
    { value: 'biweekly', label: t('addEvent.repeatBiweekly') },
    { value: 'monthly', label: t('addEvent.repeatMonthly') },
    { value: 'yearly', label: t('addEvent.repeatYearly') },
    { value: 'custom', label: t('addEvent.repeatCustom') },
  ];
}

export function alertOptions(t) {
  return [
    { value: 'none', label: t('addEvent.alertNone') },
    { value: 'atTime', label: t('addEvent.alertAtTime') },
    { value: '5m', label: t('addEvent.alertMinBefore', { count: 5 }) },
    { value: '10m', label: t('addEvent.alertMinBefore', { count: 10 }) },
    { value: '15m', label: t('addEvent.alertMinBefore', { count: 15 }) },
    { value: '30m', label: t('addEvent.alertMinBefore', { count: 30 }) },
    { value: '1h', label: t('addEvent.alertHourBefore_one', { count: 1 }) },
    { value: '2h', label: t('addEvent.alertHourBefore_other', { count: 2 }) },
    { value: '1d', label: t('addEvent.alertDayBefore_one', { count: 1 }) },
    { value: 'customDate', label: t('addEvent.alertCustomDate') },
  ];
}

export function secondAlertOptions(t) {
  return alertOptions(t).filter((o) => o.value !== 'customDate');
}

export function priorityOptions(t) {
  return [
    { value: 'none', label: t('addEvent.priorityNone') },
    { value: 'low', label: t('addEvent.priorityLow') },
    { value: 'medium', label: t('addEvent.priorityMedium') },
    { value: 'high', label: t('addEvent.priorityHigh') },
  ];
}

export function showAsOptions(t) {
  return [
    { value: 'busy', label: t('addEvent.showAsBusy') },
    { value: 'free', label: t('addEvent.showAsFree') },
  ];
}

export function repeatDisplayLabel(value, interval, unit, t) {
  if (value === 'daily') return t('addEvent.repeatDaily');
  if (value === 'weekly') return t('addEvent.repeatWeekly');
  if (value === 'biweekly') return t('addEvent.repeatBiweekly');
  if (value === 'monthly') return t('addEvent.repeatMonthly');
  if (value === 'yearly') return t('addEvent.repeatYearly');
  if (value === 'custom') {
    const unitLabel = t(
      `addEvent.repeatUnit${unit.charAt(0).toUpperCase() + unit.slice(1)}`,
    );
    return `${interval} ${unitLabel}`;
  }
  return '';
}

export const cardClass = 'rounded-[1.625rem] bg-white dark:bg-gray-800';
export const rowClass = 'group flex items-center gap-4 px-4';
export const rowInnerClass =
  'flex min-h-[3.25rem] min-w-0 flex-1 items-center justify-between gap-3 border-b border-gray-200 py-2 dark:border-gray-700 group-last:border-b-0';
const panelClass =
  'mx-4 border-b border-gray-200 py-3 last:border-b-0 dark:border-gray-700 motion-safe:animate-reveal motion-reduce:animate-fade-in';
export const labelClass =
  'shrink-0 text-[17px] text-gray-900 dark:text-gray-100';
export const sectionTitleClass =
  'px-4 pb-2.5 text-[17px] font-semibold text-gray-500 dark:text-gray-400';
export const rowIconClass = 'shrink-0 stroke-gray-500 dark:stroke-gray-400';
const fieldClass =
  'w-full min-w-0 bg-transparent text-[17px] text-gray-900 placeholder-gray-400 outline-none dark:text-gray-100 dark:placeholder-gray-500';

function pillClass(active) {
  return `shrink-0 rounded-full bg-gray-100 px-3.5 py-1 text-[17px] leading-6 tabular-nums transition-colors active:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark dark:bg-gray-700 dark:active:bg-gray-600 ${
    active
      ? 'text-primary-dark dark:text-btn-primary'
      : 'text-gray-900 dark:text-gray-100'
  }`;
}

function endRepeatDisplayValue(mode, repeatEndDate, repeatEndCount, locale, t) {
  if (mode === 'date' && repeatEndDate) {
    return formatDateDisplay(repeatEndDate, locale);
  }
  if (mode === 'count') {
    return t('addEvent.endRepeatTimes', { count: repeatEndCount });
  }
  return undefined;
}

export default function AddEventModal({
  visible,
  onClose,
  initialDate,
  onSaved,
  editEvent,
}) {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const locale = i18n.language;
  const hour12 = hour12Option(settings?.timeFormat);
  const defaultCalendarId = settings?.defaultCalendarId;
  const defaultReminderListId = settings?.defaultReminderListId;
  const remindersSupported = supportsNativeReminders();
  const {
    config,
    addLocalEventAndRefresh,
    updateLocalEventAndRefresh,
    addOptimisticEvent,
    updateDeviceEventAndRefresh,
    updateDeviceReminderAndRefresh,
    refresh,
  } = usePersonalEvents();

  const baseStart = useMemo(() => {
    const d = initialDate ? new Date(initialDate) : new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d;
  }, [initialDate]);

  const baseEnd = useMemo(() => {
    const d = new Date(baseStart);
    d.setMinutes(d.getMinutes() + MIN_EVENT_DURATION_MINUTES);
    return d;
  }, [baseStart]);

  const [mode, setMode] = useState('event');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const locationInputRef = useRef(null);
  const [notes, setNotes] = useState('');
  const [url, setUrl] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState(toDateInput(baseStart));
  const [startTime, setStartTime] = useState(toTimeInput(baseStart));
  const [endDate, setEndDate] = useState(toDateInput(baseEnd));
  const [endTime, setEndTime] = useState(toTimeInput(baseEnd));
  const [hasDueDate, setHasDueDate] = useState(true);
  const [calendars, setCalendars] = useState([]);
  const [calendarId, setCalendarId] = useState('');
  const [reminderLists, setReminderLists] = useState([]);
  const [reminderListId, setReminderListId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [repeatValue, setRepeatValue] = useState('none');
  const [repeatCustomInterval, setRepeatCustomInterval] = useState(1);
  const [repeatCustomUnit, setRepeatCustomUnit] = useState('day');
  const [alertValue, setAlertValue] = useState('none');
  const [alertValue2, setAlertValue2] = useState('none');
  const [alertCustomDate, setAlertCustomDate] = useState('');
  const [availability, setAvailability] = useState('busy');
  const [priority, setPriority] = useState('none');
  const [repeatEndMode, setRepeatEndMode] = useState('none');
  const [repeatEndDate, setRepeatEndDate] = useState('');
  const [repeatEndCount, setRepeatEndCount] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const showReminderOption = remindersSupported || !!editEvent?.isReminder;

  const toggleExpanded = (key) => {
    setExpanded((cur) => (cur === key ? null : key));
  };

  useEffect(() => {
    if (!visible || showReminderOption || mode !== 'reminder') return;
    setMode('event');
  }, [visible, mode, showReminderOption]);

  useEffect(() => {
    const query = locationQuery.trim();
    if (query.length < 2) {
      setLocationSuggestions([]);
      return undefined;
    }
    let active = true;
    const timer = setTimeout(() => {
      searchEventLocations(query, {
        count: 5,
        language: (i18n.resolvedLanguage || 'es').slice(0, 2),
      })
        .then((results) => {
          if (active) setLocationSuggestions(results);
        })
        .catch(() => {
          if (active) setLocationSuggestions([]);
        });
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [locationQuery, i18n.resolvedLanguage]);

  useEffect(() => {
    if (!visible) return;
    if (editEvent) {
      const s = editEvent.start ? new Date(editEvent.start) : baseStart;
      const e = editEvent.end ? new Date(editEvent.end) : baseEnd;
      setMode(editEvent.isReminder ? 'reminder' : 'event');
      setTitle(editEvent.title || '');
      setLocation(eventLocationValue(editEvent));
      setLocationCoords(editEvent.locationCoords ?? null);
      setNotes(editEvent.notes || '');
      setUrl(editEvent.url || '');
      setAllDay(!!editEvent.allDay);
      setHasDueDate(true);
      setStartDate(toDateInput(s));
      setStartTime(toTimeInput(s));
      setEndDate(toDateInput(e));
      setEndTime(toTimeInput(e));
      setCalendarId(
        editEvent.sourceType === 'device' && editEvent.calendarId
          ? editEvent.calendarId
          : 'local',
      );
      if (editEvent.sourceType === 'reminder' && editEvent.listId) {
        setReminderListId(editEvent.listId);
      }
      setRepeatValue(editEvent.repeat || 'none');
      setRepeatCustomInterval(editEvent.repeatCustomInterval || 1);
      setRepeatCustomUnit(editEvent.repeatCustomUnit || 'day');
      setRepeatEndMode(editEvent.repeatEndMode || 'none');
      setRepeatEndDate(editEvent.repeatEndDate || '');
      setRepeatEndCount(editEvent.repeatEndCount || 1);
      setAlertValue(editEvent.alert || 'none');
      setAlertValue2(editEvent.alert2 || 'none');
      setAlertCustomDate(editEvent.alertCustomDate || '');
      setAvailability(editEvent.availability || 'busy');
      setPriority(editEvent.priority || 'none');
    } else {
      setMode('event');
      setTitle('');
      setLocation('');
      setLocationCoords(null);
      setNotes('');
      setUrl('');
      setAllDay(false);
      setHasDueDate(true);
      setStartDate(toDateInput(baseStart));
      setStartTime(toTimeInput(baseStart));
      setEndDate(toDateInput(baseEnd));
      setEndTime(toTimeInput(baseEnd));
      setRepeatValue('none');
      setRepeatCustomInterval(1);
      setRepeatCustomUnit('day');
      setRepeatEndMode('none');
      setRepeatEndDate('');
      setRepeatEndCount(1);
      setAlertValue('none');
      setAlertValue2('none');
      setAlertCustomDate('');
      setAvailability('busy');
      setPriority('none');
      setCalendarId('');
      setReminderListId('');
    }
    setExpanded(null);
    setLocationQuery('');
    setLocationSuggestions([]);
    setError('');
  }, [visible, baseStart, baseEnd, editEvent]);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setLoading(true);
    getAvailableCalendars()
      .then((list) => {
        if (!active) return;
        const full = buildEventCalendars(
          list,
          config,
          t('addEvent.localCalendar'),
        );
        setCalendars(full);
        setCalendarId(
          (prev) =>
            prev || resolveDefaultCalendarId(full, defaultCalendarId, config),
        );
      })
      .catch((err) => console.error('[getAvailableCalendars]', err))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [visible, t, config, defaultCalendarId]);

  useEffect(() => {
    if (!visible || !remindersSupported) return undefined;
    let active = true;
    getReminderLists()
      .then((lists) => {
        if (!active) return;
        setReminderLists(lists);
        setReminderListId(
          (prev) =>
            prev ||
            resolveDefaultCalendarId(lists, defaultReminderListId, config),
        );
      })
      .catch((err) => console.error('[getReminderLists]', err));
    return () => {
      active = false;
    };
  }, [visible, remindersSupported, config, defaultReminderListId]);

  useEffect(() => {
    if (!visible || mode !== 'reminder' || !remindersSupported) return;
    requestRemindersAccess()
      .then((granted) => {
        if (!granted) setError(t('addEvent.remindersAccessDenied'));
      })
      .catch((err) => console.error('[requestRemindersAccess]', err));
  }, [visible, mode, remindersSupported, t]);

  useEffect(() => {
    if (!allDay) return;
    if (expanded === 'startTime' || expanded === 'endTime') {
      setExpanded(null);
    }
  }, [allDay, expanded]);

  const selectedCalendar = calendars.find((c) => c.id === calendarId);
  const selectedReminderList = reminderLists.find(
    (l) => l.id === reminderListId,
  );
  // Android CalendarContract does not support storing event URLs.
  const urlSupported = !(
    mode === 'event' &&
    selectedCalendar?.provider === 'native' &&
    Capacitor.getPlatform() === 'android'
  );

  const calendarMenuOptions = useMemo(
    () =>
      toCalendarMenuOptions(
        editEvent?.sourceType === 'device'
          ? calendars.filter((c) => c.id !== 'local')
          : calendars,
      ),
    [calendars, editEvent?.sourceType],
  );

  const reminderListOptions = useMemo(
    () =>
      reminderLists.map((list) => ({
        value: list.id,
        label: list.title,
        color: list.color || undefined,
      })),
    [reminderLists],
  );

  const accentColor =
    (mode === 'reminder'
      ? selectedReminderList?.color
      : selectedCalendar?.color) ||
    config.localCalendarColor ||
    colorForIndex(0);

  const canSave = !!title.trim() && !saving;

  const updateEndToMinimumDuration = (date, time) => {
    const nextEnd = addMinutes(date, time, MIN_EVENT_DURATION_MINUTES);
    setEndDate(nextEnd.date);
    setEndTime(nextEnd.time);
  };

  const handleStartChange = (date) => {
    const nextStartDate = toDateInput(date);
    const nextStartTime = toTimeInput(date);
    setStartDate(nextStartDate);
    setStartTime(nextStartTime);

    const nextStart = fromInputs(nextStartDate, nextStartTime);
    const currentEnd = fromInputs(endDate, endTime);
    if (currentEnd < nextStart) {
      updateEndToMinimumDuration(nextStartDate, nextStartTime);
    }
  };

  const handleSelectLocation = (place) => {
    setLocation([place.name, place.address].filter(Boolean).join('\n'));
    setLocationCoords({ latitude: place.latitude, longitude: place.longitude });
    setLocationQuery('');
    setLocationSuggestions([]);
  };

  const handleClearLocation = () => {
    setLocation('');
    setLocationCoords(null);
    setLocationQuery('');
    setLocationSuggestions([]);
    locationInputRef.current?.focus();
  };

  const handleEndChange = (date) => {
    const nextEndDate = toDateInput(date);
    const nextEndTime = toTimeInput(date);
    const start = fromInputs(startDate, startTime);
    const nextEnd = fromInputs(nextEndDate, nextEndTime);

    if (nextEnd < start) {
      updateEndToMinimumDuration(startDate, startTime);
      return;
    }

    setEndDate(nextEndDate);
    setEndTime(nextEndTime);
  };

  const handleDuration = (minutes) => {
    const { date, time } = addMinutes(startDate, startTime, minutes);
    setEndDate(date);
    setEndTime(time);
  };

  const currentDuration = useMemo(() => {
    const s = new Date(`${startDate}T${startTime || '00:00'}:00`);
    const e = new Date(`${endDate}T${endTime || '00:00'}:00`);
    return Math.round((e - s) / 60000);
  }, [startDate, startTime, endDate, endTime]);

  const handleRepeatChange = (v) => {
    if (v === 'custom') {
      setRepeatValue('custom');
      toggleExpanded('repeatCustom');
      return;
    }

    setRepeatValue(v);
    if (v === 'none') {
      setRepeatEndMode('none');
    }

    if (
      expanded === 'repeatCustom' ||
      expanded === 'repeatEndDate' ||
      expanded === 'repeatEndCount'
    ) {
      setExpanded(null);
    }
  };

  const handleRepeatEndChange = (v) => {
    setRepeatEndMode(v);
    if (v === 'date') {
      if (!repeatEndDate) setRepeatEndDate(startDate);
      toggleExpanded('repeatEndDate');
      return;
    }
    if (v === 'count') {
      toggleExpanded('repeatEndCount');
      return;
    }
    if (expanded === 'repeatEndDate' || expanded === 'repeatEndCount') {
      setExpanded(null);
    }
  };

  const handleAlertChange = (v) => {
    if (v === 'customDate') {
      if (!alertCustomDate) setAlertCustomDate(startDate);
      setAlertValue('customDate');
      toggleExpanded('alertDate');
      return;
    }

    setAlertValue(v);
    if (v === 'none') {
      setAlertCustomDate('');
      setAlertValue2('none');
    }
    if (expanded === 'alertDate') {
      setExpanded(null);
    }
  };

  const endRepeatOptions = useMemo(
    () => [
      { value: 'none', label: t('addEvent.endRepeatNone') },
      { value: 'date', label: t('addEvent.endRepeatOnDate') },
      { value: 'count', label: t('addEvent.endRepeatAfterCount') },
    ],
    [t],
  );

  const endRepeatDisplay = useMemo(
    () =>
      endRepeatDisplayValue(
        repeatEndMode,
        repeatEndDate,
        repeatEndCount,
        locale,
        t,
      ),
    [repeatEndMode, repeatEndDate, repeatEndCount, locale, t],
  );

  const alertDisplay =
    alertValue === 'customDate' && alertCustomDate
      ? formatDateDisplay(alertCustomDate, locale)
      : undefined;

  const repeatDisplay =
    repeatValue === 'none'
      ? undefined
      : repeatDisplayLabel(
          repeatValue,
          repeatCustomInterval,
          repeatCustomUnit,
          t,
        );

  const saveEvent = async () => {
    const start = combine(startDate, startTime, allDay);
    const end = combine(endDate, endTime, allDay);
    if (!start || !end || end < start) {
      setError(t('addEvent.invalidDates'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: title.trim(),
        location,
        locationCoords,
        notes,
        url: url.trim(),
        allDay,
        start,
        end,
        repeat: repeatValue,
        ...(repeatValue === 'custom' && {
          repeatCustomInterval,
          repeatCustomUnit,
        }),
        alert: alertValue,
        ...(alertValue === 'customDate' && { alertCustomDate }),
        ...(alertValue !== 'none' &&
          alertValue2 !== 'none' && { alert2: alertValue2 }),
        availability,
        ...(repeatValue !== 'none' && {
          repeatEndMode,
          ...(repeatEndMode === 'date' && { repeatEndDate }),
          ...(repeatEndMode === 'count' && { repeatEndCount }),
        }),
      };
      if (editEvent?.id && editEvent.sourceType === 'device') {
        await updateDeviceEventAndRefresh(editEvent.id, {
          ...payload,
          ...(selectedCalendar?.id &&
            selectedCalendar.id !== 'local' && {
              calendarId: selectedCalendar.id,
            }),
        });
      } else if (editEvent?.id) {
        updateLocalEventAndRefresh(editEvent.id, payload);
      } else if (selectedCalendar.id === 'local') {
        addLocalEventAndRefresh(payload);
      } else {
        await createEvent(payload, selectedCalendar);
        addOptimisticEvent({
          id: `optimistic-${Date.now()}`,
          title: payload.title,
          start: payload.start,
          end: payload.end,
          allDay: payload.allDay,
          location: payload.location || '',
          notes: payload.notes || '',
          url: payload.url,
          color: selectedCalendar.color || '#3b82f6',
          sourceName: selectedCalendar.name,
          sourceType: 'device',
        });
      }
      if (onSaved) onSaved();
      onClose();
    } catch {
      setError(t('addEvent.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const saveReminder = async () => {
    const dueStart = hasDueDate ? combine(startDate, startTime, allDay) : null;
    setSaving(true);
    setError('');
    try {
      const reminderData = {
        title: title.trim(),
        notes,
        url: url.trim(),
        allDay,
        priority,
        alert: alertValue,
        alert2: alertValue2,
        alertCustomDate,
        repeat: repeatValue,
        repeatCustomInterval,
        repeatCustomUnit,
        repeatEndMode,
        repeatEndDate,
        repeatEndCount,
      };
      if (editEvent?.id && editEvent.sourceType === 'reminder') {
        await updateDeviceReminderAndRefresh(editEvent.id, {
          ...reminderData,
          start: dueStart || undefined,
          listId: reminderListId || undefined,
        });
      } else if (editEvent?.id) {
        updateLocalEventAndRefresh(editEvent.id, {
          ...reminderData,
          start: dueStart || new Date(),
          end: dueStart || new Date(),
          isReminder: true,
        });
      } else if (remindersSupported) {
        const granted = await requestRemindersAccess();
        if (!granted) {
          setError(t('addEvent.remindersAccessDenied'));
          return;
        }
        await createNativeReminder({
          ...reminderData,
          dueDate: dueStart,
          start: dueStart,
          listId: reminderListId || undefined,
        });
        refresh();
      } else {
        // Fallback: save locally
        addLocalEventAndRefresh({
          ...reminderData,
          start: dueStart || new Date(),
          end: dueStart || new Date(),
          isReminder: true,
        });
      }
      if (onSaved) onSaved();
      onClose();
    } catch {
      setError(t('addEvent.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError(t('addEvent.titleRequired'));
      return;
    }
    if (mode === 'event' && !selectedCalendar) {
      setError(t('addEvent.calendarRequired'));
      return;
    }
    if (mode === 'event') {
      await saveEvent();
    } else {
      await saveReminder();
    }
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      sheet
      closeHidden
      ariaLabel={editEvent?.id ? t('calendar.edit') : t('addEvent.title')}
    >
      <div className="flex flex-col">
        <div className="sticky top-0 z-20 -mx-4 flex items-center justify-between gap-3 bg-gray-100/80 px-4 pb-3 pt-4 backdrop-blur-xl dark:bg-gray-900/80">
          <BaseIcon
            icon="close"
            size="large"
            onClick={onClose}
            aria-label={t('addEvent.cancel')}
            className="fill-gray-900 dark:fill-gray-100"
            wrapperClassName="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-transform active:scale-95 dark:bg-gray-700/80 dark:ring-white/10"
          />

          {editEvent?.id ? (
            <span className="text-primary-dark dark:text-btn-primary font-medium text-base">
              {t('calendar.editEvent')}
            </span>
          ) : (
            <BaseSegmentedControl
              variant="glass"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'event', label: t('addEvent.event') },
                ...(showReminderOption
                  ? [{ value: 'reminder', label: t('addEvent.reminder') }]
                  : []),
              ]}
            />
          )}
          <BaseIcon
            icon="check"
            size="large"
            strokeWidth={2.5}
            onClick={saving ? undefined : handleSave}
            aria-label={t('addEvent.save')}
            className={
              canSave ? 'stroke-white' : 'stroke-gray-400 dark:stroke-gray-500'
            }
            wrapperClassName={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 ring-black/5 transition-transform active:scale-95 ${
              canSave
                ? 'bg-btn-primary-dark'
                : 'bg-white/80 dark:bg-gray-700/80 dark:ring-white/10'
            }`}
          />
        </div>

        <div className="flex flex-col gap-7 pb-4 pt-2">
          {error && (
            <p
              role="alert"
              className="rounded-2xl bg-error/10 px-4 py-3 text-sm text-error-active dark:text-error"
            >
              {error}
            </p>
          )}

          <div className="flex gap-2.5">
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

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className={`${cardClass} px-5`}>
                <input
                  type="text"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('addEvent.eventTitle')}
                  aria-label={t('addEvent.eventTitle')}
                  className={`${fieldClass} h-[3.25rem]`}
                />
              </div>

              <div className={cardClass}>
                {mode === 'reminder' && (
                  <div className={rowClass}>
                    <div className={rowInnerClass}>
                      <span className={labelClass}>
                        {t('addEvent.dueDate')}
                      </span>
                      <BaseToggleSwitch
                        value={hasDueDate}
                        onChange={setHasDueDate}
                        aria-label={t('addEvent.dueDate')}
                      />
                    </div>
                  </div>
                )}

                {(mode === 'event' || hasDueDate) && (
                  <>
                    <div className={rowClass}>
                      <div className={rowInnerClass}>
                        {mode === 'event' ? (
                          <span className={labelClass}>
                            {t('addEvent.starts')}
                          </span>
                        ) : (
                          <span className={labelClass} aria-hidden="true" />
                        )}
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            aria-expanded={expanded === 'startDate'}
                            aria-label={`${
                              mode === 'event'
                                ? t('addEvent.starts')
                                : t('addEvent.dueDate')
                            }: ${formatDateDisplay(startDate, locale)}`}
                            onClick={() => toggleExpanded('startDate')}
                            className={pillClass(expanded === 'startDate')}
                          >
                            {formatDateDisplay(startDate, locale)}
                          </button>
                          {!allDay && (
                            <button
                              type="button"
                              aria-expanded={expanded === 'startTime'}
                              aria-label={`${
                                mode === 'event'
                                  ? t('addEvent.starts')
                                  : t('addEvent.dueDate')
                              }: ${formatTimeDisplay(startDate, startTime, locale, hour12)}`}
                              onClick={() => toggleExpanded('startTime')}
                              className={pillClass(expanded === 'startTime')}
                            >
                              {formatTimeDisplay(
                                startDate,
                                startTime,
                                locale,
                                hour12,
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {expanded === 'startDate' && (
                      <div className={panelClass}>
                        <BaseCalendarPicker
                          value={fromInputs(startDate, startTime)}
                          onChange={handleStartChange}
                        />
                      </div>
                    )}

                    {!allDay && expanded === 'startTime' && (
                      <div className={panelClass}>
                        <BaseWheelPicker
                          bare
                          mode="time"
                          value={fromInputs(startDate, startTime)}
                          onChange={handleStartChange}
                        />
                      </div>
                    )}
                  </>
                )}

                {mode === 'event' && (
                  <>
                    <div className={rowClass}>
                      <div className={rowInnerClass}>
                        <span className={labelClass}>{t('addEvent.ends')}</span>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            aria-expanded={expanded === 'endDate'}
                            aria-label={`${t('addEvent.ends')}: ${formatDateDisplay(endDate, locale)}`}
                            onClick={() => toggleExpanded('endDate')}
                            className={pillClass(expanded === 'endDate')}
                          >
                            {formatDateDisplay(endDate, locale)}
                          </button>
                          {!allDay && (
                            <button
                              type="button"
                              aria-expanded={expanded === 'endTime'}
                              aria-label={`${t('addEvent.ends')}: ${formatTimeDisplay(endDate, endTime, locale, hour12)}`}
                              onClick={() => toggleExpanded('endTime')}
                              className={pillClass(expanded === 'endTime')}
                            >
                              {formatTimeDisplay(
                                endDate,
                                endTime,
                                locale,
                                hour12,
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {expanded === 'endDate' && (
                      <div className={panelClass}>
                        <BaseCalendarPicker
                          value={fromInputs(endDate, endTime)}
                          onChange={handleEndChange}
                        />
                      </div>
                    )}

                    {!allDay && expanded === 'endTime' && (
                      <div className={panelClass}>
                        <BaseWheelPicker
                          bare
                          mode="time"
                          value={fromInputs(endDate, endTime)}
                          onChange={handleEndChange}
                        />
                      </div>
                    )}

                    {!allDay && (
                      <div
                        role="group"
                        aria-label={t('addEvent.duration')}
                        className="mx-4 flex gap-2 overflow-x-auto border-b border-gray-200 py-3 scrollbar-none last:border-b-0 dark:border-gray-700"
                      >
                        {DURATIONS.map((min) => (
                          <button
                            key={min}
                            type="button"
                            aria-pressed={currentDuration === min}
                            onClick={() => handleDuration(min)}
                            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark ${
                              currentDuration === min
                                ? 'bg-btn-primary-dark text-white'
                                : 'bg-gray-100 text-gray-700 active:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:active:bg-gray-600'
                            }`}
                          >
                            {durationLabel(min)}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div className={rowClass}>
                  <div className={rowInnerClass}>
                    <span className={labelClass}>{t('addEvent.allDay')}</span>
                    <BaseToggleSwitch
                      value={allDay}
                      onChange={setAllDay}
                      aria-label={t('addEvent.allDay')}
                    />
                  </div>
                </div>

                <div className={rowClass}>
                  <div className={rowInnerClass}>
                    <span className={labelClass}>{t('addEvent.repeat')}</span>
                    <BaseMenu
                      label={t('addEvent.repeat')}
                      value={repeatValue}
                      options={repeatOptions(t)}
                      displayLabel={repeatDisplay}
                      onChange={handleRepeatChange}
                    />
                  </div>
                </div>

                {expanded === 'repeatCustom' && repeatValue === 'custom' && (
                  <div className={panelClass}>
                    <BaseWheelPicker
                      bare
                      mode="custom"
                      columns={[
                        {
                          key: 'interval',
                          items: Array.from({ length: 30 }, (_, i) => ({
                            value: i + 1,
                            label: `${i + 1}`,
                          })),
                          value: repeatCustomInterval,
                          onChange: setRepeatCustomInterval,
                          loop: true,
                        },
                        {
                          key: 'unit',
                          items: ['day', 'week', 'month', 'year'].map(
                            (unit) => ({
                              value: unit,
                              label: t(
                                `addEvent.repeatUnit${unit.charAt(0).toUpperCase() + unit.slice(1)}`,
                              ),
                            }),
                          ),
                          value: repeatCustomUnit,
                          onChange: setRepeatCustomUnit,
                          loop: true,
                        },
                      ]}
                    />
                  </div>
                )}

                {repeatValue !== 'none' && (
                  <>
                    <div className={rowClass}>
                      <div className={rowInnerClass}>
                        <span className={labelClass}>
                          {t('addEvent.endRepeat')}
                        </span>
                        <BaseMenu
                          label={t('addEvent.endRepeat')}
                          value={repeatEndMode}
                          options={endRepeatOptions}
                          displayLabel={endRepeatDisplay}
                          onChange={handleRepeatEndChange}
                        />
                      </div>
                    </div>

                    {expanded === 'repeatEndDate' &&
                      repeatEndMode === 'date' && (
                        <div className={panelClass}>
                          <BaseCalendarPicker
                            value={fromInputs(
                              repeatEndDate || startDate,
                              '00:00',
                            )}
                            onChange={(d) => {
                              setRepeatEndDate(toDateInput(d));
                              setExpanded(null);
                            }}
                          />
                        </div>
                      )}

                    {expanded === 'repeatEndCount' &&
                      repeatEndMode === 'count' && (
                        <div className={panelClass}>
                          <BaseWheelPicker
                            bare
                            mode="number"
                            numberMin={1}
                            numberMax={50}
                            value={repeatEndCount}
                            onChange={setRepeatEndCount}
                          />
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          </div>

          {mode === 'event' && (
            <section>
              <h2 className={sectionTitleClass}>{t('calendar.location')}</h2>
              <div className="relative">
                <div
                  className={`${cardClass} flex min-h-[3.25rem] items-center gap-4 px-4`}
                >
                  <BaseIcon
                    icon="navigation"
                    size="large"
                    strokeWidth={1.75}
                    className={rowIconClass}
                  />
                  <input
                    ref={locationInputRef}
                    type="text"
                    value={location.replace(/\s*\n\s*/g, ', ')}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setLocationCoords(null);
                      setLocationQuery(e.target.value);
                    }}
                    placeholder={t('addEvent.location')}
                    aria-label={t('addEvent.location')}
                    autoComplete="off"
                    enterKeyHint="search"
                    className={fieldClass}
                  />
                  {location && (
                    <BaseIcon
                      icon="close"
                      size="small"
                      onClick={handleClearLocation}
                      aria-label={t('addEvent.clearLocation')}
                      className="box-content rounded-full bg-gray-400 p-0.5 fill-white dark:bg-gray-500 dark:fill-gray-800"
                      wrapperClassName="-me-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark"
                    />
                  )}
                </div>

                {locationSuggestions.length > 0 && (
                  <ul className="absolute inset-x-0 top-full z-30 mt-2 max-h-64 origin-top overflow-y-auto overscroll-contain rounded-3xl bg-white/90 py-1.5 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl motion-safe:animate-menu-in motion-reduce:animate-fade-in dark:bg-gray-800/90 dark:ring-white/10">
                    {locationSuggestions.map((place) => (
                      <li key={place.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectLocation(place)}
                          className="flex w-full items-start gap-3 px-4 py-2.5 text-start active:bg-black/5 focus-visible:bg-black/5 focus-visible:outline-none dark:active:bg-white/10 dark:focus-visible:bg-white/10"
                        >
                          <BaseIcon
                            icon="locationOn"
                            className="mt-0.5 shrink-0 fill-gray-500 dark:fill-gray-400"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[17px] text-gray-900 dark:text-gray-100">
                              {place.name}
                            </span>
                            {place.address && (
                              <span className="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                                {place.address}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}

          <section>
            <h2 className={sectionTitleClass}>{t('addEvent.options')}</h2>
            <div className="flex flex-col gap-2.5">
              {mode === 'event' && (
                <div className={cardClass}>
                  <div className={rowClass}>
                    <BaseIcon
                      icon="calendar"
                      size="large"
                      strokeWidth={1.75}
                      className={rowIconClass}
                    />
                    <div className={rowInnerClass}>
                      <span className={labelClass}>
                        {t('addEvent.calendar')}
                      </span>
                      <BaseMenu
                        label={t('addEvent.calendar')}
                        value={calendarId}
                        options={calendarMenuOptions}
                        onChange={setCalendarId}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {mode === 'reminder' &&
                remindersSupported &&
                reminderLists.length > 0 && (
                  <div className={cardClass}>
                    <div className={rowClass}>
                      <BaseIcon
                        icon="calendar"
                        size="large"
                        strokeWidth={1.75}
                        className={rowIconClass}
                      />
                      <div className={rowInnerClass}>
                        <span className={labelClass}>{t('addEvent.list')}</span>
                        <BaseMenu
                          label={t('addEvent.list')}
                          value={reminderListId}
                          options={reminderListOptions}
                          onChange={setReminderListId}
                        />
                      </div>
                    </div>
                  </div>
                )}

              <div className={cardClass}>
                <div className={rowClass}>
                  <BaseIcon
                    icon="bell"
                    size="large"
                    strokeWidth={1.75}
                    className={rowIconClass}
                  />
                  <div className={rowInnerClass}>
                    <span className={labelClass}>{t('addEvent.alert')}</span>
                    <BaseMenu
                      label={t('addEvent.alert')}
                      value={alertValue}
                      options={alertOptions(t)}
                      displayLabel={alertDisplay}
                      onChange={handleAlertChange}
                    />
                  </div>
                </div>

                {expanded === 'alertDate' && alertValue === 'customDate' && (
                  <div className={panelClass}>
                    <BaseCalendarPicker
                      value={fromInputs(alertCustomDate || startDate, '00:00')}
                      onChange={(d) => {
                        setAlertCustomDate(toDateInput(d));
                        setExpanded(null);
                      }}
                    />
                  </div>
                )}

                {mode === 'event' && alertValue !== 'none' && (
                  <div className={rowClass}>
                    <BaseIcon
                      icon="bell"
                      size="large"
                      strokeWidth={1.75}
                      className={rowIconClass}
                    />
                    <div className={rowInnerClass}>
                      <span className={labelClass}>
                        {t('addEvent.secondAlert')}
                      </span>
                      <BaseMenu
                        label={t('addEvent.secondAlert')}
                        value={alertValue2}
                        options={secondAlertOptions(t)}
                        onChange={setAlertValue2}
                      />
                    </div>
                  </div>
                )}

                {mode === 'event' && (
                  <div className={rowClass}>
                    <BaseIcon
                      icon="eye"
                      size="large"
                      strokeWidth={1.75}
                      className={rowIconClass}
                    />
                    <div className={rowInnerClass}>
                      <span className={labelClass}>{t('addEvent.showAs')}</span>
                      <BaseMenu
                        label={t('addEvent.showAs')}
                        value={availability}
                        options={showAsOptions(t)}
                        onChange={setAvailability}
                      />
                    </div>
                  </div>
                )}

                {mode === 'reminder' && (
                  <div className={rowClass}>
                    <BaseIcon
                      icon="alert"
                      size="large"
                      strokeWidth={1.75}
                      className={rowIconClass}
                    />
                    <div className={rowInnerClass}>
                      <span className={labelClass}>
                        {t('addEvent.priority')}
                      </span>
                      <BaseMenu
                        label={t('addEvent.priority')}
                        value={priority}
                        options={priorityOptions(t)}
                        onChange={setPriority}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className={sectionTitleClass}>{t('calendar.details')}</h2>
            <div className={cardClass}>
              <div className="group flex items-start gap-4 px-4">
                <BaseIcon
                  icon="notes"
                  size="large"
                  strokeWidth={1.75}
                  className={`${rowIconClass} mt-3`}
                />
                <div className="flex min-h-[3.25rem] min-w-0 flex-1 items-start justify-between gap-3 border-b border-gray-200 py-3 dark:border-gray-700 group-last:border-b-0">
                  <div className="grid min-w-0 flex-1 grid-cols-1">
                    {/* Hidden copy sizes the textarea: grows with the text, up to 3 lines. */}
                    <span
                      aria-hidden="true"
                      className="invisible col-start-1 row-start-1 max-h-[4.5rem] overflow-hidden whitespace-pre-wrap break-words text-[17px] leading-6"
                    >
                      {`${notes} `}
                    </span>
                    <textarea
                      rows={1}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      aria-label={t('addEvent.notes')}
                      placeholder={t('addEvent.notes')}
                      className={`${fieldClass} col-start-1 row-start-1 resize-none leading-6`}
                    />
                  </div>
                </div>
              </div>

              {urlSupported && (
                <div className={rowClass}>
                  <BaseIcon
                    icon="link"
                    size="large"
                    strokeWidth={1.75}
                    className={rowIconClass}
                  />
                  <div className={rowInnerClass}>
                    <input
                      type="url"
                      inputMode="url"
                      autoCapitalize="none"
                      autoCorrect="off"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      aria-label={t('addEvent.url')}
                      placeholder={t('addEvent.url')}
                      className={fieldClass}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {!isNativePlatform() && (
            <p className="px-4 text-[13px] leading-snug text-gray-500 dark:text-gray-400">
              {t('addEvent.webHint')}
            </p>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
