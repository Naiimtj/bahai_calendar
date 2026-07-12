import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BaseButton,
  BaseIcon,
  BaseModal,
  BaseSegmentedControl,
  BaseSelect,
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
import { searchLocations } from '../services/geocodingApi';

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
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
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

const DURATIONS = [15, 30, 60, 90, 120];

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

const fieldClass =
  'bg-transparent outline-none text-gray-900 dark:text-gray-100 text-base';
const rowClass =
  'flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0';
const cardClass = 'rounded-xl bg-white dark:bg-gray-800/60 overflow-hidden';

/**
 * Modal to create a calendar event or reminder.
 */
export default function AddEventModal({
  visible,
  onClose,
  initialDate,
  onSaved,
  editEvent,
}) {
  const { t, i18n } = useTranslation();
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
    d.setHours(d.getHours() + 1);
    return d;
  }, [baseStart]);

  const [mode, setMode] = useState('event'); // 'event' | 'reminder'
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
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
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Repeat & Alert state
  const [repeatValue, setRepeatValue] = useState('none');
  const [repeatCustomInterval, setRepeatCustomInterval] = useState(1);
  const [repeatCustomUnit, setRepeatCustomUnit] = useState('day');
  const [showCustomRepeat, setShowCustomRepeat] = useState(false);
  const [pendingInterval, setPendingInterval] = useState(1);
  const [pendingUnit, setPendingUnit] = useState('day');
  const [alertValue, setAlertValue] = useState('none');
  const [alertValue2, setAlertValue2] = useState('none');
  const [alertCustomDate, setAlertCustomDate] = useState('');
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [availability, setAvailability] = useState('busy');
  const [priority, setPriority] = useState('none');
  const [prevRepeatValue, setPrevRepeatValue] = useState('none');
  // End repeat state
  const [repeatEndMode, setRepeatEndMode] = useState('none'); // 'none'|'date'|'count'
  const [repeatEndDate, setRepeatEndDate] = useState('');
  const [repeatEndCount, setRepeatEndCount] = useState(1);
  const [showEndRepeat, setShowEndRepeat] = useState(false);
  // Pending end-repeat values (committed only on "Hecho")
  const [pendingEndMode, setPendingEndMode] = useState('none');
  const [pendingEndDate, setPendingEndDate] = useState('');
  const [pendingEndCount, setPendingEndCount] = useState(1);
  // Date/time wheel pickers
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  // Location autocomplete (debounced geocoding).
  useEffect(() => {
    if (!location || location.length < 2) {
      setLocationSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      searchLocations(location)
        .then((results) => setLocationSuggestions(results))
        .catch(() => setLocationSuggestions([]));
    }, 400);
    return () => clearTimeout(timer);
  }, [location]);

  // Reset form each time the modal opens (or pre-fill in edit mode).
  useEffect(() => {
    if (!visible) return;
    if (editEvent) {
      const s = editEvent.start ? new Date(editEvent.start) : baseStart;
      const e = editEvent.end ? new Date(editEvent.end) : baseEnd;
      setMode(editEvent.isReminder ? 'reminder' : 'event');
      setTitle(editEvent.title || '');
      setLocation(editEvent.location || '');
      setNotes(editEvent.notes || '');
      setUrl(editEvent.url || '');
      setAllDay(!!editEvent.allDay);
      setHasDueDate(true);
      setStartDate(toDateInput(s));
      setStartTime(toTimeInput(s));
      setEndDate(toDateInput(e));
      setEndTime(toTimeInput(e));
      if (editEvent.sourceType === 'device' && editEvent.calendarId) {
        setCalendarId(editEvent.calendarId);
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
      setPendingEndMode('none');
      setPendingEndDate('');
      setPendingEndCount(1);
      setAlertValue('none');
      setAlertValue2('none');
      setAlertCustomDate('');
      setAvailability('busy');
      setPriority('none');
    }
    setError('');
  }, [visible, baseStart, baseEnd, editEvent]);

  // Load connected calendars.
  useEffect(() => {
    if (!visible) return;
    let active = true;
    setLoading(true);
    getAvailableCalendars()
      .then((list) => {
        if (!active) return;
        const deviceNamePrefs = config.deviceCalendars || {};
        const localCal = {
          id: 'local',
          name: config.localCalendarName || t('addEvent.localCalendar'),
          sourceType: 'local',
        };
        const named = list.map((c) => {
          const customName = deviceNamePrefs[c.id]?.customName;
          return customName ? { ...c, name: customName } : c;
        });
        const full = [localCal, ...named];
        setCalendars(full);
        setCalendarId((prev) => prev || full[0]?.id || '');
      })
      .catch((err) => console.error('[getAvailableCalendars]', err))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [visible, t, config.deviceCalendars, config.localCalendarName]);

  // Auto-request Reminders access when switching to reminder mode.
  useEffect(() => {
    if (!visible || mode !== 'reminder' || !supportsNativeReminders()) return;
    requestRemindersAccess()
      .then((granted) => {
        if (!granted) setError(t('addEvent.remindersAccessDenied'));
      })
      .catch((err) => console.error('[requestRemindersAccess]', err));
  }, [visible, mode, t]);

  const selectedCalendar = calendars.find((c) => c.id === calendarId);

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

  const commitEndRepeat = () => {
    setRepeatEndMode(pendingEndMode);
    setRepeatEndDate(pendingEndDate);
    setRepeatEndCount(pendingEndCount);
    setShowEndRepeat(false);
  };

  const alertLabel = alertOptions(t).find((o) => o.value === alertValue)?.label;

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
        notes,
        url,
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
        url,
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
        });
      } else if (editEvent?.id) {
        updateLocalEventAndRefresh(editEvent.id, {
          ...reminderData,
          start: dueStart || new Date(),
          end: dueStart || new Date(),
          isReminder: true,
        });
      } else if (supportsNativeReminders()) {
        const granted = await requestRemindersAccess();
        if (!granted) {
          setError(t('addEvent.remindersAccessDenied'));
          return;
        }
        await createNativeReminder({
          ...reminderData,
          dueDate: dueStart,
          start: dueStart,
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
    <BaseModal visible={visible} onClose={onClose} closeButtonHidden fullscreen>
      <div className="flex flex-col h-full md:h-auto -m-6">
        {/* Sticky header */}
        <div className="sticky rounded-t-lg top-0 z-10 bg-gray-50 dark:bg-gray-900 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <BaseIcon
            icon="close"
            onClick={onClose}
            className="fill-gray-700 dark:fill-gray-200"
            wrapperClassName="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
          />
          {/* Segmented: Event / Reminder */}
          <BaseSegmentedControl
            value={mode}
            onChange={setMode}
            options={[
              { value: 'event', label: t('addEvent.event') },
              { value: 'reminder', label: t('addEvent.reminder') },
            ]}
          />
          <BaseIcon
            icon="check"
            onClick={saving ? undefined : handleSave}
            className="stroke-white"
            wrapperClassName={`p-2 rounded-full ${
              saving
                ? 'bg-gray-400'
                : 'bg-btn-primary hover:bg-btn-primary-hover dark:bg-btn-primary-dark dark:hover:bg-btn-primary-hover'
            }`}
          />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 md:flex-none overflow-y-auto p-4 flex flex-col gap-5">
          {error && (
            <p className="text-sm text-error px-1" role="alert">
              {error}
            </p>
          )}

          {/* Title + location (event) or just title (reminder) */}
          <div className={cardClass}>
            <div className={rowClass}>
              <input
                type="text"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('addEvent.eventTitle')}
                className={`${fieldClass} w-full placeholder-gray-400 dark:placeholder-gray-500`}
              />
            </div>
            {mode === 'event' && (
              <div className={`${rowClass} relative flex-col items-stretch`}>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('addEvent.location')}
                  className={`${fieldClass} w-full placeholder-gray-400 dark:placeholder-gray-500`}
                />
                {locationSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-white dark:bg-gray-800 rounded-b-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
                    {locationSuggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          const label = s.admin1
                            ? `${s.name}, ${s.admin1}, ${s.country}`
                            : `${s.name}, ${s.country}`;
                          setLocation(label);
                          setLocationSuggestions([]);
                        }}
                      >
                        {s.name}
                        {s.admin1 ? `, ${s.admin1}` : ''}, {s.country}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date / time section */}
          <div className={cardClass}>
            {mode === 'reminder' && (
              <div className={rowClass}>
                <span className="text-gray-900 dark:text-gray-100">
                  {t('addEvent.dueDate')}
                </span>
                <BaseToggleSwitch value={hasDueDate} onChange={setHasDueDate} />
              </div>
            )}
            <div className={rowClass}>
              <span className="text-gray-900 dark:text-gray-100">
                {t('addEvent.allDay')}
              </span>
              <BaseToggleSwitch value={allDay} onChange={setAllDay} />
            </div>
            {(mode === 'event' || hasDueDate) && (
              <>
                <div className={rowClass}>
                  <span className="text-gray-900 dark:text-gray-100">
                    {mode === 'event' ? t('addEvent.starts') : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowStartPicker(true)}
                    className="flex items-center gap-2 text-primary-dark dark:text-btn-primary text-base md:cursor-pointer"
                  >
                    <span>{formatDateDisplay(startDate, i18n.language)}</span>
                    {!allDay && <span>{startTime}</span>}
                  </button>
                </div>
                {mode === 'event' && (
                  <>
                    <div className={rowClass}>
                      <span className="text-gray-900 dark:text-gray-100">
                        {t('addEvent.ends')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowEndPicker(true)}
                        className="flex items-center gap-2 text-primary-dark dark:text-btn-primary text-base md:cursor-pointer"
                      >
                        <span>{formatDateDisplay(endDate, i18n.language)}</span>
                        {!allDay && <span>{endTime}</span>}
                      </button>
                    </div>
                    {/* Duration pills */}
                    {!allDay && (
                      <div className="overflow-x-auto scrollbar-none px-4 py-3">
                        <div className="flex gap-2 w-max">
                          {DURATIONS.map((min) => (
                            <BaseButton
                              key={min}
                              onClick={() => handleDuration(min)}
                              size="small"
                              outlined
                              className={
                                currentDuration === min
                                  ? 'dark:bg-primary-dark bg-primary-light text-xs! py-1! px-1! w-15!'
                                  : 'text-xs! py-1! px-1! w-15!'
                              }
                            >
                              {durationLabel(min)}
                            </BaseButton>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            <div className={rowClass}>
              <span className="text-gray-900 dark:text-gray-100 shrink-0 flex flex-row items-center gap-1">
                <BaseIcon
                  icon="repeat"
                  size="small"
                  className="dark:stroke-gray-100 stroke-gray-900"
                />
                {t('addEvent.repeat')}
              </span>
              {repeatValue === 'none' ? (
                <BaseSelect
                  fullWidth={false}
                  plain
                  value={repeatValue}
                  onChange={(v) => {
                    if (v === 'custom') {
                      setPrevRepeatValue(repeatValue);
                      setPendingInterval(repeatCustomInterval);
                      setPendingUnit(repeatCustomUnit);
                      setShowCustomRepeat(true);
                    } else {
                      setRepeatValue(v);
                    }
                  }}
                  options={repeatOptions(t)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-900 dark:text-gray-100 text-sm font-medium"
                    onClick={() => {
                      if (repeatValue === 'custom') {
                        setPendingInterval(repeatCustomInterval);
                        setPendingUnit(repeatCustomUnit);
                        setShowCustomRepeat(true);
                      }
                    }}
                  >
                    <span>
                      {repeatDisplayLabel(
                        repeatValue,
                        repeatCustomInterval,
                        repeatCustomUnit,
                        t,
                      )}
                    </span>
                  </button>
                  <BaseIcon
                    icon="close"
                    size="small"
                    className="dark:fill-gray-400 fill-gray-500"
                    wrapperClassName="p-1 rounded-full bg-gray-200 dark:bg-gray-600 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500"
                    onClick={() => {
                      setRepeatValue('none');
                      setRepeatEndMode('none');
                    }}
                  />
                </div>
              )}
            </div>
            <div className={rowClass}>
              <span className="text-gray-900 dark:text-gray-100 shrink-0">
                {t('addEvent.alert')}
              </span>
              {alertValue === 'none' ? (
                <BaseSelect
                  fullWidth={false}
                  plain
                  value={alertValue}
                  onChange={(v) => {
                    if (v === 'customDate') {
                      setShowCustomAlert(true);
                    } else {
                      setAlertValue(v);
                    }
                  }}
                  options={alertOptions(t)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-900 dark:text-gray-100 text-sm font-medium"
                    onClick={() => {
                      if (alertValue === 'customDate') {
                        setShowCustomAlert(true);
                      }
                    }}
                  >
                    <span>{alertLabel}</span>
                  </button>
                  <BaseIcon
                    icon="close"
                    size="small"
                    className="dark:fill-gray-400 fill-gray-500"
                    wrapperClassName="p-1 rounded-full bg-gray-200 dark:bg-gray-600 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500"
                    onClick={() => {
                      setAlertValue('none');
                      setAlertCustomDate('');
                      setAlertValue2('none');
                    }}
                  />
                </div>
              )}
            </div>
            {mode === 'event' && alertValue !== 'none' && (
              <div className={rowClass}>
                <span className="text-gray-900 dark:text-gray-100 shrink-0">
                  {t('addEvent.secondAlert')}
                </span>
                <BaseSelect
                  fullWidth={false}
                  plain
                  value={alertValue2}
                  onChange={setAlertValue2}
                  options={secondAlertOptions(t)}
                />
              </div>
            )}
            {mode === 'event' && (
              <div className={rowClass}>
                <span className="text-gray-900 dark:text-gray-100 shrink-0">
                  {t('addEvent.showAs')}
                </span>
                <BaseSelect
                  fullWidth={false}
                  plain
                  value={availability}
                  onChange={setAvailability}
                  options={showAsOptions(t)}
                />
              </div>
            )}
          </div>

          {/* Calendar account (event only). When editing a device event, the
              "local" pseudo-calendar is excluded — moving a device event to
              app-local storage isn't supported, but switching between device
              calendars is. */}
          {mode === 'event' && (
            <div className={cardClass}>
              <div className={rowClass}>
                <span className="text-gray-900 dark:text-gray-100 shrink-0">
                  {t('addEvent.calendar')}
                </span>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowCalendarPicker(true)}
                  className="flex items-center gap-1 min-w-0 max-w-[65%] text-primary-dark dark:text-btn-primary text-sm disabled:opacity-60"
                >
                  <span className="truncate">
                    {selectedCalendar?.account
                      ? `${selectedCalendar.name} · ${selectedCalendar.account}`
                      : selectedCalendar?.name}
                  </span>
                  <BaseIcon
                    icon="arrowDown"
                    size="xs"
                    className="shrink-0 stroke-primary-dark dark:stroke-btn-primary"
                  />
                </button>
              </div>
            </div>
          )}

          {/* Reminder-only: priority */}
          {mode === 'reminder' && (
            <div className={cardClass}>
              <div className={rowClass}>
                <span className="text-gray-900 dark:text-gray-100 shrink-0">
                  {t('addEvent.priority')}
                </span>
                <BaseSelect
                  fullWidth={false}
                  plain
                  value={priority}
                  onChange={setPriority}
                  options={priorityOptions(t)}
                />
              </div>
            </div>
          )}

          {/* URL + Notes */}
          <div className={cardClass}>
            <div className={rowClass}>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t('addEvent.url')}
                className={`${fieldClass} w-full placeholder-gray-400 dark:placeholder-gray-500`}
              />
            </div>
            <div className="px-4 py-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('addEvent.notes')}
                rows={2}
                className={`${fieldClass} w-full resize-none placeholder-gray-400 dark:placeholder-gray-500`}
              />
            </div>
          </div>

          {!isNativePlatform() && (
            <p className="text-xs text-gray-400 dark:text-gray-500 px-1">
              {t('addEvent.webHint')}
            </p>
          )}
        </div>
      </div>

      {/* Custom Repeat modal — Apple-style wheel picker */}
      <BaseModal
        visible={showCustomRepeat}
        onClose={() => {
          setShowCustomRepeat(false);
          if (repeatValue === 'custom') return;
          setRepeatValue(prevRepeatValue);
        }}
        title={t('addEvent.repeatCustom')}
      >
        <div className="flex flex-col gap-4">
          <p className="text-center text-gray-900 dark:text-gray-100 text-sm">
            {pendingInterval}{' '}
            {t(
              `addEvent.repeatUnit${pendingUnit.charAt(0).toUpperCase() + pendingUnit.slice(1)}`,
            )}
          </p>
          <BaseWheelPicker
            mode="custom"
            columns={[
              {
                key: 'interval',
                items: Array.from({ length: 30 }, (_, i) => ({
                  value: i + 1,
                  label: `${i + 1}`,
                })),
                value: pendingInterval,
                onChange: setPendingInterval,
              },
              {
                key: 'unit',
                items: ['day', 'week', 'month', 'year'].map((u) => ({
                  value: u,
                  label: t(
                    `addEvent.repeatUnit${u.charAt(0).toUpperCase() + u.slice(1)}`,
                  ),
                })),
                value: pendingUnit,
                onChange: setPendingUnit,
              },
            ]}
          />
          <BaseButton
            onClick={() => {
              setRepeatCustomInterval(pendingInterval);
              setRepeatCustomUnit(pendingUnit);
              setRepeatValue('custom');
              setShowCustomRepeat(false);
            }}
          >
            {t('settings.done')}
          </BaseButton>
        </div>
      </BaseModal>

      {/* Custom Alert Date modal */}
      <BaseModal
        visible={showCustomAlert}
        onClose={() => setShowCustomAlert(false)}
        title={t('addEvent.alertCustomDate')}
      >
        <div className="flex flex-col gap-4">
          <BaseWheelPicker
            mode="date"
            value={fromInputs(alertCustomDate, '00:00')}
            onChange={(d) => setAlertCustomDate(toDateInput(d))}
          />
          <BaseButton
            onClick={() => {
              if (alertCustomDate) setAlertValue('customDate');
              setShowCustomAlert(false);
            }}
          >
            {t('settings.done')}
          </BaseButton>
        </div>
      </BaseModal>

      {/* End Repeat modal */}
      <BaseModal
        visible={showEndRepeat}
        onClose={() => setShowEndRepeat(false)}
        title={t('addEvent.endRepeat')}
      >
        <div className="flex flex-col gap-1">
          <button
            type="button"
            className={`w-full text-left px-4 py-3 rounded-lg text-base ${
              pendingEndMode === 'date'
                ? 'font-medium text-gray-900 dark:text-gray-100'
                : 'text-gray-900 dark:text-gray-100'
            }`}
            onClick={() => setPendingEndMode('date')}
          >
            {t('addEvent.endRepeatOnDate')}
          </button>
          {pendingEndMode === 'date' && (
            <div className="px-4 pb-3">
              <BaseWheelPicker
                mode="date"
                value={fromInputs(pendingEndDate, '00:00')}
                onChange={(d) => setPendingEndDate(toDateInput(d))}
              />
            </div>
          )}
          <button
            type="button"
            className={`w-full text-left px-4 py-3 rounded-lg text-base ${
              pendingEndMode === 'count'
                ? 'font-medium text-gray-900 dark:text-gray-100'
                : 'text-gray-900 dark:text-gray-100'
            }`}
            onClick={() => setPendingEndMode('count')}
          >
            {t('addEvent.endRepeatAfterCount')}
          </button>
          {pendingEndMode === 'count' && (
            <div className="px-4 pb-3">
              <BaseWheelPicker
                mode="number"
                numberMin={1}
                numberMax={50}
                value={pendingEndCount}
                onChange={setPendingEndCount}
              />
            </div>
          )}
          <div className="px-4 pt-2">
            <BaseButton onClick={commitEndRepeat}>
              {t('settings.done')}
            </BaseButton>
          </div>
        </div>
      </BaseModal>

      {/* Calendar picker — custom list so Android's native <select> popup
          (oversized system font, uncontrollable via CSS) is never shown. */}
      <BaseModal
        visible={showCalendarPicker}
        onClose={() => setShowCalendarPicker(false)}
        title={t('addEvent.calendar')}
      >
        <div className="flex flex-col gap-1">
          {(editEvent?.sourceType === 'device'
            ? calendars.filter((c) => c.id !== 'local')
            : calendars
          ).map((c) => (
            <button
              key={c.id}
              type="button"
              className="w-full flex items-center justify-between gap-2 text-left px-4 py-3 rounded-lg text-gray-900 dark:text-gray-100"
              onClick={() => {
                setCalendarId(c.id);
                setShowCalendarPicker(false);
              }}
            >
              <span className="truncate">
                {c.account ? `${c.name} · ${c.account}` : c.name}
              </span>
              {c.id === calendarId && (
                <BaseIcon
                  icon="check"
                  size="small"
                  className="shrink-0 stroke-primary-dark dark:stroke-btn-primary"
                />
              )}
            </button>
          ))}
        </div>
      </BaseModal>

      {/* Start date/time picker */}
      <BaseModal
        visible={showStartPicker}
        onClose={() => setShowStartPicker(false)}
        title={t('addEvent.starts')}
      >
        <div className="flex flex-col gap-4">
          <BaseWheelPicker
            mode={allDay ? 'date' : 'datetime'}
            value={fromInputs(startDate, startTime)}
            onChange={(d) => {
              setStartDate(toDateInput(d));
              setStartTime(toTimeInput(d));
            }}
          />
          <BaseButton onClick={() => setShowStartPicker(false)}>
            {t('settings.done')}
          </BaseButton>
        </div>
      </BaseModal>

      {/* End date/time picker */}
      <BaseModal
        visible={showEndPicker}
        onClose={() => setShowEndPicker(false)}
        title={t('addEvent.ends')}
      >
        <div className="flex flex-col gap-4">
          <BaseWheelPicker
            mode={allDay ? 'date' : 'datetime'}
            value={fromInputs(endDate, endTime)}
            onChange={(d) => {
              setEndDate(toDateInput(d));
              setEndTime(toTimeInput(d));
            }}
          />
          <BaseButton onClick={() => setShowEndPicker(false)}>
            {t('settings.done')}
          </BaseButton>
        </div>
      </BaseModal>
    </BaseModal>
  );
}
