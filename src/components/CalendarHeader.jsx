import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseButton, BaseIcon } from './base';
import AddEventModal from './AddEventModal';
import { useBadiYear } from '../context/BadiYearContext';
import { searchEvents } from '../utils/searchEvents';

/**
 * Shared header for all calendar views — iOS-style layout.
 *
 * Props:
 *   yearLabel        – string shown next to the back-arrow (e.g. "2026" or "183 B.E.")
 *   monthName        – big title text (e.g. month name)
 *   centerLabel      – optional small centered label (e.g. "183 B.E.")
 *   onYearClick      – handler for the year/back-arrow button (→ year view)
 *   onPrev / onNext  – month or year navigation
 *   showSearch       – controlled search-bar state
 *   onToggleSearch   – toggle callback
 *   searchQuery      – controlled input value
 *   onSearchChange   – input onChange handler
 *   onMenuClick      – opens sidebar (mobile)
 *   selectedDate     – date used as the default for new events
 *   onSelectDate     – callback when user taps a search result (receives Date)
 */
export default function CalendarHeader({
  yearLabel,
  monthName,
  onYearClick,
  onPrev,
  onNext,
  showSearch,
  onToggleSearch,
  searchQuery,
  onSearchChange,
  onMenuClick,
  selectedDate,
  onSelectDate,
}) {
  const { t } = useTranslation();
  const { allEvents } = useBadiYear();
  const [showAddEvent, setShowAddEvent] = useState(false);

  const searchResults = useMemo(() => {
    if (!showSearch || !searchQuery) return [];
    return searchEvents(allEvents, searchQuery, new Date());
  }, [showSearch, searchQuery, allEvents]);

  return (
    <>
      {/* Search overlay — replaces normal header when active */}
      {showSearch && (
        <div className="flex flex-col pt-[max(0.5rem,env(safe-area-inset-top))]">
          {/* Search input row */}
          <div className="flex items-center gap-2 px-4 py-2">
            <BaseIcon
              icon="search"
              size="sm"
              className="fill-gray-400 dark:fill-gray-500 shrink-0"
            />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('calendar.searchEvent')}
              className="flex-1 text-base outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <BaseIcon
              icon="close"
              size="sm"
              onClick={() => {
                onSearchChange('');
                onToggleSearch();
              }}
              className="fill-gray-400 dark:fill-gray-500 hover:fill-gray-700 dark:hover:fill-gray-300"
            />
          </div>

          {/* Search results */}
          {searchQuery && (
            <div className="border-t border-gray-200 dark:border-gray-800 max-h-64 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((ev, i) => (
                  <button
                    key={`${ev.event}-${i}`}
                    onClick={() => {
                      if (onSelectDate) onSelectDate(ev.gregDate);
                      onSearchChange('');
                      onToggleSearch();
                    }}
                    className="w-full text-left px-4 py-2.5 border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {ev.name}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {ev.gregDate.toLocaleDateString()}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
                  {t('calendar.noEvents')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Normal header — hidden when search is active */}
      {!showSearch && (
        <>
          {/* Navigation row */}
          <div className="flex items-center justify-between px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-1">
            <BaseButton
              onClick={onYearClick}
              outlined
              icon="arrowLeft"
              className="gap-0!"
            >
              <div className="flex items-center gap-1">{yearLabel}</div>
            </BaseButton>

            <div
              className="flex items-center gap-3 justify-center transition-colors cursor-pointer flex-row z-10
            border border-btn-primary hover:bg-btn-primary/10 active:bg-btn-primary/20 rounded-full text-sm font-semibold px-4 py-0.5 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
            >
              <BaseIcon
                icon="search"
                className="fill-gray-900 dark:fill-gray-100 hover:fill-gray-900 dark:hover:fill-gray-200"
                wrapperClassName="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={onToggleSearch}
              />
              <BaseIcon
                icon="plus"
                className="fill-gray-900 dark:fill-gray-100 hover:fill-gray-900 dark:hover:fill-gray-200"
                wrapperClassName="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setShowAddEvent(true)}
              />
              {/* Desktop-only arrows */}
              {onPrev && (
                <BaseIcon
                  icon="arrowLeft"
                  onClick={onPrev}
                  className="stroke-gray-900 dark:stroke-gray-100 hover:stroke-gray-900 dark:hover:stroke-gray-200"
                  wrapperClassName="hidden md:inline-flex p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                />
              )}
              {onNext && (
                <BaseIcon
                  icon="arrowRight"
                  onClick={onNext}
                  className="stroke-gray-900 dark:stroke-gray-100 hover:stroke-gray-900 dark:hover:stroke-gray-200"
                  wrapperClassName="hidden md:inline-flex p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                />
              )}
              {onMenuClick && (
                <BaseIcon
                  icon="menu"
                  onClick={onMenuClick}
                  className="fill-gray-600 dark:fill-gray-100"
                  wrapperClassName="md:hidden p-2 rounded-full"
                />
              )}
            </div>
          </div>

          {/* Month title */}
          <div className="px-4 pb-2">
            <h2 className="text-3xl font-bold capitalize">{monthName}</h2>
          </div>
        </>
      )}

      <AddEventModal
        visible={showAddEvent}
        onClose={() => setShowAddEvent(false)}
        initialDate={selectedDate}
      />
    </>
  );
}
