import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useBadiYear } from '../context/BadiYearContext';
import { useSettings } from '../context/SettingsContext';
import { formatGregorianDate } from '../lib/badiDate';
import BaseSpinner from './base/BaseSpinner';
import { BaseIcon } from './base';

function splitUrls(str) {
  if (!str) return [];
  return str
    .split(/(?=https?:)/)
    .map((s) => s.trim().replace(/^(https?):(?!\/)\/?/, '$1://'))
    .filter(Boolean);
}

export default function UpcomingEvents() {
  const { t } = useTranslation();
  const { lang, effectiveToday } = useSettings();
  const { allEvents, allMonthStarts, loading } = useBadiYear();
  const today = effectiveToday;
  const [tab, setTab] = useState('all');
  const [expandedKey, setExpandedKey] = useState(null);

  const toggleExpand = useCallback((key) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  const holyList = useMemo(() => {
    const todayMs = today.getTime();
    return allEvents
      .filter((ev) => ev.gregDate.getTime() > todayMs)
      .map((ev) => {
        const monthEntry = allMonthStarts.find(
          (m) => m.badiMonth === ev.badi_month,
        );
        const monthName = monthEntry ? monthEntry.name : ev.badi_month_name;
        return {
          type: 'holy',
          name: ev.event,
          gregDate: ev.gregDate,
          suspend:
            /Naw-Rúz|Riḍván|Declaración|Ascensión|Martirio|Nacimiento/.test(
              ev.event,
            ),
          badiDate: `${ev.badi_day} ${monthName}`,
          desc: ev.desc,
          url: ev.url,
          time_note: ev.time_note,
        };
      });
  }, [allEvents, allMonthStarts, today]);

  const feastList = useMemo(() => {
    const todayMs = today.getTime();
    return allMonthStarts
      .filter(
        (m) =>
          m.badiMonth >= 1 && m.badiMonth <= 19 && m.start.getTime() > todayMs,
      )
      .map((m) => ({
        type: 'feast',
        name: t('calendar.feastShort', { name: m.name }),
        gregDate: m.start,
        suspend: false,
        badiDate: `1 ${m.name}`,
        desc: m.desc,
      }));
  }, [allMonthStarts, t, today]);

  const allList = useMemo(() => {
    return [...holyList, ...feastList].sort((a, b) => a.gregDate - b.gregDate);
  }, [holyList, feastList]);

  const nextHoly = holyList[0] || null;

  const nextHolyDaysUntil = useMemo(() => {
    if (!nextHoly) return 0;
    return Math.ceil((nextHoly.gregDate - today) / 86400000);
  }, [nextHoly, today]);

  let filtered = holyList;

  if (tab === 'all') filtered = allList;
  else if (tab === 'f19') filtered = feastList;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <BaseSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Next holy day highlight */}
      <div className="px-4 md:py-3 mb-4">
        <h3 className="text-sm text-gray-400 font-semibold mb-1">
          {t('events.nextHolyDayInDays', { count: nextHolyDaysUntil })}
        </h3>
        {nextHoly && (
          <div className="flex flex-col justify-center rounded-xl p-3 border-l-4 border-gold-500 bg-gray-100 dark:bg-gray-800">
            <div className="flex flex-col md:flex-row text-lg font-bold text-gold-500 items-center justify-between">
              <span>{nextHoly.name} </span>
              {nextHoly.suspend && (
                <span className="text-xs text-gray-600">
                  {' '}
                  {t('events.workSuspended')}
                </span>
              )}
            </div>
            <div className="flex items-start justify-between gap-2 mt-1 text-xs md:text-sm ">
              <div className="flex md:flex-row flex-col items-center gap-1">
                <span className="text-gray-400">
                  {formatGregorianDate(nextHoly.gregDate, lang)}
                </span>
                {nextHoly.time_note && (
                  <span className="text-xs text-amber-700 italic">
                    {nextHoly.time_note}
                  </span>
                )}
              </div>
              <span className="text-gray-400">{nextHoly.badiDate}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b px-4 border-gray-200 dark:border-gray-800">
        {[
          { key: 'all', label: t('events.all') },
          { key: 'f19', label: t('events.f19') },
          { key: 'holy', label: t('events.holyDays') },
        ].map((tab_item) => (
          <button
            key={tab_item.key}
            onClick={() => setTab(tab_item.key)}
            className={`flex-1 py-2 text-sm font-medium text-center transition-colors
              ${
                tab === tab_item.key
                  ? 'border-b-2 border-primary-text text-primary-text'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
          >
            {tab_item.label}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {filtered.slice(0, 30).map((ev) => {
          const key = ev.gregDate.getTime() + ev.name;
          const isExpanded = expandedKey === key;
          const hasDetail = ev.desc || ev.url;
          let leftBorder = '';
          if (ev.type === 'holy')
            leftBorder = 'border-l-2 border-l-gold-500 pl-3';
          else if (ev.type === 'feast')
            leftBorder = 'border-l-2 border-l-blue-400 pl-3';
          let nameClass = 'font-medium';
          if (ev.type === 'holy') nameClass = 'font-medium text-gold-500';
          else if (ev.type === 'feast') nameClass = 'font-medium text-blue-400';
          return (
            <div
              key={key}
              className={`py-3 border-b border-gray-200 dark:border-gray-800 ${leftBorder}`}
            >
              {hasDetail ? (
                <button
                  type="button"
                  className="w-full text-left cursor-pointer"
                  onClick={() => toggleExpand(key)}
                >
                  <div className="flex items-center justify-between">
                    <div className={nameClass}>{ev.name}</div>
                    <BaseIcon
                      icon={isExpanded ? 'arrowUp' : 'arrowDown'}
                      size="xs"
                      className="stroke-gray-400 shrink-0"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                    <div className="flex md:flex-row flex-col items-center gap-1">
                      <span>{formatGregorianDate(ev.gregDate, lang)}</span>
                      {ev.time_note && (
                        <div className="text-xs mt-0.5 text-amber-700 italic">
                          {ev.time_note}
                        </div>
                      )}
                    </div>
                    <div className="flex md:flex-row flex-col items-center gap-1">
                      <span>{ev.badiDate}</span>
                      {ev.suspend && (
                        <span className="text-xs text-gray-600">
                          {t('events.workSuspended')}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ) : (
                <>
                  <div className={nameClass}>{ev.name}</div>
                  <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                    <div className="flex md:flex-row flex-col items-center gap-1">
                      <span>{formatGregorianDate(ev.gregDate, lang)}</span>
                      {ev.time_note && (
                        <div className="text-xs mt-0.5 text-amber-700 italic">
                          {ev.time_note}
                        </div>
                      )}
                    </div>
                    <div className="flex md:flex-row flex-col items-center gap-1">
                      {ev.suspend && (
                        <span className="text-xs text-gray-600">
                          {t('events.workSuspended')}
                        </span>
                      )}
                      <span>{ev.badiDate}</span>
                    </div>
                  </div>
                </>
              )}
              {isExpanded && hasDetail && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  {ev.desc && <p>{ev.desc}</p>}
                  {splitUrls(ev.url).map((url) => {
                    let host = url;
                    try {
                      host = new URL(url).hostname;
                    } catch {
                      /* keep raw */
                    }
                    return (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-blue-500 hover:underline"
                      >
                        {host}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
