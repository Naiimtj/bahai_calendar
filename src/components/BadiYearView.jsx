import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useBadiYear } from '../context/BadiYearContext';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import { getMonthName, getWeekdayName } from '../lib/badiDate';
import { BaseButton, BaseIcon } from './base';
import BaseSpinner from './base/BaseSpinner';
import MiniMonthGrid, { getEventStyle } from './MiniMonthGrid';

// Monday-start order: Mon=Kamál, Tue=Fiḍál, Wed='Idál, Thu=Istijlál, Fri=Istiqlál, Sat=Jalál, Sun=Jamál
const WEEKDAY_ORDER = [3, 4, 5, 6, 7, 1, 2];

function getWeekdayAbbrs() {
  return WEEKDAY_ORDER.map((num) => {
    const name = getWeekdayName(num);
    return name.slice(0, 2);
  });
}

function MiniMonth({
  badiYear,
  monthNum,
  isCurrent,
  today,
  lang,
  onClick,
  apiFns,
  eventsForDate,
}) {
  const {
    badiToGregorian,
    getAyyamiHaDays,
    getHolyDayForDate,
    gregorianToBadi,
  } = apiFns;
  const daysInMonth = monthNum === 0 ? getAyyamiHaDays(badiYear) : 19;
  const headers = getWeekdayAbbrs();
  const fns = { getHolyDayForDate, gregorianToBadi };

  const dayCells = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const gregDate = badiToGregorian(badiYear, monthNum, d);
    if (!gregDate) continue;
    const weekday = gregDate.getDay();
    const col = weekday === 0 ? 6 : weekday - 1;
    const isToday =
      gregDate.getDate() === today.getDate() &&
      gregDate.getMonth() === today.getMonth() &&
      gregDate.getFullYear() === today.getFullYear();
    dayCells.push({
      day: d,
      col,
      isToday,
      evStyle: getEventStyle(gregDate, fns),
      personalEventColors: eventsForDate(gregDate).map((e) => e.color),
    });
  }

  // Build flat padded array
  const flat = [];
  if (dayCells.length > 0) {
    for (let i = 0; i < dayCells[0].col; i++) flat.push(null);
  }
  dayCells.forEach((cell) => flat.push(cell));
  while (flat.length % 7 !== 0) flat.push(null);

  return (
    <button
      onClick={() => onClick(monthNum)}
      className="flex flex-col text-left"
    >
      <h3
        className={`text-sm font-bold mb-1 ${isCurrent ? 'text-primary-text' : ''}`}
      >
        {getMonthName(monthNum, lang)}
      </h3>
      <MiniMonthGrid
        cells={flat}
        headers={headers}
        keyPrefix={`b-${badiYear}-${monthNum}-`}
      />
    </button>
  );
}

// monthOrder: 1-18, 0, 19
const MONTH_ORDER = [...Array(18)].map((_, i) => i + 1).concat([0, 19]);

