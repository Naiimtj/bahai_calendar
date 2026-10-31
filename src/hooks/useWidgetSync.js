import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useBadiYear } from '../context/BadiYearContext';
import { usePersonalEvents } from '../context/PersonalEventsContext';
import { reorderWeekdays } from '../lib/badiDate';
import {
  buildWidgetSnapshot,
  isWidgetSyncSupported,
  loadSavedLocation,
  pushWidgetSnapshot,
} from '../services/widgetSnapshot';

const SYNC_DEBOUNCE_MS = 1500;

/**
 * Keeps the native Home Screen widgets in sync with the calendar data. Runs
 * app-wide; no-op on web.
 */
export function useWidgetSync() {
  const { t } = useTranslation();
  const { settings, lang } = useSettings();
  const { loading, gregorianToBadi, getHolyDayForDate, isRidvanPeriod } =
    useBadiYear();
  const { eventsForDate } = usePersonalEvents();
  const { weekStart, dateShift } = settings;

  useEffect(() => {
    if (!isWidgetSyncSupported() || loading) return;
    const timer = setTimeout(() => {
      const snapshot = buildWidgetSnapshot({
        now: new Date(),
        lang,
        weekStart,
        weekdayInitials: reorderWeekdays(
          t('weekdaysMin', { returnObjects: true }),
          weekStart,
        ),
        t,
        gregorianToBadi,
        getHolyDayForDate,
        isRidvanPeriod,
        eventsForDate,
        sunsetLocation: dateShift === 'sunset' ? loadSavedLocation() : null,
      });
      if (!snapshot.days.length) return;
      // Best effort: the next data change retries.
      pushWidgetSnapshot(snapshot).catch(() => {});
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [
    loading,
    lang,
    weekStart,
    dateShift,
    t,
    gregorianToBadi,
    getHolyDayForDate,
    isRidvanPeriod,
    eventsForDate,
  ]);
}
