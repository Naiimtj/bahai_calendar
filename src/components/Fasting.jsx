import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { useSettings } from '../context/SettingsContext';
import { useBadiYear } from '../context/BadiYearContext';
import { formatGregorianDate } from '../lib/badiDate';
import BaseSpinner from './base/BaseSpinner';
import { BaseIcon } from './base';
import BaseButton from './base/BaseButton';
import { fetchFastingSunTimes } from '../services/sunTimesApi';
import { reverseGeocode } from '../services/geocodingApi';

export default function Fasting() {
  const { lang } = useSettings();
  const { t } = useTranslation();
  const { allEvents, gregorianToBadi, badiToGregorian, loading } =
    useBadiYear();
  const today = useMemo(() => new Date(), []);
  const badi = useMemo(() => gregorianToBadi(today), [gregorianToBadi, today]);

  // Derive fasting dates from API events or badiToGregorian
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

  // ── Location & sun times ──
  const [location, setLocation] = useState(() => {
    try {
      const s = localStorage.getItem('bahai-location');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [sunTimes, setSunTimes] = useState(null);
  const [loadingSun, setLoadingSun] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [locError, setLocError] = useState(null);

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

  useEffect(() => {
    if (!cityQuery.trim() || cityQuery.length < 2) {
      setCitySuggestions([]);
      setLoadingCities(false);
      return;
    }
    setLoadingCities(true);
    const timer = setTimeout(() => {
      fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery)}&count=5&language=${lang}`,
      )
        .then((r) => r.json())
        .then((data) => setCitySuggestions(data.results || []))
        .catch(() => setCitySuggestions([]))
        .finally(() => setLoadingCities(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [cityQuery, lang]);

  const saveLocation = (loc) => {
    localStorage.setItem('bahai-location', JSON.stringify(loc));
    setLocation(loc);
    setShowSearch(false);
    setCityQuery('');
    setCitySuggestions([]);
    setLocError(null);
  };

  const gpsAvailable =
    Capacitor.isNativePlatform() || window.location.protocol === 'https:';

  const handleGPS = async () => {
    if (loadingGPS) return;
    setLocError(null);
    setLoadingGPS(true);
    try {
      let coords;
      if (Capacitor.isNativePlatform()) {
        const { Geolocation } = await import('@capacitor/geolocation');
        await Geolocation.requestPermissions();
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
        });
        coords = pos.coords;
      } else {
        coords = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(
            (p) => resolve(p.coords),
            reject,
            { enableHighAccuracy: true },
          ),
        );
      }
      const name =
        (await reverseGeocode(coords.latitude, coords.longitude, lang)) ||
        t('fasting.myLocation');
      saveLocation({
        lat: coords.latitude,
        lon: coords.longitude,
        name,
      });
    } catch {
      setLocError(t('fasting.locationError'));
    } finally {
      setLoadingGPS(false);
    }
  };

  const handleSelectCity = (city) => {
    saveLocation({
      lat: city.latitude,
      lon: city.longitude,
      name: `${city.name}${city.admin1 ? `, ${city.admin1}` : ''}, ${city.country}`,
    });
  };

  const handleClearLocation = () => {
    localStorage.removeItem('bahai-location');
    setLocation(null);
    setSunTimes(null);
    setLocError(null);
  };

  const formatTime = (date) =>
    new Intl.DateTimeFormat(lang, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);

  if (loading || !fast) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <BaseSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-auto px-4 py-6">
      <div className="text-center mb-8">
        <img
          src="/static/icons/fast_icon.png"
          alt="Fasting"
          className="mx-auto mb-4 w-24 h-24"
        />
        <h2 className="text-2xl font-bold text-primary-text">
          {t('fasting.theFast')}
        </h2>
        <p className="text-gray-400 mt-1">{t('fasting.monthAla')}</p>
      </div>

      <div className="rounded-xl p-5 mb-4 bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          {isFasting ? (
            <>
              <div className="text-primary-text text-lg font-semibold mb-2">
                {t('fasting.fastUnderway')}
              </div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                {daysRemaining}
              </div>
              <div className="text-gray-400">{t('fasting.daysRemaining')}</div>
            </>
          ) : (
            <>
              <div className="text-gray-400 text-sm mb-2">
                {t('fasting.nextFastIn')}
              </div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                {daysUntil}
              </div>
              <div className="text-gray-400">{t('fasting.days')}</div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl p-4 space-y-3 bg-gray-100 dark:bg-gray-800">
        <div className="flex justify-between">
          <span className="text-gray-400">{t('fasting.start')}</span>
          <span className="dark:text-white text-gray-900">
            {formatGregorianDate(fast.start, lang)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">{t('fasting.end')}</span>
          <span className="dark:text-white text-gray-900">
            {formatGregorianDate(fast.end, lang)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">{t('fasting.bahaiYear')}</span>
          <span className="text-primary-text font-medium">{fastYear} B.E.</span>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500 text-center leading-relaxed">
        {t('fasting.description')}
      </div>

      {/* Sun Times Section */}
      <div className="rounded-xl p-2 md:p-4 bg-gray-100 dark:bg-gray-800 mt-4">
        <div className="flex md:flex-row flex-col md:gap-0 gap-2 items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            {t('fasting.sunTimes')}
          </span>
          <div className="flex items-center justify-end gap-1">
            {location && (
              <>
                <BaseIcon
                  icon="locationOn"
                  size="xs"
                  className="fill-gray-400"
                />
                <span className="text-xs text-gray-400">{location.name}</span>
                <BaseIcon
                  icon="delete"
                  className="stroke-gray-400 md:hover:stroke-red-500 cursor-pointer size-4"
                  onClick={handleClearLocation}
                />
              </>
            )}
          </div>
        </div>

        {!location && !showSearch && !loadingGPS && (
          <div className="flex gap-2">
            {gpsAvailable && (
              <BaseButton
                label={t('fasting.useMyLocation')}
                icon="locationOn"
                outlined
                onClick={handleGPS}
                className="flex-1 text-xs"
              />
            )}
            <BaseButton
              label={t('fasting.searchCity')}
              icon="search"
              outlined
              onClick={() => {
                setShowSearch(true);
                setLocError(null);
              }}
              className="flex-1 text-xs"
            />
          </div>
        )}

        {loadingGPS && (
          <div className="flex justify-center py-2">
            <BaseSpinner size="sm" noCurrentQuote />
          </div>
        )}

        {showSearch && !location && (
          <div>
            <div className="relative">
              <input
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                placeholder={t('fasting.cityPlaceholder')}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-primary-text px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {loadingCities && (
                <div className="absolute right-2 top-2">
                  <BaseSpinner size="sm" noCurrentQuote />
                </div>
              )}
            </div>
            {citySuggestions.length > 0 && (
              <div className="mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                {citySuggestions.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleSelectCity(city)}
                    className="w-full text-left px-3 py-2 text-sm text-primary-text hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    {city.name}
                    {city.admin1 ? `, ${city.admin1}` : ''}, {city.country}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setCityQuery('');
                setCitySuggestions([]);
              }}
              className="mt-2 text-xs text-gray-400 underline"
            >
              {t('fasting.cancel')}
            </button>
          </div>
        )}

        {location && (
          <div>
            {loadingSun ? (
              <div className="flex justify-center py-3">
                <BaseSpinner size="sm" noCurrentQuote />
              </div>
            ) : (
              sunTimes && (
                <div className="">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-xs text-gray-400">
                        <th className="text-center pb-1 font-normal">
                          {t('fasting.day')}
                        </th>
                        <th className="text-center pb-1 font-normal">
                          {t('fasting.date')}
                        </th>
                        <th className="text-center pb-1 font-normal">
                          <BaseIcon
                            icon="sunrise"
                            size="xs"
                            color="#FBBF24"
                            className="inline mr-1"
                          />
                          {t('fasting.sunrise')}
                        </th>
                        <th className="text-center pb-1 font-normal">
                          <BaseIcon
                            icon="sunset"
                            size="xs"
                            color="#FB923C"
                            className="inline mr-1"
                          />
                          {t('fasting.sunset')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sunTimes.map((entry, i) => {
                        const isToday =
                          entry.date.toDateString() === today.toDateString();
                        return (
                          <tr
                            key={entry.date.toISOString()}
                            className={
                              isToday
                                ? 'bg-blue-500/10'
                                : 'border-t border-gray-200 dark:border-gray-700'
                            }
                          >
                            <td
                              className={`py-1 text-center ${
                                isToday
                                  ? 'font-semibold text-primary-text'
                                  : 'text-gray-400'
                              }`}
                            >
                              {i + 1}
                            </td>
                            <td
                              className={`py-1 text-center ${
                                isToday
                                  ? 'font-semibold text-primary-text'
                                  : 'text-gray-400'
                              }`}
                            >
                              {new Intl.DateTimeFormat(lang, {
                                month: 'short',
                                day: 'numeric',
                              }).format(entry.date)}
                            </td>
                            <td
                              className={`text-center py-1 tabular-nums ${
                                isToday
                                  ? 'font-semibold text-primary-text'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {formatTime(entry.sunrise)}
                            </td>
                            <td
                              className={`text-center py-1 tabular-nums ${
                                isToday
                                  ? 'font-semibold text-primary-text'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {formatTime(entry.sunset)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        )}

        {locError && <p className="text-red-400 text-xs mt-2">{locError}</p>}
      </div>
    </div>
  );
}
