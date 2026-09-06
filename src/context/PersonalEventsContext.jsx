import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  aggregateEvents,
  clearCachedDeviceCalendar,
  clearCachedDeviceEvents,
  clearCachedIcsSource,
  loadConfig,
  loadCachedSyncedEvents,
  saveConfig,
  colorForIndex,
  addLocalEvent as persistLocalEvent,
  removeLocalEvent as deleteLocalEvent,
  updateLocalEvent as patchLocalEvent,
  deleteDeviceEvent,
  updateDeviceEvent,
  setDeviceReminderCompleted,
  updateDeviceReminder,
  deleteDeviceReminder,
} from '../services/personalCalendar';
import { formatClockTime } from '../utils/timeFormat';

const PersonalEventsContext = createContext(null);

function dayKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatTimeNote(ev) {
  if (ev.allDay || !ev.start) return ev.location || '';
  const startStr = formatClockTime(ev.start);
  const sameTime = ev.end && ev.end.getTime() === ev.start.getTime();
  const endStr = ev.end && !sameTime ? formatClockTime(ev.end) : '';
  const timeRange = endStr ? `${startStr} - ${endStr}` : startStr;
  return ev.location ? `${timeRange} · ${ev.location}` : timeRange;
}

/** All-day events first, then by start time for same-day readability. */
function byAllDayThenStart(a, b) {
  const aAllDay = !!a.allDay;
  const bAllDay = !!b.allDay;
  if (aAllDay !== bAllDay) return aAllDay ? -1 : 1;

  const aStart = a.start?.getTime() || 0;
  const bStart = b.start?.getTime() || 0;
  if (aStart !== bStart) return aStart - bStart;

  const aEnd = a.end?.getTime() || aStart;
  const bEnd = b.end?.getTime() || bStart;
  if (aEnd !== bEnd) return aEnd - bEnd;

  return (a.title || '').localeCompare(b.title || '', undefined, {
    sensitivity: 'base',
  });
}

