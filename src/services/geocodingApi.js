const BASE_URL = 'https://geocoding-api.open-meteo.com/v1';

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
