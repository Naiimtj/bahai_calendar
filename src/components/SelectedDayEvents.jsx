import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseButton, BaseCheckbox } from './base';
import { useSettings } from '../context/SettingsContext';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import { formatClockTime } from '../utils/timeFormat';
import EventDetailModal from './EventDetailModal';
import BadiEventDetailModal from './BadiEventDetailModal';

/**
 * Reusable selected-day events list used by all calendar views.
 *
 * Props:
 *   events   – array of { color, name, suspend?, desc?, _raw? }
 *   density  – calendarDensity setting (used to show "no events" in lista mode)
 *   className – extra classes applied to the outer wrapper (e.g. "mt-4")
 *   header   – optional node rendered above the event list (used by GregorianCalendar)
 */
export default function SelectedDayEvents({
  events,
  className = '',
  header = null,
}) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { toggleReminderCompleted } = usePersonalEvents();
  const [detailEvent, setDetailEvent] = useState(null);
  const [badiDetailEvent, setBadiDetailEvent] = useState(null);
  const [completionOverrides, setCompletionOverrides] = useState({});

  const reminders = events.filter((ev) => ev._raw?.isReminder);
  const normalEvents = events.filter((ev) => !ev._raw?.isReminder);

  const handleReminderToggle = (raw, next) => {
    if (raw?.id) {
      setCompletionOverrides((prev) => ({ ...prev, [raw.id]: next }));
    }
    toggleReminderCompleted(raw, next);
  };

  const handleEventTap = (ev) => {
    if (ev._raw) setDetailEvent(ev);
    else if (ev.desc || ev.time_note || ev.url) setBadiDetailEvent(ev);
  };

  const formatTime = (d) => formatClockTime(d, settings.timeFormat);

  const eventTimes = (ev) => {
    const raw = ev._raw;
    if (!raw || raw.allDay || !raw.start) return null;
    const start = formatTime(raw.start);
    const end = raw.end ? formatTime(raw.end) : null;
    return { start, end };
  };

  return (
    <div
      className={`border-t mb-20 md:mb-0 border-gray-200 dark:border-gray-800 ${className}`}
    >
      {header}
      {normalEvents.length > 0
        ? normalEvents.map((ev, i) => {
            const colorStyle = ev.color?.startsWith('#')
              ? { backgroundColor: ev.color }
              : undefined;
            const bgColor = ev.color?.startsWith('#') ? '' : ev.color;
            const textColors = {
              'bg-gold-500': 'text-amber-600',
              'bg-primary': 'text-primary-dark',
              'bg-blue-400': 'text-blue-400',
            };
            const colorTextTimeNote =
              ev.time_note && !ev.sourceType ? textColors[bgColor] : null;
            return (
              <div
                key={ev._raw?.id || i}
                className="border-t border-gray-100 dark:border-gray-800/50"
              >
                <BaseButton
                  outlined
                  onClick={() => handleEventTap(ev)}
                  className={`!border-none !bg-transparent !shadow-none !backdrop-blur-none md:hover:!bg-primary-light/30 !flex !items-start !justify-start !gap-3 !rounded-none px-4 py-2.5 w-full text-left ${ev._raw || ev.desc ? 'cursor-pointer' : ''}`}
                >
                  <span
                    className={`w-1 self-stretch rounded-full mt-0.5 ${bgColor}`}
                    style={colorStyle}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-base text-gray-900 dark:text-gray-100">
                      {ev.name}
                    </div>
                    {colorTextTimeNote && (
                      <div
                        className={`text-xs mt-0.5 italic ${colorTextTimeNote}`}
                      >
                        {ev.time_note}
                      </div>
                    )}
                    {ev.suspend && (
                      <div className="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
                        {t('calendar.workSuspended')}
                      </div>
                    )}
                  </div>
                  {(() => {
                    const times = eventTimes(ev);
                    if (!times) return null;
                    return (
                      <div className="shrink-0 flex flex-col items-end text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                        <span>{times.start}</span>
                        {times.end && <span>{times.end}</span>}
                      </div>
                    );
                  })()}
                </BaseButton>
              </div>
            );
          })
        : null}
      {reminders.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800/50">
          <div className="px-4 pt-2.5 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {t('calendar.reminders')}
          </div>
          {reminders.map((ev, i) => {
            const raw = ev._raw;
            const id = raw?.id || `reminder-${i}`;
            const completed =
              completionOverrides[id] ?? raw?.isCompleted ?? false;
            const colorStyle = ev.color?.startsWith('#')
              ? { backgroundColor: ev.color }
              : undefined;
            const bgColor = ev.color?.startsWith('#') ? '' : ev.color;
            return (
              <div
                key={id}
                className="flex items-center gap-3 px-4 border-t border-gray-100 dark:border-gray-800/50"
              >
                <BaseCheckbox
                  checked={completed}
                  onChange={(next) => handleReminderToggle(raw, next)}
                  size="small"
                  aria-label={t('calendar.markComplete')}
                />
                <BaseButton
                  outlined
                  onClick={() => handleEventTap(ev)}
                  className={`!border-none !bg-transparent !shadow-none !backdrop-blur-none md:hover:!bg-primary-light/30 !flex !items-center !justify-start !gap-3 !rounded-none px-4 py-2.5 w-full text-left ${ev._raw || ev.desc ? 'cursor-pointer' : ''}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${bgColor}`}
                    style={colorStyle}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium text-base ${completed ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'}`}
                    >
                      {ev.name}
                    </div>
                    {ev.time_note && (
                      <div className="text-sm mt-0.5 text-gray-500 dark:text-gray-400">
                        {ev.time_note}
                      </div>
                    )}
                  </div>
                </BaseButton>
              </div>
            );
          })}
        </div>
      )}
      {events.length === 0 && (
        <div className="px-4 py-3 text-lg text-gray-400 dark:text-gray-600">
          {t('calendar.noEvents')}
        </div>
      )}

      <EventDetailModal
        visible={!!detailEvent}
        event={detailEvent}
        onClose={() => setDetailEvent(null)}
      />
      <BadiEventDetailModal
        visible={!!badiDetailEvent}
        event={badiDetailEvent}
        onClose={() => setBadiDetailEvent(null)}
      />
    </div>
  );
}
