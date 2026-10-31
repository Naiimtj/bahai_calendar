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

const dayButtonBase =
  'flex aspect-square w-full max-w-10 items-center justify-center rounded-full text-xl transition-colors md:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark';
const monthYearButtonBase =
  'rounded-xl py-2.5 text-base capitalize transition-colors md:cursor-pointer';

/**
 * Apple-style month-grid calendar. Tap the header to zoom out to
 * month → year selection. Preserves the time portion of `value` on change.
 *
 * value/onChange use `Date`.
 */
export default function BaseCalendarPicker({ value, onChange }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || undefined;

  const selected = useMemo(
    () =>
      value instanceof Date && !Number.isNaN(value.getTime())
        ? value
        : new Date(),
    [value],
  );
  const today = new Date();

  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const [viewMode, setViewMode] = useState('days');

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
      fmt.format(new Date(2020, 5, 1 + i)).replace(/\.$/, ''),
    );
  }, [locale]);

  const dayAriaLabelFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'full' }),
    [locale],
  );

  const monthYearFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  );

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
    days: (() => {
      const full = monthYearFormatter.format(new Date(viewYear, viewMonth, 1));
      if (!full) return full;
      return full.charAt(0).toLocaleUpperCase(locale) + full.slice(1);
    })(),
    months: `${viewYear}`,
    years: `${yearRangeStart} \u2013 ${yearRangeStart + 11}`,
  }[viewMode];

  const canNavigate = viewMode !== 'months';

  return (
    <div className="select-none w-full">
      <div className="flex items-center justify-between gap-2 mb-2">
        <button
          type="button"
          aria-expanded={viewMode !== 'days'}
          onClick={() => setViewMode(NEXT_VIEW_MODE[viewMode])}
          className="flex items-center gap-1 rounded-lg py-1 text-[17px] font-semibold text-gray-900 transition-opacity active:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark dark:text-gray-100"
        >
          <span>{headerLabel}</span>
          <BaseIcon
            icon="arrowRight"
            size="small"
            strokeWidth={2.5}
            className={`stroke-primary-dark transition-transform duration-200 dark:stroke-btn-primary ${viewMode === 'days' ? 'rtl:rotate-180' : 'rotate-90'}`}
          />
        </button>

        <div
          className={`flex items-center gap-1 ${canNavigate ? '' : 'invisible'}`}
        >
          <BaseIcon
            icon="arrowLeft"
            size="large"
            strokeWidth={2.5}
            aria-label={t('calendar.previous')}
            onClick={canNavigate ? handlePrev : undefined}
            className="stroke-primary-dark dark:stroke-btn-primary rtl:rotate-180"
            wrapperClassName="flex h-10 w-10 items-center justify-center rounded-full transition-colors active:bg-gray-100 md:hover:bg-gray-100 dark:active:bg-gray-700/60 dark:md:hover:bg-gray-700/60"
          />
          <BaseIcon
            icon="arrowRight"
            size="large"
            strokeWidth={2.5}
            aria-label={t('calendar.next')}
            onClick={canNavigate ? handleNext : undefined}
            className="stroke-primary-dark dark:stroke-btn-primary rtl:rotate-180"
            wrapperClassName="flex h-10 w-10 items-center justify-center rounded-full transition-colors active:bg-gray-100 md:hover:bg-gray-100 dark:active:bg-gray-700/60 dark:md:hover:bg-gray-700/60"
          />
        </div>
      </div>

      {viewMode === 'days' && (
        <>
          <div className="grid grid-cols-7 mb-1">
            {weekdayHeaders.map((w) => (
              <span
                key={w}
                className="py-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
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
                  aria-label={dayAriaLabelFormatter.format(
                    new Date(viewYear, viewMonth, day),
                  )}
                  aria-pressed={isSameDay(day)}
                  aria-current={isTodayCell(day) ? 'date' : undefined}
                  className={`${dayButtonBase} ${
                    isSameDay(day)
                      ? 'bg-btn-primary-dark font-semibold text-white'
                      : isTodayCell(day)
                        ? 'font-semibold text-primary-dark active:bg-gray-100 dark:text-btn-primary dark:active:bg-gray-700/60'
                        : 'text-gray-900 active:bg-gray-100 md:hover:bg-gray-100 dark:text-gray-100 dark:active:bg-gray-700/60 dark:md:hover:bg-gray-700/60'
                  }`}
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
              className={`${monthYearButtonBase} ${
                i === viewMonth
                  ? 'bg-btn-primary-dark font-semibold text-white'
                  : 'text-gray-900 active:bg-gray-100 md:hover:bg-gray-100 dark:text-gray-100 dark:active:bg-gray-700/60 dark:md:hover:bg-gray-700/60'
              }`}
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
                className={`${monthYearButtonBase} ${
                  year === viewYear
                    ? 'bg-btn-primary-dark font-semibold text-white'
                    : 'text-gray-900 active:bg-gray-100 md:hover:bg-gray-100 dark:text-gray-100 dark:active:bg-gray-700/60 dark:md:hover:bg-gray-700/60'
                }`}
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
