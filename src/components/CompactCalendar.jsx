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
  reorderWeekdays,
  getFirstDayColumn,
} from '../lib/badiDate';
import BaseSpinner from './base/BaseSpinner';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export default function CompactCalendar({
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
      const isFeast =
        badi && badi.day === 1 && badi.month >= 1 && badi.month <= 19;
      arr.push({ day: d, date, badi, holyDay, ridvan, isToday, isFeast });
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

  // Group cells into weeks for week-number display
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

  const selectedInfo = selectedDate
    ? (() => {
        const badi = gregorianToBadi(selectedDate);
        const holyDay = getHolyDayForDate(selectedDate);
        return { badi, holyDay };
      })()
    : null;

  // Gather events for selected day
  const selectedEvents = useMemo(() => {
    if (!selectedInfo) return [];
    const events = [];
    if (selectedInfo.holyDay) {
      events.push({
        color: 'bg-gold-500',
        name: selectedInfo.holyDay[lang] || selectedInfo.holyDay.en,
        suspend: selectedInfo.holyDay.suspend,
        desc: selectedInfo.holyDay.desc || '',
        time_note: selectedInfo.holyDay.time_note || '',
        url: selectedInfo.holyDay.url || '',
        gregDate: selectedDate,
      });
    }
    if (selectedDate && isRidvanPeriod(selectedDate) && !selectedInfo.holyDay) {
      const ridvanEv = allEvents.find(
        (e) => e.badi_month === 2 && e.badi_day === 13,
      );
      events.push({
        color: 'bg-primary',
        name: 'Riḍván',
        desc: ridvanEv?.desc || '',
        url: ridvanEv?.url || '',
        gregDate: selectedDate,
      });
    }
    if (
      selectedInfo.badi &&
      selectedInfo.badi.day === 1 &&
      selectedInfo.badi.month >= 1 &&
      selectedInfo.badi.month <= 19
    ) {
      const d0 = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
      );
      const monthEntry = allMonthStarts.find(
        (m) =>
          m.badiMonth === selectedInfo.badi.month &&
          m.start.getTime() === d0.getTime(),
      );
      events.push({
        color: 'bg-blue-400',
        name: t('calendar.feast', {
          name: getMonthName(selectedInfo.badi.month, 'ar'),
        }),
        desc: monthEntry?.desc || '',
        time_note: monthEntry?.info || '',
        gregDate: selectedDate,
      });
    }
    events.push(...eventsForDate(selectedDate));
    return events;
  }, [
    selectedDate,
    selectedInfo,
    lang,
    isRidvanPeriod,
    t,
    eventsForDate,
    allMonthStarts,
    allEvents,
  ]);

  // Gather events for a single cell (used by apilado / detalles)
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
    if (cell.isFeast) {
      evs.push({
        color: 'bg-blue-400',
        name: t('calendar.feastShort', {
          name: getMonthName(cell.badi?.month, 'ar'),
        }),
      });
    }
    evs.push(...eventsForDate(cell.date));
    return evs;
  };

  const swipeHandlers = useSwipe(nextMonth, prevMonth);

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

  const gridCols = showWeekNums
    ? 'grid-cols-[2rem_repeat(7,1fr)]'
    : 'grid-cols-7';

  // Bahá'í year for the middle of the viewed month
  const midMonthBadi = gregorianToBadi(new Date(viewYear, viewMonth, 15));

  const handleSelectDate = (date) => {
    onSelectDate((prev) =>
      prev?.getTime() === date.getTime() && density !== 'lista' ? null : date,
    );
  };

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
            className={`text-center text-[11px] font-semibold py-1 ${
              i >= 5 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500'
            }`}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Week rows — swipeable on mobile */}
      <div className="flex-1" {...swipeHandlers}>
        {weeks.map((week, wi) => (
          <div
            key={wi}
            className={`grid ${gridCols} md:px-2 border-t border-gray-100 dark:border-gray-800/50`}
          >
            {/* Week number */}
            {showWeekNums && (
              <div
                className={`flex items-start justify-center pt-2 text-[10px] text-gray-300 dark:text-gray-700`}
              >
                {week.weekNum}
              </div>
            )}

            {week.cells.map((cell, ci) => {
              if (!cell) return <div key={`e-${ci}`} />;
              const isSelected =
                selectedDate?.getTime() === cell.date.getTime();

              return (
                <button
                  key={cell.day}
                  onClick={() => handleSelectDate(cell.date)}
                  className={`relative flex flex-col items-center cursor-pointer md:hover:bg-gray-100 md:dark:hover:bg-gray-800 ${
                    density === 'detalles' ? 'py-1 min-w-0 w-full' : 'py-1.5'
                  }`}
                >
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${cell.isToday ? 'bg-red-500 text-white' : ''} ${isSelected && !cell.isToday ? 'bg-gray-200 dark:bg-gray-700' : ''}${cell.holyDay && !cell.isToday && !isSelected ? 'text-gold-500' : ''}`}
                  >
                    {cell.day}
                  </span>

                  {/* Compacta & Lista: small dots */}
                  {(density === 'compacta' || density === 'lista') && (
                    <div className="flex gap-[3px] mt-0.5 h-[5px]">
                      {cell.holyDay && (
                        <span className="w-[5px] h-[5px] rounded-full bg-gold-500" />
                      )}
                      {cell.ridvan && !cell.holyDay && (
                        <span className="w-[5px] h-[5px] rounded-full bg-primary" />
                      )}
                      {cell.isFeast && (
                        <span className="w-[5px] h-[5px] rounded-full bg-blue-400" />
                      )}
                      {eventsForDate(cell.date).map((ev, pi) => (
                        <span
                          key={`p-${pi}`}
                          className="w-[5px] h-[5px] rounded-full"
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
              <div
                className={
                  showWeekNums ? 'col-span-7 col-start-2' : 'col-span-7'
                }
              >
                <WeekEventLanes
                  cells={week.cells}
                  getCellEvents={getCellEvents}
                  getCellDate={(cell) => cell.date}
                  onColumnClick={(cell) => handleSelectDate(cell.date)}
                />
              </div>
            )}
          </div>
        ))}
        {/* Selected day events */}
        {selectedDate &&
          (density === 'lista' || selectedEvents.length >= 0) && (
            <SelectedDayEvents
              events={selectedEvents}
              density={density}
              className="mt-4"
            />
          )}
      </div>

      {/* Bottom bar — iOS style */}
      <CalendarBottomBar onToday={goToday} />
    </div>
  );
}
