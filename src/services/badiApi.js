import { getCompleteData } from '../lib/badiCalendar';

// Bahá'í calendar data is computed locally (no backend). Results are memoised
// per Gregorian-year + language. The async signature is kept so existing
// callers (BadiYearContext) need no changes.
const cache = {};

export async function fetchBadiYear(gregYear, lang = 'es') {
  const key = `${gregYear}_${lang}`;
  if (cache[key]) return cache[key];

  const promise = Promise.resolve()
    .then(() => {
      const data = getCompleteData(gregYear, lang);
      if (!data?.months?.length) throw new Error('Invalid calendar data');
      return data;
    })
    .catch((err) => {
      delete cache[key];
      throw err;
    });
  cache[key] = promise;
  return promise;
}

export function clearCache() {
  Object.keys(cache).forEach((k) => delete cache[k]);
}
