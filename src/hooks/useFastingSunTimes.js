import { useMemo, useState, useEffect } from 'react';
import { useBadiYear } from '../context/BadiYearContext';
import { fetchFastingSunTimes } from '../services/sunTimesApi';

/**
 * Computes the current-or-next Bahá'í Fast period and, once a location is
 * saved, fetches its sunrise/sunset times. Shared by the Fasting page and the
 * notification settings so fasting alarms can be reviewed/edited from either
 * screen against the same data.
 */
export function useFastingSunTimes() {
  const { allEvents, gregorianToBadi, badiToGregorian, loading } =
    useBadiYear();
  const today = useMemo(() => new Date(), []);
  const badi = useMemo(() => gregorianToBadi(today), [gregorianToBadi, today]);

  const { fast, fastYear, isFasting, daysUntil, daysRemaining } =
    useMemo(() => {
      const year = badi?.year || 183;
      const empty = {
        fast: null,
        fastYear: year,
        isFasting: false,
        daysUntil: 0,
        daysRemaining: 0,
      };

      // Find current-or-next fasting period: the first fast whose end >= today
      const relevantEnd = allEvents.find(
        (e) => e.badi_month === 19 && e.badi_day === 19 && e.gregDate >= today,
      );

      let start, end, _fastYear;

      if (relevantEnd) {
        end = relevantEnd.gregDate;
        _fastYear = relevantEnd.gregYear - 1843;
        const relevantStart = allEvents.find(
          (e) =>
            e.badi_month === 19 &&
            e.badi_day === 1 &&
            e.gregYear === relevantEnd.gregYear,
        );
        start = relevantStart?.gregDate;
      }

      // Fallback: derive from badiToGregorian
      if (!start || !end) {
        start = badiToGregorian(year, 19, 1);
        end = badiToGregorian(year, 19, 19);
        _fastYear = year;
        // If current year's fast already passed, try next year
        if (!start || !end || end < today) {
          start = badiToGregorian(year + 1, 19, 1);
          end = badiToGregorian(year + 1, 19, 19);
          _fastYear = year + 1;
        }
      }

      if (!start || !end) return empty;

      const fasting = today >= start && today <= end;
      const _daysUntil = fasting ? 0 : Math.ceil((start - today) / 86400000);
      const _daysRemaining = fasting
        ? Math.ceil((end - today) / 86400000) + 1
        : 0;

      return {
        fast: { start, end },
        fastYear: _fastYear,
        isFasting: fasting,
        daysUntil: _daysUntil,
        daysRemaining: _daysRemaining,
      };
    }, [allEvents, badi, today, badiToGregorian]);

  // Stable timestamps to avoid object-identity re-renders in the sun-times effect
  const fastStartMs = fast?.start?.getTime() ?? null;
  const fastEndMs = fast?.end?.getTime() ?? null;

  const [location, setLocationState] = useState(() => {
    try {
      const s = localStorage.getItem('bahai-location');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [sunTimes, setSunTimes] = useState(null);
  const [loadingSun, setLoadingSun] = useState(false);

  useEffect(() => {
    if (!location || fastStartMs === null || fastEndMs === null) {
      setSunTimes(null);
      return;
    }
    const cacheKey = `bahai-suntimes-${location.lat.toFixed(4)}-${location.lon.toFixed(4)}-${new Date(fastStartMs).toISOString().slice(0, 10)}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached).map((r) => ({
          date: new Date(r.date),
          sunrise: new Date(r.sunrise),
          sunset: new Date(r.sunset),
        }));
        setSunTimes(parsed);
        return;
      }
    } catch {
      // corrupt cache, fall through to fetch
    }
    setLoadingSun(true);
    const controller = new AbortController();
    fetchFastingSunTimes(
      location.lat,
      location.lon,
      new Date(fastStartMs),
      new Date(fastEndMs),
      controller.signal,
    )
      .then((results) => {
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify(
              results.map((r) => ({
                date: r.date.toISOString(),
                sunrise: r.sunrise.toISOString(),
                sunset: r.sunset.toISOString(),
              })),
            ),
          );
        } catch {
          // storage full or unavailable
        }
        setSunTimes(results);
        setLoadingSun(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setLoadingSun(false);
      });
    return () => {
      controller.abort();
    };
  }, [location, fastStartMs, fastEndMs]);

  const saveLocation = (loc) => {
    localStorage.setItem('bahai-location', JSON.stringify(loc));
    setLocationState(loc);
  };

  const clearLocation = () => {
    localStorage.removeItem('bahai-location');
    setLocationState(null);
    setSunTimes(null);
  };

  return {
    today,
    fast,
    fastYear,
    isFasting,
    daysUntil,
    daysRemaining,
    loading,
    location,
    saveLocation,
    clearLocation,
    sunTimes,
    loadingSun,
  };
}
