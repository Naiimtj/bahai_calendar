import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useBadiYear } from '../context/BadiYearContext';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import CalendarHeader from './CalendarHeader';
import CalendarBottomBar from './CalendarBottomBar';
import BadiYearView from './BadiYearView';
import YearView from './YearView';
import { useSwipe } from '../hooks/useSwipe';
import { getWeekNumber } from '../utils/weekNumber';
import WeekEventLanes from './WeekEventLanes';
import SelectedDayEvents from './SelectedDayEvents';
import {
  getMonthName,
  getWeekdayName,
  formatSecondaryDate,
} from '../lib/badiDate';
import BaseSpinner from './base/BaseSpinner';

// Get weekday order based on week start setting
function getWeekdayOrder(weekStart) {
  // Badí' weekday numbers: 1=Jalál(Sat), 2=Jamál(Sun), 3=Kamál(Mon), 4=Fiḍál(Tue), 5='Idál(Wed), 6=Istijlál(Thu), 7=Istiqlál(Fri)
  if (weekStart === 'jalal') {
    return [1, 2, 3, 4, 5, 6, 7]; // Jalál (Saturday) to Istiqlál (Friday)
  } else if (weekStart === 'sunday') {
    return [2, 3, 4, 5, 6, 7, 1]; // Jamál (Sunday) to Jalál (Saturday)
  }
  // Default: monday
  return [3, 4, 5, 6, 7, 1, 2]; // Kamál (Monday) to Jamál (Sunday)
}

function getWeekdayHeaders(weekStart) {
  const order = getWeekdayOrder(weekStart);
  return order.map((num) => {
    const name = getWeekdayName(num);
    return name.length > 6 ? name.slice(0, 6) + '.' : name;
  });
}

// Months in order: 1-18, 0 (Ayyám-i-Há), 19
const MONTH_ORDER = [...Array(18)].map((_, i) => i + 1).concat([0, 19]);

function buildMonthCells(
  badiYear,
  badiMonth,
  { badiToGregorian, getHolyDayForDate, isRidvanPeriod, getAyyamiHaDays },
  weekStart,
  today,
) {
  const daysInMonth = badiMonth === 0 ? getAyyamiHaDays(badiYear) : 19;
  const weekdayOrder = getWeekdayOrder(weekStart);

  const cells = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const gregDate = badiToGregorian(badiYear, badiMonth, d);
    if (!gregDate) continue;
    const weekday = gregDate.getDay();
    // Map Gregorian day (0=Sun, 1=Mon, ..., 6=Sat) to column index based on weekStart
    const badiWeekday = [2, 3, 4, 5, 6, 7, 1][weekday]; // Greg day to Badí' day number
    const col = weekdayOrder.indexOf(badiWeekday);
    const holyDay = getHolyDayForDate(gregDate);
    const ridvan = isRidvanPeriod(gregDate);
    const isToday =
      gregDate.getDate() === today.getDate() &&
      gregDate.getMonth() === today.getMonth() &&
      gregDate.getFullYear() === today.getFullYear();

    cells.push({ day: d, gregDate, col, holyDay, ridvan, isToday });
  }
  return cells;
}

