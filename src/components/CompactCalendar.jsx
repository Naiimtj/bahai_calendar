import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useBadiYear } from '../context/BadiYearContext';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import YearView from './YearView';
import BadiYearView from './BadiYearView';
import CalendarHeader from './CalendarHeader';
import CalendarBottomBar from './CalendarBottomBar';
import MonthPager from './MonthPager';
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
import { BaseIcon } from './base';

const MAX_DOTS = 6;

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function buildMonthWeeks(
  year,
  month,
  weekStart,
  today,
  { gregorianToBadi, getHolyDayForDate, isRidvanPeriod },
) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayColumn(
    new Date(year, month, 1).getDay(),
    weekStart,
  );
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const badi = gregorianToBadi(date);
    const holyDay = getHolyDayForDate(date);
    const ridvan = isRidvanPeriod(date);
    const isToday =
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
    const isFeast =
      badi && badi.day === 1 && badi.month >= 1 && badi.month <= 19;
    cells.push({ day: d, date, badi, holyDay, ridvan, isToday, isFeast });
  }

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    const row = cells.slice(i, i + 7);
    while (row.length < 7) row.push(null);
    const firstCellInRow = row.find((c) => c !== null);
    const weekNum = firstCellInRow ? getWeekNumber(firstCellInRow.date) : null;
    rows.push({ weekNum, cells: row });
  }
  return rows;
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

  const monthApi = useMemo(
    () => ({ gregorianToBadi, getHolyDayForDate, isRidvanPeriod }),
    [gregorianToBadi, getHolyDayForDate, isRidvanPeriod],
  );

  const weeks = useMemo(
    () =>
      buildMonthWeeks(viewYear, viewMonth, settings.weekStart, today, monthApi),
    [viewYear, viewMonth, settings.weekStart, today, monthApi],
  );

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
          name: getMonthName(selectedInfo.badi.month, lang, true),
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
          onSelectMonth={(selectedYear, monthNum, day = 1) => {
            const gregDate = badiToGregorian(selectedYear, monthNum, day);
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

  const renderWeeks = (monthWeeks) =>
    monthWeeks.map((week, wi) => (
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
          const isMonthStart =
            cell?.badi &&
            cell.badi.day === 1 &&
            cell.badi.month >= 1 &&
            cell.badi.month <= 19;
          if (!cell) return <div key={`e-${ci}`} />;
          const isSelected = selectedDate?.getTime() === cell.date.getTime();
          const startIconColorRidvanF19 = cell.ridvan
            ? 'fill-primary'
            : 'fill-blue-400';
          const starIconColorHolyday = cell.holyDay
            ? 'fill-gold-500'
            : startIconColorRidvanF19;
          const starIconColor = cell.isToday
            ? starIconColorHolyday + ' z-10'
            : starIconColorHolyday + ' opacity-50';
          const baseBackgroundColor = cell.isToday
            ? ' bg-red-500 text-white'
            : '';
          const backgroundColor =
            cell.isToday && isMonthStart
              ? ' border border-red-500 text-white'
              : baseBackgroundColor;
          return (
            <button
              key={cell.day}
              onClick={() => handleSelectDate(cell.date)}
              className={`relative flex flex-col items-center cursor-pointer md:hover:bg-gray-100 md:dark:hover:bg-gray-800 ${
                density === 'detalles' ? 'py-1 min-w-0 w-full' : 'py-1.5'
              }`}
            >
              {/* NUMBER */}
              <span
                className={`relative md:w-8 md:h-8 h-7 w-7 flex items-center justify-center rounded-full text-lg font-medium md:group-hover:bg-gray-100 dark:md:group-hover:bg-gray-800
                         ${backgroundColor}
                        ${isSelected && !cell.isToday ? 'bg-gray-300 dark:bg-gray-600' : ''}
                      `}
              >
                {(cell.holyDay || cell.ridvan || isMonthStart) && (
                  <BaseIcon
                    className={`absolute -inset-2 z-0 m-auto h-9 w-9 ${
                      starIconColor
                    }`}
                    icon="starNine"
                  />
                )}
                <span className="relative z-10">{cell.day}</span>
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
                  {eventsForDate(cell.date)
                    .slice(
                      0,
                      MAX_DOTS -
                        [
                          cell.holyDay,
                          cell.ridvan && !cell.holyDay,
                          cell.isFeast,
                        ].filter(Boolean).length,
                    )
                    .map((ev, pi) => (
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
            className={showWeekNums ? 'col-span-7 col-start-2' : 'col-span-7'}
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
    ));

  const renderMonth = (offset) => {
    if (offset === 0) return renderWeeks(weeks);
    const shifted = new Date(viewYear, viewMonth + offset, 1);
    return renderWeeks(
      buildMonthWeeks(
        shifted.getFullYear(),
        shifted.getMonth(),
        settings.weekStart,
        today,
        monthApi,
      ),
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

      {/* Week rows inside touch month pager */}
      <div className="flex-1 md:pb-20">
        <MonthPager
          pageKey={`${viewYear}-${viewMonth}`}
          renderMonth={renderMonth}
          onPrev={prevMonth}
          onNext={nextMonth}
        />
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
