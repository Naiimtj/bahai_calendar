import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useBadiYear } from '../context/BadiYearContext';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import ArrowLeftIcon from './base/icons/ArrowLeftIcon';
import ArrowRightIcon from './base/icons/ArrowRightIcon';
import CalendarBottomBar from './CalendarBottomBar';
import CellEventDetails from './CellEventDetails';
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

export default function GregorianCalendar() {
  const { settings, lang, effectiveToday } = useSettings();
  const { t } = useTranslation();
  const {
    gregorianToBadi,
    getHolyDayForDate,
    isRidvanPeriod,
    loading,
    allMonthStarts,
    allEvents,
  } = useBadiYear();
  const { eventsForDate } = usePersonalEvents();
  const density = settings.calendarDensity || 'compacta';
  const today = effectiveToday;
  const [userYear, setUserYear] = useState(null);
  const [userMonth, setUserMonth] = useState(null);
  const viewYear = userYear ?? today.getFullYear();
  const viewMonth = userMonth ?? today.getMonth();
  const [selectedDate, setSelectedDate] = useState(today);

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
  };

  // Build grid cells
  const cells = useMemo(() => {
    const arr = [];
    // Empty cells before first day
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

  const selectedInfo = selectedDate
    ? (() => {
        const badi = gregorianToBadi(selectedDate);
        const holyDay = getHolyDayForDate(selectedDate);
        return { badi, holyDay };
      })()
    : null;

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
      evs.push({ color: 'bg-primary', name: 'Riḍván' });
    }
    if (
      cell.badi &&
      cell.badi.day === 1 &&
      cell.badi.month >= 1 &&
      cell.badi.month <= 19
    ) {
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

  const selectedEvents = useMemo(() => {
    if (!selectedInfo) return [];
    const evs = [];
    if (selectedInfo.holyDay) {
      evs.push({
        color: 'bg-gold-500',
        name: selectedInfo.holyDay[lang] || selectedInfo.holyDay.en,
        suspend: selectedInfo.holyDay.suspend,
        desc: selectedInfo.holyDay.desc || '',
        time_note: selectedInfo.holyDay.time_note || '',
        url: selectedInfo.holyDay.url || '',
      });
    }
    if (selectedDate && isRidvanPeriod(selectedDate) && !selectedInfo.holyDay) {
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
      evs.push({
        color: 'bg-blue-400',
        name: t('calendar.feast', {
          name: getMonthName(selectedInfo.badi.month, 'ar'),
        }),
        desc: monthEntry?.desc || '',
        time_note: monthEntry?.info || '',
      });
    }
    evs.push(...eventsForDate(selectedDate));
    return evs;
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

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center">
        <BaseSpinner />
      </div>
    );

  return (
    <div className="relative flex flex-col h-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={prevMonth}
          className="p-2 text-gray-400 hover:text-white"
        >
          <ArrowLeftIcon size="md" color="currentColor" />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-bold capitalize">{monthName}</h2>
          <span className="text-gray-400 text-sm">{viewYear}</span>
        </div>
        <button
          onClick={nextMonth}
          className="p-2 text-gray-400 hover:text-white"
        >
          <ArrowRightIcon size="md" color="currentColor" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-2">
        {headers.map((h, i) => (
          <div
            key={i}
            className="text-center text-xs font-medium text-gray-500 py-1"
          >
            {h}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 px-2 gap-y-1 flex-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />;
          const isSelected = selectedDate?.getTime() === cell.date.getTime();
          const cellEvents = getCellEvents(cell);
          return (
            <button
              key={cell.day}
              onClick={() =>
                setSelectedDate((prev) =>
                  prev?.getTime() === cell.date.getTime() && density !== 'lista'
                    ? null
                    : cell.date,
                )
              }
              className={`relative flex flex-col items-center transition-colors ${
                density === 'detalles'
                  ? 'py-0.5 min-h-[4.5rem] overflow-hidden min-w-0 w-full'
                  : 'py-1'
              }`}
            >
              <span
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium
                  ${cell.isToday ? 'bg-red-500 text-white' : ''}
                  ${isSelected && !cell.isToday ? 'bg-gray-300 dark:bg-gray-600' : ''}
                  ${cell.holyDay && !cell.isToday && !isSelected ? 'text-gold-500' : ''}
                `}
              >
                {cell.day}
              </span>

              {/* Compacta & Lista: dots */}
              {(density === 'compacta' || density === 'lista') && (
                <div className="flex gap-0.5 mt-0.5">
                  {cell.holyDay && (
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                  )}
                  {cell.ridvan && !cell.holyDay && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                  {cell.badi &&
                    cell.badi.day === 1 &&
                    cell.badi.month >= 1 &&
                    cell.badi.month <= 19 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    )}
                  {eventsForDate(cell.date).map((ev, pi) => (
                    <span
                      key={`p-${pi}`}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: ev.color }}
                    />
                  ))}
                </div>
              )}

              {/* Detalles: event text */}
              {density === 'detalles' && (
                <CellEventDetails events={cellEvents} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day events */}
      {selectedInfo && (density === 'lista' || selectedEvents.length >= 0) && (
        <SelectedDayEvents
          events={selectedEvents}
          density={density}
          header={
            density === 'lista' ? (
              <div className="px-4 py-2 text-xs font-medium text-gray-400 dark:text-gray-500">
                {selectedDate.getDate()}{' '}
                {getGregorianMonthName(selectedDate.getMonth(), lang)}{' '}
                {selectedDate.getFullYear()}
                <span className="text-primary-text ml-2">
                  {selectedInfo.badi?.day}.{' '}
                  {getMonthName(selectedInfo.badi?.month, lang)}{' '}
                  {selectedInfo.badi?.year} B.E.
                </span>
              </div>
            ) : null
          }
        />
      )}

      <CalendarBottomBar onToday={goToday} />
    </div>
  );
}