export default function BadiCalendar({
  onMenuClick,
  selectedDate,
  onSelectDate,
}) {
  const { t } = useTranslation();
  const { settings, lang, effectiveToday } = useSettings();
  const {
    gregorianToBadi,
    badiToGregorian,
    getHolyDayForDate,
    isRidvanPeriod,
    getAyyamiHaDays,
    loadYearsAround,
    loading,
    allEvents,
    allMonthStarts,
  } = useBadiYear();
  const { eventsForDate } = usePersonalEvents();
  const showWeekNums = settings.showWeekNumbers;
  const density = settings.calendarDensity || 'compacta';
  const today = effectiveToday;
  const todayBadi = gregorianToBadi(today);

  const [userYear, setUserYear] = useState(null);
  const [userMonthIdx, setUserMonthIdx] = useState(null);
  const viewYear = userYear ?? todayBadi?.year ?? 183;
  const viewMonthIdx =
    userMonthIdx ?? (todayBadi ? MONTH_ORDER.indexOf(todayBadi.month) : 0);
  const [showYear, setShowYear] = useState(false);
  const [yearViewMode, setYearViewMode] = useState('badi');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // viewYear is Badí' — Naw-Rúz falls in gregYear = badiYear + 1843
  useEffect(() => {
    loadYearsAround(viewYear + 1843);
  }, [viewYear, loadYearsAround]);

  const viewMonth = MONTH_ORDER[viewMonthIdx];

  const selectedBadi = selectedDate ? gregorianToBadi(selectedDate) : null;
  const selectedHolyDay = selectedDate ? getHolyDayForDate(selectedDate) : null;

  const headers = getWeekdayHeaders(settings.weekStart);

  const prevMonth = () => {
    if (viewMonthIdx === 0) {
      setUserMonthIdx(MONTH_ORDER.length - 1);
      setUserYear(viewYear - 1);
    } else {
      setUserMonthIdx(viewMonthIdx - 1);
    }
  };
  const nextMonth = () => {
    if (viewMonthIdx === MONTH_ORDER.length - 1) {
      setUserMonthIdx(0);
      setUserYear(viewYear + 1);
    } else {
      setUserMonthIdx(viewMonthIdx + 1);
    }
  };
  const goToday = () => {
    setUserYear(null);
    setUserMonthIdx(null);
    onSelectDate(today);
  };

  const apiFns = useMemo(
    () => ({
      badiToGregorian,
      getHolyDayForDate,
      isRidvanPeriod,
      getAyyamiHaDays,
    }),
    [badiToGregorian, getHolyDayForDate, isRidvanPeriod, getAyyamiHaDays],
  );

  const cells = useMemo(
    () =>
      buildMonthCells(viewYear, viewMonth, apiFns, settings.weekStart, today),
    [viewYear, viewMonth, apiFns, settings.weekStart, today],
  );

  const weeks = useMemo(() => {
    const flat = [];
    if (cells.length > 0) {
      for (let i = 0; i < cells[0].col; i++) flat.push(null);
    }
    cells.forEach((cell) => flat.push(cell));
    while (flat.length % 7 !== 0) flat.push(null);
    const rows = [];
    for (let i = 0; i < flat.length; i += 7) {
      const row = flat.slice(i, i + 7);
      const firstCell = row.find((c) => c !== null);
      const weekNum = firstCell ? getWeekNumber(firstCell.gregDate) : null;
      rows.push({ weekNum, cells: row });
    }
    return rows;
  }, [cells]);

  const firstGreg = cells[0]?.gregDate;
  const lastGreg = cells[cells.length - 1]?.gregDate;
  const gregRange =
    firstGreg && lastGreg
      ? `${firstGreg.getFullYear()}${
          lastGreg.getFullYear() !== firstGreg.getFullYear()
            ? ` – ${lastGreg.getFullYear()}`
            : ''
        }`
      : '';

  const getCellEvents = useCallback(
    (cell) => {
      if (!cell) return [];
      const evs = [];
      if (cell.holyDay) {
        evs.push({
          color: 'bg-gold-500',
          name: cell.holyDay[lang] || cell.holyDay.en,
          suspend: cell.holyDay.suspend,
          desc: cell.holyDay.desc || '',
          time_note: cell.holyDay.time_note || '',
          url: cell.holyDay.url || '',
          gregDate: cell.gregDate,
        });
      }
      if (cell.ridvan && !cell.holyDay) {
        const ridvanEv = allEvents.find(
          (e) => e.badi_month === 2 && e.badi_day === 13,
        );
        evs.push({
          color: 'bg-primary',
          name: 'Riḍván',
          desc: ridvanEv?.desc || '',
          url: ridvanEv?.url || '',
          gregDate: cell.gregDate,
        });
      }
      if (cell.day === 1 && viewMonth >= 1 && viewMonth <= 19) {
        const monthEntry = allMonthStarts.find(
          (m) =>
            m.badiMonth === viewMonth &&
            m.start.getTime() === cell.gregDate.getTime(),
        );
        evs.push({
          color: 'bg-blue-400',
          name: t('calendar.feast', { name: getMonthName(viewMonth, 'ar') }),
          desc: monthEntry?.desc || '',
          time_note: monthEntry?.info || '',
          gregDate: cell.gregDate,
        });
      }
      evs.push(...eventsForDate(cell.gregDate));
      return evs;
    },
    [lang, allEvents, viewMonth, allMonthStarts, t, eventsForDate],
  );

  const selectedEvents = useMemo(() => {
    if (!selectedBadi) return [];
    return getCellEvents({
      holyDay: selectedHolyDay,
      ridvan: selectedDate ? isRidvanPeriod(selectedDate) : false,
      day: selectedBadi.day,
      gregDate: selectedDate,
    });
  }, [
    selectedDate,
    selectedBadi,
    selectedHolyDay,
    isRidvanPeriod,
    getCellEvents,
  ]);

  const swipeHandlers = useSwipe(nextMonth, prevMonth);

  const gridCols = showWeekNums
    ? 'grid-cols-[2rem_repeat(7,1fr)]'
    : 'grid-cols-7';

  const monthLabel = getMonthName(viewMonth, lang, true);

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center">
        <BaseSpinner />
      </div>
    );

  if (showYear) {
    if (yearViewMode === 'gregorian') {
      const gregYearForView = badiToGregorian(viewYear, 1, 1).getFullYear();
      return (
        <YearView
          year={gregYearForView}
          onSelectMonth={(selectedYear, month) => {
            const badi = gregorianToBadi(new Date(selectedYear, month, 15));
            if (badi) {
              setUserYear(badi.year);
              setUserMonthIdx(MONTH_ORDER.indexOf(badi.month));
            }
            setShowYear(false);
          }}
          onToggle={() => setYearViewMode('badi')}
          onToday={() => setUserYear(null)}
        />
      );
    }
    return (
      <BadiYearView
        badiYear={viewYear}
        onSelectMonth={(selectedYear, monthNum) => {
          setShowYear(false);
          setUserYear(selectedYear);
          setUserMonthIdx(MONTH_ORDER.indexOf(monthNum));
        }}
        onToggle={() => setYearViewMode('gregorian')}
        onToday={() => setUserYear(null)}
      />
    );
  }

  const handleSelectDate = (date) => {
    onSelectDate((prev) =>
      prev?.getTime() === date.getTime() && density !== 'lista' ? null : date,
    );
  };

  return (
    <div className="relative flex flex-col h-full">
      <CalendarHeader
        yearLabel={`${viewYear} B.E.`}
        monthName={monthLabel}
        centerLabel={gregRange}
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
          const badi = gregorianToBadi(date);
          if (badi) {
            setUserYear(badi.year);
            setUserMonthIdx(MONTH_ORDER.indexOf(badi.month));
            onSelectDate(date);
          }
        }}
      />

      {/* Weekday headers */}
      <div className={`grid ${gridCols} px-2`}>
        {showWeekNums && <div />}
        {headers.map((h, i) => (
          <div key={i} className="text-center text-[10px] text-gray-500">
            {h}
          </div>
        ))}
      </div>

      {/* Day grid — swipeable */}
      <div className="flex-1" {...swipeHandlers}>
        {weeks.map((week, wi) => (
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
              if (!cell) return <div key={ci} />;

              const isSelected =
                selectedDate?.getTime() === cell.gregDate.getTime();

              return (
                <button
                  key={ci}
                  onClick={() => handleSelectDate(cell.gregDate)}
                  className={`flex flex-col items-center cursor-pointer md:hover:bg-gray-100 md:dark:hover:bg-gray-800 ${
                    density === 'detalles' ? 'py-1 min-w-0 w-full' : 'py-1'
                  }`}
                >
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold ${cell.isToday ? 'bg-red-500 text-white' : ''} ${isSelected && !cell.isToday ? 'bg-gray-200 dark:bg-gray-700' : ''}${cell.holyDay && !cell.isToday && !isSelected ? 'text-gold-500' : ''}`}
                  >
                    {cell.day}
                  </span>
                  <span
                    className={`text-[9px] ${cell.holyDay && !cell.isToday && !isSelected ? 'text-gold-500' : 'text-gray-400 dark:text-gray-500'}`}
                  >
                    {formatSecondaryDate(
                      cell.gregDate,
                      settings.secondaryFormat,
                      lang,
                    )}
                  </span>

                  {/* Compacta & Lista: dots */}
                  {(density === 'compacta' || density === 'lista') && (
                    <div className="flex gap-0.5 mt-0.5">
                      {cell.holyDay && (
                        <span className="w-1 h-1 rounded-full bg-gold-500" />
                      )}
                      {cell.ridvan && !cell.holyDay && (
                        <span className="w-1 h-1 rounded-full bg-primary" />
                      )}
                      {eventsForDate(cell.gregDate).map((ev, pi) => (
                        <span
                          key={`p-${pi}`}
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: ev.color }}
                        />
                      ))}
                    </div>
                  )}
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
                  getCellDate={(cell) => cell.gregDate}
                  onColumnClick={(cell) => handleSelectDate(cell.gregDate)}
                />
              </div>
            )}
          </div>
        ))}
        {/* Selected day details */}
        {selectedDate &&
          selectedBadi &&
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
