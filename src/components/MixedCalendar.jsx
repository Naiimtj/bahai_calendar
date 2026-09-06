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
import WeekEventLanes from './WeekEventLanes';
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

const GRID_START_CLASSES = [
  'col-start-1',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
  'col-start-8',
];

const GRID_SPAN_CLASSES = [
  '',
  'col-span-1',
  'col-span-2',
  'col-span-3',
  'col-span-4',
  'col-span-5',
  'col-span-6',
  'col-span-7',
];

const GRID_COLUMN_CLASSES = [
  '',
  'grid-cols-1',
  'grid-cols-2',
  'grid-cols-3',
  'grid-cols-4',
  'grid-cols-5',
  'grid-cols-6',
  'grid-cols-7',
];

function isSameBadiMonth(firstCell, secondCell) {
  return (
    firstCell?.badi?.month === secondCell?.badi?.month &&
    firstCell?.badi?.year === secondCell?.badi?.year
  );
}

function getBadiMonthEdges(cells, column, gregorianToBadi) {
  const cell = cells[column];
  if (!cell?.badi) return { isFirstInGroup: false, isLastInGroup: false };

  const nextCell = cells[column + 1];
  const dayAfter = new Date(cell.date);
  dayAfter.setDate(dayAfter.getDate() + 1);
  const nextBadi = nextCell?.badi ?? gregorianToBadi(dayAfter);

  return {
    isFirstInGroup: cell.badi.day === 1,
    isLastInGroup: !isSameBadiMonth(cell, { badi: nextBadi }),
  };
}

export default function MixedCalendar({
  onMenuClick,
  selectedDate,
  onSelectDate,
}) {
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
    onSelectDate(today);
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
        gregDate: d,
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
        gregDate: d,
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
        gregDate: d,
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

  const handleSelectDate = (date) => {
    onSelectDate((prev) =>
      prev?.getTime() === date.getTime() && density !== 'lista' ? null : date,
    );
  };

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
          onSelectMonth={(selectedYear, monthNum) => {
            const gregDate = badiToGregorian(selectedYear, monthNum, 1);
            setUserYear(gregDate.getFullYear());
            setUserMonth(gregDate.getMonth());
            setShowYear(false);
          }}
          onToggle={() => setYearViewMode('gregorian')}
          onToday={() => setUserYear(null)}
        />
      );
    }
    return (
      <YearView
        year={viewYear}
        onSelectMonth={(selectedYear, month) => {
          setUserYear(selectedYear);
          setUserMonth(month);
          setShowYear(false);
        }}
        onToggle={() => setYearViewMode('badi')}
        onToday={() => setUserYear(null)}
      />
    );
  }

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
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          setUserYear(date.getFullYear());
          setUserMonth(date.getMonth());
          onSelectDate(date);
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
      <div className="flex-1 md:pb-20" {...swipeHandlers}>
        {weeks.map((week, wi) => {
          const selectedBadi = gregorianToBadi(selectedDate || today);
          const firstVisibleColumn = week.cells.findIndex(Boolean);
          const lastVisibleColumn = week.cells.reduce(
            (lastColumn, cell, column) => (cell ? column : lastColumn),
            0,
          );
          const visibleColumnCount = lastVisibleColumn - firstVisibleColumn + 1;
          const displayedCells =
            density === 'detalles'
              ? week.cells.slice(firstVisibleColumn, lastVisibleColumn + 1)
              : week.cells;
          const columnOffset = density === 'detalles' ? firstVisibleColumn : 0;
          return (
            <div
              key={wi}
              className={`grid ${gridCols} px-2 ${
                density === 'detalles'
                  ? ''
                  : 'border-t border-gray-100 dark:border-gray-800/50'
              }`}
            >
              {showWeekNums && (
                <div
                  className={`flex items-start justify-center pt-2 text-[10px] text-gray-300 dark:text-gray-700`}
                >
                  {week.weekNum}
                </div>
              )}
              <div
                className={
                  density === 'detalles'
                    ? `${GRID_START_CLASSES[firstVisibleColumn + (showWeekNums ? 1 : 0)]} ${GRID_SPAN_CLASSES[visibleColumnCount]} grid ${GRID_COLUMN_CLASSES[visibleColumnCount]}`
                    : `${showWeekNums ? 'col-start-2' : 'col-start-1'} col-span-7 grid grid-cols-7`
                }
              >
                {displayedCells.map((cell, ci) => {
                  if (!cell) return <div key={`e-${ci}`} />;
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
                  const { isFirstInGroup, isLastInGroup } = getBadiMonthEdges(
                    week.cells,
                    columnOffset + ci,
                    gregorianToBadi,
                  );
                  const badiMonthBorderColor = isCurrentBadiMonth
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 dark:border-gray-600';
                  const isDetalles = density === 'detalles';
                  const bottomLeftRounded = isDetalles ? '' : ' rounded-bl-lg';
                  const bottomRightRounded = isDetalles ? '' : ' rounded-br-lg';
                  const firstGroupClass = isFirstInGroup
                    ? `border-l rounded-tl-lg ${bottomLeftRounded}`
                    : '';
                  const lastGroupClass = isLastInGroup
                    ? `border-r rounded-tr-lg ${bottomRightRounded}`
                    : '';
                  const borderClasses = cell.badi
                    ? [
                        density === 'detalles'
                          ? 'border-t'
                          : 'border-t border-b',
                        badiMonthBorderColor,
                        firstGroupClass,
                        lastGroupClass,
                      ]
                        .filter(Boolean)
                        .join(' ')
                    : '';

                  return (
                    <button
                      key={cell.day}
                      onClick={() => handleSelectDate(cell.date)}
                      className={`z-40  group relative flex flex-col items-center transition-colors cursor-pointer mt-[1px] ${borderClasses} ${
                        density === 'detalles'
                          ? 'py-1 min-w-0 w-full'
                          : 'py-0.5'
                      }`}
                    >
                      {/* NUMBER */}
                      <span
                        className={`md:w-8 md:h-8 h-6 w-6 flex items-center justify-center rounded-full text-sm font-medium md:group-hover:bg-gray-100 dark:md:group-hover:bg-gray-800
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

                      {/* Detalles: events handled by WeekEventLanes below */}
                    </button>
                  );
                })}
                {density === 'detalles' && (
                  <div className="col-span-full">
                    <WeekEventLanes
                      cells={week.cells}
                      getCellEvents={getCellEvents}
                      getCellDate={(cell) => cell.date}
                      visibleStartColumn={firstVisibleColumn}
                      visibleColumnCount={visibleColumnCount}
                      selectedBadi={selectedBadi}
                      getBadiForDate={gregorianToBadi}
                      showBadiMonthBorders
                      onColumnClick={(cell) => handleSelectDate(cell.date)}
                    />
                  </div>
                )}
              </div>
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
