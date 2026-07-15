import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useBadiYear } from '../context/BadiYearContext';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import { getGregorianMonthName } from '../lib/badiDate';
import { BaseButton, BaseIcon } from './base';
import MiniMonthGrid, { getEventStyle } from './MiniMonthGrid';

const WEEKDAYS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAYS_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const PAST_YEARS = 5;
const FUTURE_YEARS = 5;

function buildYears(focus) {
  const list = [];
  for (let offset = -PAST_YEARS; offset <= FUTURE_YEARS; offset++) {
    list.push(focus + offset);
  }
  return list;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function MiniMonth({
  year,
  month,
  isCurrent,
  today,
  lang,
  onSelect,
  getHolyDayForDate,
  gregorianToBadi,
  eventsForDate,
}) {
  const monthName = getGregorianMonthName(month, lang);
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const headers = lang === 'en' ? WEEKDAYS_EN : WEEKDAYS_ES;
  const isCurrentMonth =
    month === today.getMonth() && year === today.getFullYear();
  const todayDay = isCurrentMonth ? today.getDate() : null;
  const fns = { getHolyDayForDate, gregorianToBadi };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({
      day: d,
      isToday: d === todayDay,
      evStyle: getEventStyle(date, fns),
      personalEventColors: eventsForDate(date).map((e) => e.color),
    });
  }

  return (
    <BaseButton
      text
      onClick={() => onSelect(year, month)}
      className="!flex !flex-col items-start !w-full text-left"
    >
      <h3
        className={`lg:text-lg text-sm font-bold capitalize mb-1 ${isCurrent ? 'text-primary-text' : ''}`}
      >
        {monthName}
      </h3>
      <MiniMonthGrid
        cells={cells}
        headers={headers}
        keyPrefix={`g-${year}-${month}-`}
      />
    </BaseButton>
  );
}

export default function YearView({ year, onSelectMonth, onToggle, onToday }) {
  const { lang, effectiveToday } = useSettings();
  const { t } = useTranslation();
  const { getHolyDayForDate, gregorianToBadi, loadYearsAround } = useBadiYear();
  const { eventsForDate } = usePersonalEvents();
  const today = effectiveToday;
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const containerRef = useRef(null);
  const focusRef = useRef(null);
  const [focusYear, setFocusYear] = useState(year);
  const [years, setYears] = useState(() => buildYears(year));
  const [scrollNudge, setScrollNudge] = useState(0);

  useEffect(() => {
    setFocusYear(year);
    setYears(buildYears(year));
  }, [year]);

  useLayoutEffect(() => {
    focusRef.current?.scrollIntoView({ block: 'start' });
  }, [focusYear, scrollNudge]);

  useEffect(() => {
    years.forEach(loadYearsAround);
  }, [years, loadYearsAround]);

  const handleToday = () => {
    setFocusYear(currentYear);
    setYears(buildYears(currentYear));
    setScrollNudge((n) => n + 1);
    onToday?.();
  };

  return (
    <div className="relative h-full">
      <div ref={containerRef} className="flex flex-col h-full overflow-y-auto">
        <div className="sticky top-0 z-10 flex justify-end px-4 pt-[max(0.5rem,env(safe-area-inset-top))]  bg-white/90 dark:bg-gray-950/90">
          {onToggle && (
            <BaseButton
              icon="calendarBadi"
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
              className={`mb-4 text-center text-3xl font-bold ${displayYear === currentYear ? 'text-primary-text' : ''}`}
            >
              {displayYear}
            </h2>
            <div className="grid grid-cols-3 gap-x-4 gap-y-4 w-full">
              {Array.from({ length: 12 }, (_, month) => (
                <MiniMonth
                  key={month}
                  year={displayYear}
                  month={month}
                  isCurrent={
                    displayYear === currentYear && month === currentMonth
                  }
                  today={today}
                  lang={lang}
                  onSelect={onSelectMonth}
                  getHolyDayForDate={getHolyDayForDate}
                  gregorianToBadi={gregorianToBadi}
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
        className="fixed z-40 md:absolute bottom-4 left-4"
      />
    </div>
  );
}
