import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar } from '../native/bahaiCalendarNative';

const BASE_URL = 'https://geocoding-api.open-meteo.com/v1';
const PLACES_URL = 'https://photon.komoot.io/api/';
// Public Photon rejects unsupported lang values with HTTP 400.
const PLACES_LANGUAGES = ['en', 'de', 'fr'];

function textValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function joinAddress(parts, name) {
  return [...new Set(parts.map(textValue))]
    .filter((part) => part && part !== name)
    .join(', ');
}

function toPlace(item, index) {
  const name = textValue(item?.name);
  const address = textValue(item?.address);
  const latitude = item?.latitude;
  const longitude = item?.longitude;

  if (
    !name ||
    !(typeof latitude === 'number' && Number.isFinite(latitude)) ||
    !(typeof longitude === 'number' && Number.isFinite(longitude))
  ) {
    return null;
  }

  return {
    id: String(item.id ?? `place-${index}`),
    name,
    address:
      (address.startsWith(`${name}, `)
        ? address.slice(name.length + 2)
        : address) || joinAddress([item.admin1, item.country], name),
    latitude,
    longitude,
  };
}

function photonFeatureToPlace(feature, index) {
  const coordinates = feature?.geometry?.coordinates;
  if (!Array.isArray(coordinates)) return null;

  const [longitude, latitude] = coordinates;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const props = feature?.properties ?? {};
  const street = [textValue(props.street), textValue(props.housenumber)]
    .filter(Boolean)
    .join(' ');
  const locality = [textValue(props.postcode), textValue(props.city)]
    .filter(Boolean)
    .join(' ');
  const name =
    textValue(props.name) ||
    street ||
    locality ||
    textValue(props.state) ||
    textValue(props.country);

  if (!name) return null;

  return {
    id:
      props.osm_type && props.osm_id
        ? `${props.osm_type}${props.osm_id}`
        : `place-${index}`,
    name,
    address: joinAddress([street, locality, props.state, props.country], name),
    latitude,
    longitude,
  };
}

async function searchPlaces(query, { count = 5, language = 'es' } = {}) {
  const params = new URLSearchParams({
    q: query,
    limit: String(count),
    lang: PLACES_LANGUAGES.includes(language) ? language : 'default',
  });
  const res = await fetch(`${PLACES_URL}?${params}`);
  if (!res.ok) {
    throw new Error(`Place search failed: ${res.status}`);
  }
  const data = await res.json();
  const features = Array.isArray(data?.features) ? data.features : [];
  return features.map(photonFeatureToPlace).filter(Boolean);
}

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
 * Search places (POIs, addresses, cities) for Add Event using native iOS MapKit
 * when available, then OpenStreetMap (Photon), then Open-Meteo cities if Photon fails.
 * @param {string} name
 * @param {{ count?: number, language?: string }} options
 * @returns {Promise<Array<{ id: string, name: string, address: string, latitude: number, longitude: number }>>}
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
      const places = nativeList.map(toPlace).filter(Boolean);
      if (places.length > 0) return places;
    } catch {
      // Fall back to OpenStreetMap search when native search fails.
    }
  }

  try {
    return await searchPlaces(query, { count, language });
  } catch {
    const cities = await searchLocations(query, { count, language });
    return cities.map(toPlace).filter(Boolean);
  }
}

/**
 * Reverse geocode coordinates into a human-readable "City, Country" label.
 * On iOS this uses Apple's geocoder, so coordinates are never sent to BigDataCloud.
 * @param {number} lat
 * @param {number} lon
 * @param {string} [language]
 * @returns {Promise<string|null>} label, or null if it can't be resolved
 */
export async function reverseGeocode(lat, lon, language = 'en') {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
    try {
      const res = await CapacitorCalendar.reverseGeocode({
        latitude: lat,
        longitude: lon,
        language,
      });
      const place = res?.result ?? {};
      const parts = [
        ...new Set(
          [place.city, place.region, place.country]
            .map(textValue)
            .filter(Boolean),
        ),
      ];
      return parts.length ? parts.join(', ') : null;
    } catch {
      return null;
    }
  }

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
