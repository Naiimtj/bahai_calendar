import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { reverseGeocode } from '../services/geocodingApi';
import { BaseAnchor, BaseIcon } from './base';
import BaseButton from './base/BaseButton';
import BaseSpinner from './base/BaseSpinner';
import BaseTextInput from './base/BaseTextInput';

const OPEN_METEO_URL = 'https://open-meteo.com/';

export default function LocationPicker({
  location,
  onLocationChange,
  onClear,
  language,
  showHint = false,
  className = '',
}) {
  const { t } = useTranslation();
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setLoadingCities(false);
      return undefined;
    }

    setLoadingCities(true);
    const timer = setTimeout(() => {
      fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=${language}`,
      )
        .then((response) => response.json())
        .then((data) => setSuggestions(data.results || []))
        .catch(() => setSuggestions([]))
        .finally(() => setLoadingCities(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [language, query]);

  const resetSearch = () => {
    setShowSearch(false);
    setQuery('');
    setSuggestions([]);
  };

  const saveLocation = (nextLocation) => {
    onLocationChange(nextLocation);
    resetSearch();
    setError(null);
  };

  const handleGPS = async () => {
    if (loadingGPS) return;
    setError(null);
    setLoadingGPS(true);

    try {
      let coords;
      if (Capacitor.isNativePlatform()) {
        const { Geolocation } = await import('@capacitor/geolocation');
        await Geolocation.requestPermissions();
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 600000,
        });
        coords = position.coords;
      } else {
        coords = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(
            (position) => resolve(position.coords),
            reject,
            { enableHighAccuracy: true },
          ),
        );
      }

      const name =
        (await reverseGeocode(coords.latitude, coords.longitude, language)) ||
        t('fasting.myLocation');
      saveLocation({ lat: coords.latitude, lon: coords.longitude, name });
    } catch {
      setError(t('fasting.locationError'));
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

  const gpsAvailable =
    Capacitor.isNativePlatform() ||
    (window.isSecureContext && 'geolocation' in navigator);

  return (
    <div className={className}>
      {location ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0">
            <BaseIcon icon="locationOn" size="xs" className="fill-gray-400" />
            <span className="text-sm text-primary-text truncate">
              {location.name}
            </span>
          </div>
          <BaseIcon
            icon="close"
            size="xs"
            className="fill-primary-dark dark:fill-primary md:dark:hover:fill-primary-light md:hover:fill-primary "
            onClick={onClear}
          />
        </div>
      ) : !showSearch && !loadingGPS ? (
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
              setError(null);
            }}
            className="flex-1 text-xs"
          />
        </div>
      ) : null}

      {loadingGPS && (
        <div className="flex justify-center py-2">
          <BaseSpinner />
        </div>
      )}

      {showSearch && !location && (
        <div className="flex flex-col gap-2 items-end">
          <div className="flex flex-col w-full">
            <BaseTextInput
              value={query}
              onChange={setQuery}
              placeholder={t('fasting.cityPlaceholder')}
              autoFocus
            />
            {loadingCities && (
              <div className="mt-3">
                <BaseSpinner />
              </div>
            )}
            {suggestions.length > 0 && (
              <>
                <div className="mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                  {suggestions.map((city) => (
                    <BaseButton
                      key={city.id}
                      type="button"
                      text
                      onClick={() => handleSelectCity(city)}
                      className="w-full !justify-start !rounded-none text-left px-3 py-2 text-sm border-b border-gray-100 dark:border-gray-800 last:border-0 md:hover:bg-gray-100 md:dark:hover:bg-gray-800"
                    >
                      {city.name}
                      {city.admin1 ? `, ${city.admin1}` : ''}, {city.country}
                    </BaseButton>
                  ))}
                </div>
                <BaseAnchor
                  href={OPEN_METEO_URL}
                  size="xs"
                  label={t('fasting.locationDataCredit')}
                  className="mt-1 self-start px-0 text-gray-500 dark:text-gray-400"
                />
              </>
            )}
          </div>
          <BaseButton onClick={resetSearch} className="mt-2" text>
            {t('fasting.cancel')}
          </BaseButton>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      {!location && !showSearch && !loadingGPS && showHint && (
        <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
          {t('settings.locationHint')}
        </p>
      )}
    </div>
  );
}
