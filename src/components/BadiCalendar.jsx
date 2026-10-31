import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useBadiYear } from '../context/BadiYearContext';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import CalendarHeader from './CalendarHeader';
import CalendarBottomBar from './CalendarBottomBar';
import BadiYearView from './BadiYearView';
import YearView from './YearView';
import MonthPager from './MonthPager';
import { getWeekNumber } from '../utils/weekNumber';
import WeekEventLanes from './WeekEventLanes';
import SelectedDayEvents from './SelectedDayEvents';
import {
  getMonthName,
  getWeekdayName,
  formatSecondaryDate,
} from '../lib/badiDate';
import BaseSpinner from './base/BaseSpinner';
import { BaseIcon } from './base';

// Get weekday order based on week start setting
const MAX_DOTS = 6;

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

    cells.push({
      day: d,
      month: badiMonth,
      gregDate,
      col,
      holyDay,
      ridvan,
      isToday,
    });
  }
  return cells;
}

function buildMonthWeeks(cells) {
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

  const weeks = useMemo(() => buildMonthWeeks(cells), [cells]);

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
    (cell, withMeaning = false) => {
      if (!cell) return [];
      const month = cell.month ?? viewMonth;
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
      if (cell.day === 1 && month >= 1 && month <= 19) {
        const monthEntry = allMonthStarts.find(
          (m) =>
            m.badiMonth === month &&
            m.start.getTime() === cell.gregDate.getTime(),
        );
        evs.push({
          color: 'bg-blue-400',
          name: t('calendar.feast', {
            name: getMonthName(month, withMeaning ? lang : 'ar', true),
          }),
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
    return getCellEvents(
      {
        holyDay: selectedHolyDay,
        ridvan: selectedDate ? isRidvanPeriod(selectedDate) : false,
        day: selectedBadi.day,
        gregDate: selectedDate,
      },
      true,
    );
  }, [
    selectedDate,
    selectedBadi,
    selectedHolyDay,
    isRidvanPeriod,
    getCellEvents,
  ]);

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
          onSelectMonth={(selectedYear, month, day = 15) => {
            const badi = gregorianToBadi(new Date(selectedYear, month, day));
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

  const renderWeeks = (monthWeeks) =>
    monthWeeks.map((week, wi) => (
      <div
        key={wi}
        className={`grid ${gridCols} border-t border-slate-200/90 px-1 dark:border-slate-800/80`}
      >
        {showWeekNums && (
          <div className="flex items-start justify-center pt-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
            {week.weekNum}
          </div>
        )}
        {week.cells.map((cell, ci) => {
          if (!cell) return <div key={ci} className="h-full" />;
          const isMonthStart = cell.day === 1;
          const isSelected =
            selectedDate?.getTime() === cell.gregDate.getTime();
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
              key={ci}
              onClick={() => handleSelectDate(cell.gregDate)}
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
              <span
                className={`text-[9px] ${cell.holyDay && !cell.isToday && !isSelected ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}
              >
                {formatSecondaryDate(
                  cell.gregDate,
                  settings.secondaryFormat,
                  lang,
                )}
              </span>

              {(density === 'compacta' || density === 'lista') && (
                <div className="mt-0.5 flex gap-0.5">
                  {cell.holyDay && (
                    <span className="h-1 w-1 rounded-full bg-amber-500" />
                  )}
                  {cell.ridvan && !cell.holyDay && (
                    <span className="h-1 w-1 rounded-full bg-teal-500" />
                  )}
                  {eventsForDate(cell.gregDate)
                    .slice(
                      0,
                      MAX_DOTS -
                        [cell.holyDay, cell.ridvan && !cell.holyDay].filter(
                          Boolean,
                        ).length,
                    )
                    .map((ev, pi) => (
                      <span
                        key={`p-${pi}`}
                        className="h-1 w-1 rounded-full"
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
            className={showWeekNums ? 'col-span-7 col-start-2' : 'col-span-7'}
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
    ));

  const renderMonth = (offset) => {
    if (offset === 0) return renderWeeks(weeks);
    const total = viewMonthIdx + offset;
    const monthIdx = (total + MONTH_ORDER.length) % MONTH_ORDER.length;
    const year = viewYear + Math.floor(total / MONTH_ORDER.length);
    return renderWeeks(
      buildMonthWeeks(
        buildMonthCells(
          year,
          MONTH_ORDER[monthIdx],
          apiFns,
          settings.weekStart,
          today,
        ),
      ),
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

      <div className={`grid ${gridCols} px-2 pt-1`}>
        {showWeekNums && <div />}
        {headers.map((h, i) => (
          <div
            key={i}
            className="py-2 text-center md:text-[10px] text-[7px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400"
          >
            {h}
          </div>
        ))}
      </div>

      <div className="flex-1 px-1 pb-1 md:pb-20">
        {/* Month pager with interactive horizontal drag */}
        <MonthPager
          pageKey={`${viewYear}-${viewMonthIdx}`}
          renderMonth={renderMonth}
          onPrev={prevMonth}
          onNext={nextMonth}
        />
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