/** Build a Map<dayKey, event[]> by spreading each event across the days it spans. */
function buildEventsByDay(events) {
  const map = new Map();
  for (const ev of events) {
    const start = new Date(
      ev.start.getFullYear(),
      ev.start.getMonth(),
      ev.start.getDate(),
    );
    let endDay = new Date(
      ev.end.getFullYear(),
      ev.end.getMonth(),
      ev.end.getDate(),
    );
    // All-day ICS events use an exclusive end date.
    if (ev.allDay && ev.end > ev.start && ev.end.getHours() === 0) {
      endDay.setDate(endDay.getDate() - 1);
    }
    if (endDay < start) endDay = new Date(start);

    const spanDays = Math.min(366, Math.floor((endDay - start) / 86400000) + 1);
    for (let i = 0; i < spanDays; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const key = dayKey(day);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
  }
  return map;
}

export function PersonalEventsProvider({ children }) {
  const [config, setConfig] = useState(() => loadConfig());
  const range = useMemo(() => {
    const y = new Date().getFullYear();
    return {
      start: new Date(y - 1, 0, 1),
      end: new Date(y + 1, 11, 31, 23, 59),
    };
  }, []);
  const [eventsByDay, setEventsByDay] = useState(() =>
    buildEventsByDay(loadCachedSyncedEvents(range.start, range.end, config)),
  );
  const [optimisticEvents, setOptimisticEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    aggregateEvents(range.start, range.end, config)
      .then((events) => {
        if (!active) return;
        setEventsByDay(buildEventsByDay(events));
        setOptimisticEvents([]);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [config, range, reloadToken]);

  const refresh = useCallback(() => setReloadToken((t) => t + 1), []);

  const addOptimisticEvent = useCallback(
    (event) => {
      setOptimisticEvents((prev) => [...prev, event]);
      refresh();
    },
    [refresh],
  );

  // Re-read events when the app returns to the foreground (e.g. after the
  // user added an event in the native Calendar app).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const persist = useCallback((next) => {
    saveConfig(next);
    setConfig(next);
  }, []);

  const setDeviceCalendarEnabled = useCallback(
    (enabled) => {
      if (!enabled) clearCachedDeviceEvents();
      persist({ ...config, deviceCalendarEnabled: enabled });
    },
    [config, persist],
  );

  /** Update per-calendar device preferences (enabled / colorIndex). */
  const setDeviceCalendarPref = useCallback(
    (id, patch) => {
      if (patch.enabled === false) clearCachedDeviceCalendar(id);
      const current = config.deviceCalendars || {};
      persist({
        ...config,
        deviceCalendars: {
          ...current,
          [id]: { ...current[id], ...patch },
        },
      });
    },
    [config, persist],
  );

  const addIcsSource = useCallback(
    ({ name, url }) => {
      const sources = config.icsSources || [];
      const source = {
        id: `ics-${Date.now()}`,
        name: name || url,
        url,
        colorIndex: (sources.length % 6) + 0,
        enabled: true,
      };
      persist({ ...config, icsSources: [...sources, source] });
    },
    [config, persist],
  );

  const updateIcsSource = useCallback(
    (id, patch) => {
      const currentSource = (config.icsSources || []).find(
        (source) => source.id === id,
      );
      if (
        patch.enabled === false ||
        (patch.url !== undefined && patch.url !== currentSource?.url)
      ) {
        clearCachedIcsSource(id);
      }
      const sources = (config.icsSources || []).map((s) =>
        s.id === id ? { ...s, ...patch } : s,
      );
      persist({ ...config, icsSources: sources });
    },
    [config, persist],
  );

  const removeIcsSource = useCallback(
    (id) => {
      clearCachedIcsSource(id);
      const sources = (config.icsSources || []).filter((s) => s.id !== id);
      persist({ ...config, icsSources: sources });
    },
    [config, persist],
  );

  const addLocalEventAndRefresh = useCallback(
    (event) => {
      persistLocalEvent(event);
      refresh();
    },
    [refresh],
  );

  const removeLocalEventAndRefresh = useCallback(
    (id) => {
      deleteLocalEvent(id);
      refresh();
    },
    [refresh],
  );

  const updateLocalEventAndRefresh = useCallback(
    (id, updates) => {
      patchLocalEvent(id, updates);
      refresh();
    },
    [refresh],
  );

  const removeDeviceEventAndRefresh = useCallback(
    async (id) => {
      await deleteDeviceEvent(id);
      refresh();
    },
    [refresh],
  );

  const updateDeviceEventAndRefresh = useCallback(
    async (id, updates) => {
      await updateDeviceEvent(id, updates);
      refresh();
    },
    [refresh],
  );

  const toggleReminderCompleted = useCallback(
    async (raw, completed) => {
      if (!raw) return;
      if (raw.sourceType === 'reminder') {
        await setDeviceReminderCompleted(raw.id, completed);
      } else if (raw.sourceType === 'local') {
        patchLocalEvent(raw.id, { isCompleted: completed });
      }
      refresh();
    },
    [refresh],
  );

  const updateDeviceReminderAndRefresh = useCallback(
    async (id, updates) => {
      await updateDeviceReminder(id, updates);
      refresh();
    },
    [refresh],
  );

  const removeDeviceReminderAndRefresh = useCallback(
    async (id) => {
      await deleteDeviceReminder(id);
      refresh();
    },
    [refresh],
  );

  const setLocalCalendarColor = useCallback(
    (color) => persist({ ...config, localCalendarColor: color }),
    [config, persist],
  );

  const setLocalCalendarName = useCallback(
    (name) => persist({ ...config, localCalendarName: name }),
    [config, persist],
  );

  /** Returns display-ready events `{ color, name, time_note, desc, sourceType }` for a date. */
  const eventsForDate = useCallback(
    (date) => {
      if (!date) return [];
      const key = dayKey(date);
      const real = eventsByDay.get(key) || [];
      const dayStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
      const dayEnd = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59,
        999,
      );
      const opt = optimisticEvents.filter(
        (ev) => ev.end >= dayStart && ev.start <= dayEnd,
      );
      return [...real, ...opt].sort(byAllDayThenStart).map((ev) => ({
        color: ev.color,
        name: ev.title,
        location: ev.location,
        desc: ev.notes,
        sourceType: ev.sourceType,
        time_note: formatTimeNote(ev),
        _raw: ev,
      }));
    },
    [eventsByDay, optimisticEvents],
  );

  const value = useMemo(
    () => ({
      config,
      loading,
      eventsForDate,
      colorForIndex,
      refresh,
      setDeviceCalendarEnabled,
      setDeviceCalendarPref,
      addIcsSource,
      updateIcsSource,
      removeIcsSource,
      setLocalCalendarColor,
      setLocalCalendarName,
      addLocalEventAndRefresh,
      removeLocalEventAndRefresh,
      updateLocalEventAndRefresh,
      addOptimisticEvent,
      removeDeviceEventAndRefresh,
      updateDeviceEventAndRefresh,
      toggleReminderCompleted,
      updateDeviceReminderAndRefresh,
      removeDeviceReminderAndRefresh,
    }),
    [
      config,
      loading,
      eventsForDate,
      refresh,
      setDeviceCalendarEnabled,
      setDeviceCalendarPref,
      addIcsSource,
      updateIcsSource,
      removeIcsSource,
      setLocalCalendarColor,
      setLocalCalendarName,
      addLocalEventAndRefresh,
      removeLocalEventAndRefresh,
      updateLocalEventAndRefresh,
      addOptimisticEvent,
      removeDeviceEventAndRefresh,
      updateDeviceEventAndRefresh,
      toggleReminderCompleted,
      updateDeviceReminderAndRefresh,
      removeDeviceReminderAndRefresh,
    ],
  );

  return (
    <PersonalEventsContext.Provider value={value}>
      {children}
    </PersonalEventsContext.Provider>
  );
}

export function usePersonalEvents() {
  const ctx = useContext(PersonalEventsContext);
  if (!ctx) {
    return {
      config: {
        deviceCalendarEnabled: false,
        deviceCalendars: {},
        icsSources: [],
      },
      loading: false,
      eventsForDate: () => [],
      colorForIndex,
      refresh: () => {},
      setDeviceCalendarEnabled: () => {},
      setDeviceCalendarPref: () => {},
      addIcsSource: () => {},
      updateIcsSource: () => {},
      removeIcsSource: () => {},
      setLocalCalendarColor: () => {},
      addLocalEventAndRefresh: () => {},
      addOptimisticEvent: () => {},
      removeDeviceEventAndRefresh: async () => {},
      updateDeviceEventAndRefresh: async () => {},
      toggleReminderCompleted: async () => {},
      updateDeviceReminderAndRefresh: async () => {},
      removeDeviceReminderAndRefresh: async () => {},
    };
  }
  return ctx;
}
