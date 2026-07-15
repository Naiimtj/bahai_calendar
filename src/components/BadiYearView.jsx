import { useRef, useEffect, useLayoutEffect, useState } from 'react';
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
  onSelect,
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
    <BaseButton
      text
      onClick={() => onSelect(badiYear, monthNum)}
      className="!flex !flex-col items-start w-full text-left"
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
    </BaseButton>
  );
}

// monthOrder: 1-18, 0, 19
const MONTH_ORDER = [...Array(18)].map((_, i) => i + 1).concat([0, 19]);
const PAST_YEARS = 5;
const FUTURE_YEARS = 5;

function buildYears(focus) {
  const list = [];
  for (let offset = -PAST_YEARS; offset <= FUTURE_YEARS; offset++) {
    list.push(focus + offset);
  }
  return list;
}

export default function BadiYearView({
  badiYear,
  onSelectMonth,
  onToggle,
  onToday,
}) {
  const { lang, effectiveToday } = useSettings();
  const { t } = useTranslation();
  const {
    gregorianToBadi,
    badiToGregorian,
    getAyyamiHaDays,
    getHolyDayForDate,
    loadYearsAround,
    loading,
  } = useBadiYear();
  const { eventsForDate } = usePersonalEvents();
  const today = effectiveToday;
  const todayBadi = gregorianToBadi(today);
  const containerRef = useRef(null);
  const focusRef = useRef(null);
  const [focusYear, setFocusYear] = useState(badiYear);
  const [years, setYears] = useState(() => buildYears(badiYear));
  const [scrollNudge, setScrollNudge] = useState(0);

  useEffect(() => {
    setFocusYear(badiYear);
    setYears(buildYears(badiYear));
  }, [badiYear]);

  useLayoutEffect(() => {
    focusRef.current?.scrollIntoView({ block: 'start' });
  }, [focusYear, scrollNudge]);

  useEffect(() => {
    years.forEach((displayYear) => loadYearsAround(displayYear + 1843));
  }, [years, loadYearsAround]);

  const handleToday = () => {
    setFocusYear(todayBadi.year);
    setYears(buildYears(todayBadi.year));
    setScrollNudge((n) => n + 1);
    onToday?.();
  };

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
    <div className="relative h-full">
      <div
        ref={containerRef}
        className="flex flex-col h-full overflow-y-auto overflow-x-hidden"
      >
        <div className="sticky top-0 z-10 flex justify-end px-4 pt-[max(0.5rem,env(safe-area-inset-top))]  bg-white/90 dark:bg-gray-950/90">
          {onToggle && (
            <BaseButton
              icon="calendarGregorian"
              color="currentColor"
              onClick={onToggle}
              outlined
              className="fixed top-[max(0.5rem,env(safe-area-inset-top))] right-8 z-40 md:absolute md:top-4 md:right-4"
            />
          )}
        </div>

        {years.map((displayYear) => (
          <section
            key={displayYear}
            ref={displayYear === focusYear ? focusRef : null}
            className="px-4 pb-8 scroll-mt-16"
          >
            <h2
              className={`mb-4 text-center text-3xl font-bold ${displayYear === todayBadi.year ? 'text-primary-text' : ''}`}
            >
              {displayYear} B.E.
            </h2>
            <div className="grid grid-cols-3 gap-x-4 gap-y-4">
              {MONTH_ORDER.map((monthNum) => (
                <MiniMonth
                  key={monthNum}
                  badiYear={displayYear}
                  monthNum={monthNum}
                  isCurrent={
                    displayYear === todayBadi.year &&
                    monthNum === todayBadi.month
                  }
                  today={today}
                  lang={lang}
                  onSelect={onSelectMonth}
                  apiFns={apiFns}
                  eventsForDate={eventsForDate}
                />
              ))}
            </div>
          </section>
        ))}
        <div className="h-20" />
      </div>
      <BaseButton
        label={t('calendar.today')}
        onClick={handleToday}
        outlined
        className="fixed bottom-6 left-8 z-40 md:absolute md:bottom-4 md:left-4"
      />
    </div>
  );
}
