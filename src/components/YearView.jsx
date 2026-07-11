import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useBadiYear } from '../context/BadiYearContext';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import { getGregorianMonthName } from '../lib/badiDate';
import { BaseButton, BaseIcon } from './base';
import MiniMonthGrid, { getEventStyle } from './MiniMonthGrid';

const WEEKDAYS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAYS_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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
  onClick,
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
    <button onClick={() => onClick(month)} className="flex flex-col text-left">
      <h3
        className={`text-sm font-bold capitalize mb-1 ${isCurrent ? 'text-primary-text' : ''}`}
      >
        {monthName}
      </h3>
      <MiniMonthGrid
        cells={cells}
        headers={headers}
        keyPrefix={`g-${year}-${month}-`}
      />
    </button>
  );
}

export default function YearView({
  year,
  onSelectMonth,
  onBack,
  onToggle,
  onYearChange,
  onToday,
}) {
  const { lang, effectiveToday } = useSettings();
  const { t } = useTranslation();
  const { getHolyDayForDate, gregorianToBadi } = useBadiYear();
  const { eventsForDate } = usePersonalEvents();
  const today = effectiveToday;
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const containerRef = useRef(null);
  const touchStartYRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (!onYearChange) return;
      if (e.deltaY < 0 && el.scrollTop === 0) {
        e.preventDefault();
        onYearChange(year - 1);
      } else if (
        e.deltaY > 0 &&
        el.scrollTop + el.clientHeight >= el.scrollHeight - 1
      ) {
        e.preventDefault();
        onYearChange(year + 1);
      }
    };

    const onTouchStart = (e) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e) => {
      if (!onYearChange) return;
      const delta = touchStartYRef.current - e.changedTouches[0].clientY;
      if (delta < -50 && el.scrollTop === 0) {
        onYearChange(year - 1);
      } else if (
        delta > 50 &&
        el.scrollTop + el.clientHeight >= el.scrollHeight - 1
      ) {
        onYearChange(year + 1);
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
  }, [year, onYearChange]);

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
          {onToday && year !== currentYear && (
            <BaseButton
              onClick={onToday}
              outlined
              label={t('calendar.today')}
            />
          )}
        </div>
        <div className="flex items-center gap-2 w-full justify-end md:justify-center">
          <h2
            className={`text-3xl font-bold ${year === currentYear ? 'text-primary-text' : ''}`}
          >
            {year}
          </h2>
          {onToggle && (
            <BaseIcon
              icon="change"
              size="md"
              onClick={onToggle}
              className="cursor-pointer fill-gray-500 dark:fill-gray-400"
            />
          )}
          <h2
            className="text-xl font-bold text-gray-400 dark:text-gray-500 cursor-pointer md:hover:text-gray-900 md:dark:hover:text-gray-100"
            onClick={onToggle}
          >
            {gregorianToBadi(new Date(year, 5, 1))?.year} B.E.
          </h2>
        </div>
      </div>

      {/* 12 months in 3-column grid */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-2 md:gap-y-4 px-4 pb-6">
        {Array.from({ length: 12 }, (_, m) => (
          <MiniMonth
            key={m}
            year={year}
            month={m}
            isCurrent={year === currentYear && m === currentMonth}
            today={today}
            lang={lang}
            onClick={onSelectMonth}
            getHolyDayForDate={getHolyDayForDate}
            gregorianToBadi={gregorianToBadi}
            eventsForDate={eventsForDate}
          />
        ))}
      </div>
    </div>
  );
}
