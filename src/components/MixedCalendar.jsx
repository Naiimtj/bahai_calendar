import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useBadiYear } from '../context/BadiYearContext';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import YearView from './YearView';
import BadiYearView from './BadiYearView';
import CalendarHeader from './CalendarHeader';
import CalendarBottomBar from './CalendarBottomBar';
import { useSwipe } from '../hooks/useSwipe';
import { getWeekNumber } from '../utils/weekNumber';
import CellEventDetails from './CellEventDetails';
import SelectedDayEvents from './SelectedDayEvents';
import {
  getMonthName,
  getGregorianMonthName,
  formatBadiSecondaryDate,
  reorderWeekdays,
  getFirstDayColumn,
} from '../lib/badiDate';
import BaseSpinner from './base/BaseSpinner';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export default function MixedCalendar({ onMenuClick }) {
  const { settings, lang, effectiveToday } = useSettings();
  const { t } = useTranslation();
  const {
    gregorianToBadi,
    badiToGregorian,
    getHolyDayForDate,
    isRidvanPeriod,
    loadYearsAround,
    loading,
    allMonthStarts,
    allEvents,
  } = useBadiYear();
  const { eventsForDate } = usePersonalEvents();
  const showWeekNums = settings.showWeekNumbers;
  const density = settings.calendarDensity || 'compacta';
  const today = effectiveToday;
  const [userYear, setUserYear] = useState(null);
  const [userMonth, setUserMonth] = useState(null);
  const viewYear = userYear ?? today.getFullYear();
  const viewMonth = userMonth ?? today.getMonth();
  const [selectedDate, setSelectedDate] = useState(today);
  const [showYear, setShowYear] = useState(false);
  const [yearViewMode, setYearViewMode] = useState('gregorian');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadYearsAround(viewYear);
  }, [viewYear, loadYearsAround]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const gregFirstDay = new Date(viewYear, viewMonth, 1).getDay();
  const firstDay = getFirstDayColumn(gregFirstDay, settings.weekStart);
  const rawHeaders = t('weekdaysMin', { returnObjects: true });
  const headers = reorderWeekdays(rawHeaders, settings.weekStart);
  const monthName = getGregorianMonthName(viewMonth, lang);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setUserMonth(11);
      setUserYear(viewYear - 1);
    } else {
      setUserMonth(viewMonth - 1);
    }
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setUserMonth(0);
      setUserYear(viewYear + 1);
    } else {
      setUserMonth(viewMonth + 1);
    }
  };
  const goToday = () => {
    setUserYear(null);
    setUserMonth(null);
    setSelectedDate(today);
  };

  const cells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const badi = gregorianToBadi(date);
      const holyDay = getHolyDayForDate(date);
      const ridvan = isRidvanPeriod(date);
      const isToday =
        d === today.getDate() &&
        viewMonth === today.getMonth() &&
        viewYear === today.getFullYear();
      arr.push({ day: d, date, badi, holyDay, ridvan, isToday });
    }
    return arr;
  }, [
    viewYear,
    viewMonth,
    firstDay,
    daysInMonth,
    today,
    gregorianToBadi,
    getHolyDayForDate,
    isRidvanPeriod,
  ]);

  // Group cells into weeks
  const weeks = useMemo(() => {
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      const row = cells.slice(i, i + 7);
      while (row.length < 7) row.push(null);
      const firstCellInRow = row.find((c) => c !== null);
      const weekNum = firstCellInRow
        ? getWeekNumber(firstCellInRow.date)
        : null;
      rows.push({ weekNum, cells: row });
    }
    return rows;
  }, [cells]);

  // Bahá'í year for the middle of the viewed month
  const midMonthBadi = gregorianToBadi(new Date(viewYear, viewMonth, 15));

  // Gather events for a single cell (used by detalles)
  const getCellEvents = (cell) => {
    if (!cell) return [];
    const evs = [];
    if (cell.holyDay) {
      evs.push({
        color: 'bg-gold-500',
        name: cell.holyDay[lang] || cell.holyDay.en,
      });
    }
    if (cell.ridvan && !cell.holyDay) {
      evs.push({
        color: 'bg-primary',
        name: 'Riḍván',
      });
    }
    const isMonthStart =
      cell.badi &&
      cell.badi.day === 1 &&
      cell.badi.month >= 1 &&
      cell.badi.month <= 19;
    if (isMonthStart) {
      evs.push({
        color: 'bg-blue-400',
        name: t('calendar.feastShort', {
          name: getMonthName(cell.badi.month, 'ar'),
        }),
      });
    }
    evs.push(...eventsForDate(cell.date));
    return evs;
  };

  // Selected day events (for lista mode)
  const selectedEvents = useMemo(() => {
    const d = selectedDate || today;
    const badi = gregorianToBadi(d);
    const holyDay = getHolyDayForDate(d);
    const evs = [];
    if (holyDay) {
      evs.push({
        color: 'bg-gold-500',
        name: holyDay[lang] || holyDay.en,
        suspend: holyDay.suspend,
        desc: holyDay.desc || '',
        time_note: holyDay.time_note || '',
        url: holyDay.url || '',
      });
    }
    if (isRidvanPeriod(d) && !holyDay) {
      const ridvanEv = allEvents.find(
        (e) => e.badi_month === 2 && e.badi_day === 13,
      );
      evs.push({
        color: 'bg-primary',
        name: 'Riḍván',
        desc: ridvanEv?.desc || '',
        url: ridvanEv?.url || '',
      });
    }
    if (badi && badi.day === 1 && badi.month >= 1 && badi.month <= 19) {
      const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const monthEntry = allMonthStarts.find(
        (m) => m.badiMonth === badi.month && m.start.getTime() === d0.getTime(),
      );
      evs.push({
        color: 'bg-blue-400',
        name: t('calendar.feast', { name: getMonthName(badi.month, 'ar') }),
        desc: monthEntry?.desc || '',
        time_note: monthEntry?.info || '',
      });
    }
    evs.push(...eventsForDate(d));
    return evs;
  }, [
    selectedDate,
    lang,
    isRidvanPeriod,
    t,
    eventsForDate,
    allMonthStarts,
    allEvents,
    today,
    gregorianToBadi,
    getHolyDayForDate,
  ]);

  const swipeHandlers = useSwipe(nextMonth, prevMonth);
  const gridCols = showWeekNums
    ? 'grid-cols-[2rem_repeat(7,1fr)]'
    : 'grid-cols-7';

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center">
        <BaseSpinner />
      </div>
    );

  if (showYear) {
    if (yearViewMode === 'badi') {
      const badiYearForView =
        gregorianToBadi(new Date(viewYear, 5, 1))?.year ?? viewYear;
      return (
        <BadiYearView
          badiYear={badiYearForView}
          onSelectMonth={(monthNum) => {
            const gregDate = badiToGregorian(badiYearForView, monthNum, 1);
            setUserYear(gregDate.getFullYear());
            setUserMonth(gregDate.getMonth());
            setShowYear(false);
          }}
          onBack={() => setShowYear(false)}
          onToggle={() => setYearViewMode('gregorian')}
          onYearChange={(y) => {
            const g = badiToGregorian(y, 1, 1);
            setUserYear(g.getFullYear());
          }}
          onToday={() => setUserYear(null)}
        />
      );
    }
    return (
      <YearView
        year={viewYear}
        onSelectMonth={(m) => {
          setUserMonth(m);
          setShowYear(false);
        }}
        onBack={() => setShowYear(false)}
        onToggle={() => setYearViewMode('badi')}
        onYearChange={(y) => setUserYear(y)}
        onToday={() => setUserYear(null)}
      />
    );
  }

  // Flat list of all cells (for border logic)
  const flatCells = weeks.flatMap((w) => w.cells);

  return (
    <div className="relative flex flex-col h-full">
      <CalendarHeader
        yearLabel={String(viewYear)}
        monthName={monthName}
        centerLabel={midMonthBadi ? `${midMonthBadi.year} B.E.` : ''}
        onYearClick={() => setShowYear(true)}
        onPrev={prevMonth}
        onNext={nextMonth}
        showSearch={showSearch}
        onToggleSearch={() => setShowSearch((v) => !v)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMenuClick={onMenuClick}
        onSelectDate={(date) => {
          setUserYear(date.getFullYear());
          setUserMonth(date.getMonth());
          setSelectedDate(date);
        }}
      />

      {/* Weekday headers */}
      <div className={`grid ${gridCols} px-2`}>
        {showWeekNums && <div />}
        {headers.map((h, i) => (
          <div
            key={i}
            className="text-center text-xs font-medium text-gray-500 py-1"
          >
            {h}
          </div>
        ))}
      </div>

      {/* Day grid — swipeable on mobile */}
      <div className="flex-1" {...swipeHandlers}>
        {weeks.map((week, wi) => {
          const rowStartIdx = wi * 7;
          return (
            <div
              key={wi}
              className={`grid ${gridCols} px-2 border-t border-gray-100 dark:border-gray-800/50`}
            >
              {showWeekNums && (
                <div
                  className={`flex items-start justify-center pt-2 text-[10px] text-gray-300 dark:text-gray-700`}
                >
                  {week.weekNum}
                </div>
              )}

              {week.cells.map((cell, ci) => {
                if (!cell) return <div key={`e-${ci}`} />;
                const flatIdx = rowStartIdx + ci;
                const isSelected =
                  selectedDate?.getTime() === cell.date.getTime();
                const isMonthStart =
                  cell.badi &&
                  cell.badi.day === 1 &&
                  cell.badi.month >= 1 &&
                  cell.badi.month <= 19;

                // Badí' month border
                const refDate = selectedDate || today;
                const refBadi = gregorianToBadi(refDate);
                const isCurrentBadiMonth =
                  cell.badi?.month === refBadi?.month &&
                  cell.badi?.year === refBadi?.year;

                const prev = flatIdx > 0 ? flatCells[flatIdx - 1] : null;
                const next =
                  flatIdx < flatCells.length - 1
                    ? flatCells[flatIdx + 1]
                    : null;
                const isFirstInGroup =
                  (!prev && cell.badi?.day === 1) ||
                  (prev != null &&
                    (prev.badi?.month !== cell.badi?.month ||
                      prev.badi?.year !== cell.badi?.year));
                const isLastInGroup = (() => {
                  if (next != null) {
                    return (
                      next.badi?.month !== cell.badi?.month ||
                      next.badi?.year !== cell.badi?.year
                    );
                  }
                  const dayAfter = new Date(cell.date);
                  dayAfter.setDate(dayAfter.getDate() + 1);
                  const dayAfterBadi = gregorianToBadi(dayAfter);
                  return (
                    dayAfterBadi?.month !== cell.badi?.month ||
                    dayAfterBadi?.year !== cell.badi?.year
                  );
                })();

                const borderColor = isCurrentBadiMonth
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 dark:border-gray-600';

                const borderClasses =
                  cell.badi &&
                  [
                    'border-t',
                    'border-b',
                    borderColor,
                    isFirstInGroup ? 'border-l rounded-l-lg' : '',
                    isLastInGroup ? 'border-r rounded-r-lg' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                return (
                  <button
                    key={cell.day}
                    onClick={() =>
                      setSelectedDate((prev) =>
                        prev?.getTime() === cell.date.getTime() &&
                        density !== 'lista'
                          ? null
                          : cell.date,
                      )
                    }
                    className={`relative flex flex-col items-center transition-colors cursor-pointer md:hover:bg-gray-100 md:dark:hover:bg-gray-800 ${borderClasses} ${
                      density === 'detalles'
                        ? 'py-0.5 min-h-18 overflow-hidden min-w-0 w-full'
                        : 'py-0.5'
                    }`}
                  >
                    {/* NUMBER */}
                    <span
                      className={`md:w-8 md:h-8 h-6 w-6 flex items-center justify-center rounded-full text-sm font-medium
                        ${cell.isToday ? 'bg-red-500 text-white' : ''}
                        ${isSelected && !cell.isToday ? 'bg-gray-300 dark:bg-gray-600' : ''}
                        ${cell.holyDay && !cell.isToday && !isSelected ? 'text-gold-500' : ''}
                      `}
                    >
                      {cell.day}
                    </span>
                    {cell.badi && (
                      <span
                        className={`text-[9px] leading-tight ${cell.holyDay ? 'text-gold-500' : 'text-gray-400 dark:text-gray-500'}`}
                      >
                        {formatBadiSecondaryDate(
                          cell.badi.month,
                          cell.badi.day,
                          settings.secondaryFormat,
                        )}
                      </span>
                    )}

                    {/* Compacta & Lista: dots */}
                    {cell.badi &&
                      (density === 'compacta' || density === 'lista') && (
                        <div className="flex gap-0.5 mb-1">
                          {cell.holyDay && (
                            <span className="w-1 h-1 rounded-full bg-gold-500" />
                          )}
                          {cell.ridvan && !cell.holyDay && (
                            <span className="w-1 h-1 rounded-full bg-primary" />
                          )}
                          {isMonthStart && (
                            <span className="w-1 h-1 rounded-full bg-blue-400" />
                          )}
                          {eventsForDate(cell.date).map((ev, pi) => (
                            <span
                              key={`p-${pi}`}
                              className="w-1 h-1 rounded-full"
                              style={{ backgroundColor: ev.color }}
                            />
                          ))}
                        </div>
                      )}

                    {/* Detalles: event text */}
                    {density === 'detalles' && (
                      <CellEventDetails
                        events={getCellEvents(cell)}
                        fontSize="text-[7px] md:text-xs mt-1"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
        {/* Selected day info */}
        {selectedDate &&
          (density === 'lista' || selectedEvents.length >= 0) && (
            <SelectedDayEvents
              events={selectedEvents}
              density={density}
              className="mt-4"
            />
          )}
      </div>

      <CalendarBottomBar onToday={goToday} />
    </div>
  );
}
