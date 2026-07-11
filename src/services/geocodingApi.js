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