export default function BadiYearView({
  badiYear,
  onSelectMonth,
  onBack,
  onToggle,
  onYearChange,
  onToday,
}) {
  const { lang, effectiveToday } = useSettings();
  const { t } = useTranslation();
  const {
    gregorianToBadi,
    badiToGregorian,
    getAyyamiHaDays,
    getHolyDayForDate,
    loading,
  } = useBadiYear();
  const { eventsForDate } = usePersonalEvents();
  const today = effectiveToday;
  const todayBadi = gregorianToBadi(today);
  const containerRef = useRef(null);
  const touchStartYRef = useRef(0);
  const lastYearChangeRef = useRef(0);

  const YEAR_CHANGE_COOLDOWN_MS = 1000;
  // iOS momentum/rubber-band scrolling rarely settles at exactly 0 or
  // scrollHeight, so allow a small tolerance at the edges.
  const EDGE_TOLERANCE_PX = 4;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const goToYear = (year) => {
      const now = Date.now();
      if (now - lastYearChangeRef.current < YEAR_CHANGE_COOLDOWN_MS) return;
      lastYearChangeRef.current = now;
      onYearChange(year);
      el.scrollTop = 0;
    };

    const onWheel = (e) => {
      if (!onYearChange) return;
      if (window.innerWidth >= 768) return;
      if (e.deltaY < 0 && el.scrollTop <= EDGE_TOLERANCE_PX) {
        e.preventDefault();
        goToYear(badiYear - 1);
      } else if (
        e.deltaY > 0 &&
        el.scrollTop + el.clientHeight >= el.scrollHeight - EDGE_TOLERANCE_PX
      ) {
        e.preventDefault();
        goToYear(badiYear + 1);
      }
    };

    const onTouchStart = (e) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e) => {
      if (!onYearChange) return;
      const delta = touchStartYRef.current - e.changedTouches[0].clientY;
      if (delta < -50 && el.scrollTop <= EDGE_TOLERANCE_PX) {
        goToYear(badiYear - 1);
      } else if (
        delta > 50 &&
        el.scrollTop + el.clientHeight >= el.scrollHeight - EDGE_TOLERANCE_PX
      ) {
        goToYear(badiYear + 1);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [badiYear, onYearChange]);

  if (loading || !todayBadi) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <BaseSpinner />
      </div>
    );
  }

  const apiFns = {
    badiToGregorian,
    getAyyamiHaDays,
    getHolyDayForDate,
    gregorianToBadi,
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full overflow-y-auto">
      {/* Year header */}
      <div className="relative px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-4 flex items-start w-full">
        <div className="absolute left-4 flex items-center w-fit">
          <BaseButton
            onClick={onBack}
            outlined
            icon="arrowLeft"
            label={t('calendar.back')}
          />
          {onToday && badiYear !== todayBadi?.year && (
            <BaseButton
              onClick={onToday}
              outlined
              label={t('calendar.today')}
            />
          )}
        </div>
        <div className="flex items-center gap-2 w-full justify-end md:justify-center">
          <h2
            className={`text-3xl font-bold ${badiYear === todayBadi.year ? 'text-primary-text' : ''}`}
          >
            {badiYear} B.E.
          </h2>
          {onToggle && (
            <BaseIcon
              icon="change"
              size="md"
              onClick={onToggle}
              className="fill-gray-500 dark:fill-gray-400 cursor-pointer"
            />
          )}
          <h2
            className="text-xl font-bold text-gray-400 dark:text-gray-500 cursor-pointer md:hover:text-gray-900 md:dark:hover:text-gray-100"
            onClick={onToggle}
          >
            {badiToGregorian(badiYear, 1, 1)?.getFullYear()}
          </h2>
        </div>
        {onYearChange && (
          <div
              className="hidden md:flex items-center gap-3 justify-center transition-colors cursor-pointer flex-row z-10
            border border-btn-primary hover:bg-btn-primary/10 active:bg-btn-primary/20 rounded-full text-sm font-semibold px-4 py-0.5 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
            >
            <BaseIcon
              icon="arrowLeft"
              size="md"
              onClick={() => onYearChange(badiYear - 1)}
              className="stroke-gray-900 dark:stroke-gray-100 hover:stroke-gray-900 dark:hover:stroke-gray-200"
                wrapperClassName="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            />
            <BaseIcon
              icon="arrowRight"
              size="md"
              onClick={() => onYearChange(badiYear + 1)}
              className="stroke-gray-900 dark:stroke-gray-100 hover:stroke-gray-900 dark:hover:stroke-gray-200"
                wrapperClassName="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            />
          </div>
        )}
      </div>

      {/* 20 months in 3-column grid */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-2 md:gap-y-4 px-4 pb-6">
        {MONTH_ORDER.map((monthNum) => (
          <MiniMonth
            key={monthNum}
            badiYear={badiYear}
            monthNum={monthNum}
            isCurrent={
              badiYear === todayBadi.year && monthNum === todayBadi.month
            }
            today={today}
            lang={lang}
            onClick={onSelectMonth}
            apiFns={apiFns}
            eventsForDate={eventsForDate}
          />
        ))}
      </div>
    </div>
  );
}
