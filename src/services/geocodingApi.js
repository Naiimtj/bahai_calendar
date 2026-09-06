import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar } from '../native/bahaiCalendarNative';

const BASE_URL = 'https://geocoding-api.open-meteo.com/v1';

function supportsNativeIosPlaceSearch() {
  return (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === 'ios' &&
    typeof CapacitorCalendar.searchMapPlaces === 'function'
  );
}

/**
 * Search locations by name. Returns up to `count` results.
 * @param {string} name
 * @param {{ count?: number, language?: string }} options
 * @returns {Promise<Array>}
 */
export async function searchLocations(
  name,
  { count = 5, language = 'es' } = {},
) {
  const url = `${BASE_URL}/search?name=${encodeURIComponent(name)}&count=${count}&language=${language}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

/**
 * Search places for Add Event using native iOS Maps when available,
 * otherwise fall back to Open-Meteo geocoding.
 * @param {string} name
 * @param {{ count?: number, language?: string }} options
 * @returns {Promise<Array>}
 */
export async function searchEventLocations(
  name,
  { count = 5, language = 'es' } = {},
) {
  const query = typeof name === 'string' ? name.trim() : '';
  if (!query) return [];

  if (supportsNativeIosPlaceSearch()) {
    try {
      const nativeRes = await CapacitorCalendar.searchMapPlaces({
        query,
        count,
      });
      const nativeList = Array.isArray(nativeRes?.result)
        ? nativeRes.result
        : [];
      if (nativeList.length > 0) return nativeList;
    } catch {
      // Fall back to Open-Meteo when native search fails.
    }
  }

  return searchLocations(query, { count, language });
}

/**
 * Reverse geocode coordinates into a human-readable "City, Country" label.
 * @param {number} lat
 * @param {number} lon
 * @param {string} [language]
 * @returns {Promise<string|null>} label, or null if it can't be resolved
 */
export async function reverseGeocode(lat, lon, language = 'en') {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${language}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const city = data.city || data.locality || '';
    const parts = [city, data.principalSubdivision, data.countryName].filter(
      Boolean,
    );
    return parts.length ? parts.join(', ') : null;
  } catch {
    return null;
  }
}
