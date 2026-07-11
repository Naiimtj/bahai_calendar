import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal, BaseButton, BaseIcon } from './base';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import { useSettings } from '../context/SettingsContext';
import { hour12Option } from '../utils/timeFormat';
import AddEventModal, {
  alertOptions,
  repeatDisplayLabel,
} from './AddEventModal';

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
  const { t } = useTranslation();
  const { settings } = useSettings();
  const {
    removeLocalEventAndRefresh,
    removeDeviceEventAndRefresh,
    removeDeviceReminderAndRefresh,
  } = usePersonalEvents();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  if (!visible || !event) return null;

  const raw = event._raw;
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

  const dateStr = startDate
    ? startDate.toLocaleDateString(undefined, dateOpts)
    : '';
  const startTimeStr =
    startDate && !raw?.allDay ? startDate.toLocaleTimeString([], timeOpts) : '';
  const endTimeStr =
    endDate && !raw?.allDay ? endDate.toLocaleTimeString([], timeOpts) : '';

  const repeatLabel = getRepeatLabel(raw, t);
  const alertLabel = getAlertLabel(raw, t);

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
            <BaseIcon
              icon="arrowLeft"
              size="md"
              onClick={onClose}
              className="hover:stroke-primary stroke-primary-dark dark:stroke-gray-300 dark:hover:stroke-white cursor-pointer"
            />
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
            <p className="capitalize">{dateStr}</p>
            {startTimeStr && (
              <p>
                {startTimeStr}
                {endTimeStr ? `, ${endTimeStr}` : ''}
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
  const gridStart = Math.floor(startHour) - 1;
  const gridEnd = Math.ceil(endHour) + 1;
  const hours = [];
  for (let h = gridStart; h <= gridEnd; h++) {
    hours.push(h);
  }
  const totalRange = gridEnd - gridStart;

  const pad = (n) => String(n).padStart(2, '0');
  const timeLabel = `${pad(start.getHours())}:${pad(start.getMinutes())} \u2013 ${pad(end.getHours())}:${pad(end.getMinutes())}`;

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800/60 p-4 relative h-25 overflow-y-auto">
      <div className="relative" style={{ height: `${hours.length * 2}rem` }}>
        {hours.map((h) => (
          <div
            key={h}
            className="absolute left-0 right-0 flex items-center"
            style={{
              top: `${((h - gridStart) / totalRange) * 100}%`,
              transform: 'translateY(-50%)',
            }}
          >
            <span className="text-xs text-gray-400 w-12 shrink-0">
              {`${pad(h)}:00`}
            </span>
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
          </div>
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
          <div className="opacity-80">{timeLabel}</div>
        </div>
      </div>
    </div>
  );
}
