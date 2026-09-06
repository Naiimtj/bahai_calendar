import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import BaseIcon from './BaseIcon';

const NEXT_VIEW_MODE = { days: 'months', months: 'years', years: 'months' };

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Monday-first weekday index (0 = Monday … 6 = Sunday).
function getFirstDayOfWeek(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

const cellBase =
  'w-9 h-9 rounded-full text-sm transition-colors md:cursor-pointer flex items-center justify-center';
const gridButtonBase =
  'py-2 rounded-lg text-sm capitalize transition-colors md:cursor-pointer';

function stateClass(isSelected, isToday) {
  if (isSelected) return 'bg-btn-primary text-white font-semibold';
  if (isToday)
    return 'border border-btn-primary text-primary-dark dark:text-btn-primary font-medium';
  return 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800';
}

/**
 * Apple-style month-grid calendar. Tap the header to zoom out to
 * month → year selection. Preserves the time portion of `value` on change.
 *
 * value/onChange use `Date`.
 */
export default function BaseCalendarPicker({ value, onChange }) {
  const { i18n } = useTranslation();
  const locale = i18n.language || undefined;

  const selected =
    value instanceof Date && !Number.isNaN(value.getTime())
      ? value
      : new Date();
  const today = new Date();

  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const [viewMode, setViewMode] = useState('days');

  const monthNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'long' });
    return Array.from({ length: 12 }, (_, i) =>
      fmt.format(new Date(2020, i, 1)),
    );
  }, [locale]);

  const monthShortNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'short' });
    return Array.from({ length: 12 }, (_, i) =>
      fmt.format(new Date(2020, i, 1)).replace('.', ''),
    );
  }, [locale]);

  const weekdayHeaders = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    // 2020-06-01 is a Monday.
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(2020, 5, 1 + i)),
    );
  }, [locale]);

  const emitDay = useCallback(
    (day) => {
      const next = new Date(selected);
      next.setFullYear(viewYear, viewMonth, day);
      onChange(next);
    },
    [selected, viewYear, viewMonth, onChange],
  );

  const yearRangeStart = viewYear - 6;

  const handlePrev = () => {
    if (viewMode === 'days') {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear((y) => y - 1);
      } else {
        setViewMonth((m) => m - 1);
      }
    } else if (viewMode === 'years') {
      setViewYear((y) => y - 12);
    }
  };

  const handleNext = () => {
    if (viewMode === 'days') {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear((y) => y + 1);
      } else {
        setViewMonth((m) => m + 1);
      }
    } else if (viewMode === 'years') {
      setViewYear((y) => y + 12);
    }
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const isSameDay = (d) =>
    selected.getFullYear() === viewYear &&
    selected.getMonth() === viewMonth &&
    selected.getDate() === d;
  const isTodayCell = (d) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === d;

  const headerLabel = {
    days: `${monthNames[viewMonth]} ${viewYear}`,
    months: `${viewYear}`,
    years: `${yearRangeStart} \u2013 ${yearRangeStart + 11}`,
  }[viewMode];

  const canNavigate = viewMode !== 'months';

  return (
    <div className="select-none w-full">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-3">
        <BaseIcon
          icon="arrowLeft"
          size="small"
          onClick={canNavigate ? handlePrev : undefined}
          className={`stroke-gray-500 dark:stroke-gray-400 hover:stroke-primary-dark ${
            canNavigate ? '' : 'opacity-0 pointer-events-none'
          }`}
        />
        <button
          type="button"
          onClick={() => setViewMode(NEXT_VIEW_MODE[viewMode])}
          className="text-base font-semibold text-gray-900 dark:text-gray-100 capitalize px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 md:cursor-pointer"
        >
          {headerLabel}
        </button>
        <BaseIcon
          icon="arrowRight"
          size="small"
          onClick={canNavigate ? handleNext : undefined}
          className={`stroke-gray-500 dark:stroke-gray-400 hover:stroke-primary-dark ${
            canNavigate ? '' : 'opacity-0 pointer-events-none'
          }`}
        />
      </div>

      {viewMode === 'days' && (
        <>
          <div className="grid grid-cols-7 mb-1">
            {weekdayHeaders.map((w) => (
              <span
                key={w}
                className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 capitalize py-1"
              >
                {w}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1 justify-items-center">
            {Array.from({ length: firstDay }, (_, i) => (
              <span key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => emitDay(day)}
                  className={`${cellBase} ${stateClass(isSameDay(day), isTodayCell(day))}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </>
      )}

      {viewMode === 'months' && (
        <div className="grid grid-cols-3 gap-2">
          {monthShortNames.map((m, i) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setViewMonth(i);
                setViewMode('days');
              }}
              className={`${gridButtonBase} ${stateClass(i === viewMonth, false)}`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {viewMode === 'years' && (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }, (_, i) => {
            const year = yearRangeStart + i;
            return (
              <button
                key={year}
                type="button"
                onClick={() => {
                  setViewYear(year);
                  setViewMode('months');
                }}
                className={`${gridButtonBase} ${stateClass(year === viewYear, false)}`}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
