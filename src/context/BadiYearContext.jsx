import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { fetchBadiYear } from '../services/badiApi';
import { useSettings } from './SettingsContext';

const BadiYearContext = createContext(null);

/* ── helpers ── */

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Build a sorted lookup of month start dates from API data. */
function buildMonthStarts(apiMonths) {
  // API returns months 1-19 + 0 (Ayyám-i-Há) with gregorian_date
  // Sort so we can binary-search by Gregorian date
  const entries = apiMonths.map((m) => ({
    badiMonth: m.badi_month,
    name: m.badi_month_name,
    start: parseDate(m.gregorian_date),
    desc: m.desc,
    info: m.info,
  }));

  // Sort by Gregorian start ascending
  entries.sort((a, b) => a.start - b.start);
  return entries;
}

/** Derive Gregorian date from Badí' date using the month-starts lookup. */
function badiToGregorianFromLookup(badiMonth, badiDay, monthStarts) {
  const entry = monthStarts.find((m) => m.badiMonth === badiMonth);
  if (!entry) return null;
  const result = new Date(entry.start);
  result.setDate(result.getDate() + badiDay - 1);
  return result;
}

/* ── Provider ── */

export function BadiYearProvider({ children }) {
  const { lang } = useSettings();

  // Track which Gregorian years are loaded
  const [yearDataMap, setYearDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Current Gregorian year + next (a Badí' year spans two)
  const today = useMemo(() => new Date(), []);
  const currentGregYear = today.getFullYear();

  const loadYear = useCallback(
    async (gregYear) => {
      if (yearDataMap[gregYear]) return yearDataMap[gregYear];
      try {
        const data = await fetchBadiYear(gregYear, lang);
        setYearDataMap((prev) => ({ ...prev, [gregYear]: data }));
        return data;
      } catch (err) {
        setError(err);
        return null;
      }
    },
    [lang, yearDataMap],
  );

  // Bootstrap: load prev + current + next year
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setYearDataMap({});

    Promise.all([
      fetchBadiYear(currentGregYear - 1, lang),
      fetchBadiYear(currentGregYear, lang),
      fetchBadiYear(currentGregYear + 1, lang),
    ])
      .then(([prev, cur, next]) => {
        if (cancelled) return;
        setYearDataMap({
          [currentGregYear - 1]: prev,
          [currentGregYear]: cur,
          [currentGregYear + 1]: next,
        });
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentGregYear, lang]);

  /**
   * Load gregYear-1, gregYear, gregYear+1 concurrently.
   * Safe to call from useEffect — only depends on lang, not yearDataMap.
   * fetchBadiYear deduplicates concurrent requests for the same year.
   */
  const loadYearsAround = useCallback(
    (gregYear) => {
      const years = [gregYear - 1, gregYear, gregYear + 1];
      Promise.all(years.map((y) => fetchBadiYear(y, lang)))
        .then((results) => {
          setYearDataMap((prev) => {
            const next = { ...prev };
            years.forEach((y, i) => {
              next[y] = results[i];
            });
            return next;
          });
        })
        .catch((err) => setError(err));
    },
    [lang],
  );

  // Build combined month starts + events from all loaded years
  const { allMonthStarts, allEvents, badiYearForGreg } = useMemo(() => {
    const starts = [];
    const events = [];
    const yearMap = {}; // gregYear → badiYear (from Naw-Rúz)

    Object.entries(yearDataMap).forEach(([gregYear, data]) => {
      if (!data?.months?.length) return;
      const ms = buildMonthStarts(data.months);
      ms.forEach((m) => {
        m.gregYear = Number(gregYear);
      });
      starts.push(...ms);

      (data.events || []).forEach((ev) => {
        events.push({
          ...ev,
          gregDate: parseDate(ev.gregorian_date),
          gregYear: Number(gregYear),
        });
      });

      // badiYear is gregYear of Naw-Rúz for months 1-19
      yearMap[Number(gregYear)] = Number(gregYear) - 1843;
    });

    starts.sort((a, b) => a.start - b.start);
    events.sort((a, b) => a.gregDate - b.gregDate);

    return {
      allMonthStarts: starts,
      allEvents: events,
      badiYearForGreg: yearMap,
    };
  }, [yearDataMap]);

  // Public conversion: Gregorian → Badí'
  const gregorianToBadi = useCallback(
    (date) => {
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      // Find the right gregYear context
      for (let i = allMonthStarts.length - 1; i >= 0; i--) {
        if (d >= allMonthStarts[i].start) {
          const badiYear = badiYearForGreg[allMonthStarts[i].gregYear];
          const diffMs = d - allMonthStarts[i].start;
          const day = Math.round(diffMs / 86400000) + 1;
          return { year: badiYear, month: allMonthStarts[i].badiMonth, day };
        }
      }
      return null;
    },
    [allMonthStarts, badiYearForGreg],
  );

  // Public conversion: Badí' → Gregorian
  const badiToGregorian = useCallback(
    (badiYear, month, day) => {
      const gregYear = badiYear + 1843;
      const data = yearDataMap[gregYear];
      if (!data?.months?.length) return null;
      const ms = buildMonthStarts(data.months);
      return badiToGregorianFromLookup(month, day, ms);
    },
    [yearDataMap],
  );

  // Get holy day for a Gregorian date — returns compat shape { en, es, ar, suspend, event, desc, url }
  const getHolyDayForDate = useCallback(
    (date) => {
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const ev = allEvents.find((e) => sameDay(e.gregDate, d));
      if (!ev) return null;
      // Build a shape compatible with the old FIXED_HOLY_DAYS usage
      const name = ev.event;
      return {
        en: name,
        es: name,
        ar: name,
        suspend:
          /Naw-Rúz|Riḍván|Declaración|Ascensión|Martirio|Nacimiento/.test(name),
        event: name,
        desc: ev.desc,
        url: ev.url,
        time_note: ev.time_note || '',
      };
    },
    [allEvents],
  );

  // Check if date is in Riḍván period
  const isRidvanPeriod = useCallback(
    (date) => {
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      // Find 1st day of Riḍván in events
      const ridvan1 = allEvents.find(
        (ev) => ev.badi_month === 2 && ev.badi_day === 13,
      );
      if (!ridvan1) return false;
      const end = new Date(ridvan1.gregDate);
      end.setDate(end.getDate() + 11);
      return d >= ridvan1.gregDate && d <= end;
    },
    [allEvents],
  );

  // Get all events for a Badí' year
  const getEventsForYear = useCallback(
    (gregYear) => {
      return allEvents.filter((ev) => ev.gregYear === gregYear);
    },
    [allEvents],
  );

  // Get Ayyám-i-Há days count from API data
  const getAyyamiHaDays = useCallback(
    (badiYear) => {
      const gregYear = badiYear + 1843;
      const data = yearDataMap[gregYear];
      if (!data) return 4;
      const ayyamiEvents = data.events.filter((e) => e.badi_month === 0);
      return ayyamiEvents.length || 4;
    },
    [yearDataMap],
  );

  const value = useMemo(
    () => ({
      loading,
      error,
      yearDataMap,
      loadYear,
      loadYearsAround,
      gregorianToBadi,
      badiToGregorian,
      getHolyDayForDate,
      isRidvanPeriod,
      getEventsForYear,
      getAyyamiHaDays,
      allEvents,
      allMonthStarts,
    }),
    [
      loading,
      error,
      yearDataMap,
      loadYear,
      loadYearsAround,
      gregorianToBadi,
      badiToGregorian,
      getHolyDayForDate,
      isRidvanPeriod,
      getEventsForYear,
      getAyyamiHaDays,
      allEvents,
      allMonthStarts,
    ],
  );

  return (
    <BadiYearContext.Provider value={value}>
      {children}
    </BadiYearContext.Provider>
  );
}

export function useBadiYear() {
  const ctx = useContext(BadiYearContext);
  if (!ctx) throw new Error('useBadiYear must be inside BadiYearProvider');
  return ctx;
}
