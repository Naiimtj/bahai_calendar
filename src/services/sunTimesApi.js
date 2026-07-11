const CONCURRENCY = 3;
const BATCH_DELAY_MS = 1000;

/**
 * Fetches the sunset time for a single date at the given coordinates.
 * Returns a Date (UTC) or null on failure.
 */
export async function fetchSunsetForDate(lat, lon, date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  try {
    const res = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${y}-${m}-${d}&formatted=0`,
    );
    const data = await res.json();
    if (data.status !== 'OK') return null;
    return new Date(data.results.sunset);
  } catch {
    return null;
  }
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted)
      return reject(new DOMException('Aborted', 'AbortError'));
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(id);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

function fetchDay(lat, lon, date, signal) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return fetch(
    `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${y}-${m}-${d}&formatted=0`,
    { signal },
  )
    .then((r) => r.json())
    .then((data) =>
      data.status === 'OK'
        ? {
            date,
            sunrise: new Date(data.results.sunrise),
            sunset: new Date(data.results.sunset),
          }
        : null,
    )
    .catch((err) => {
      if (err.name === 'AbortError') throw err;
      return null;
    });
}

/**
 * Fetches sunrise/sunset for every day between startDate and endDate
 * (inclusive), at most CONCURRENCY requests in-flight at once.
 * Pass an AbortSignal to cancel in-flight requests.
 */
export async function fetchFastingSunTimes(
  lat,
  lon,
  startDate,
  endDate,
  signal,
) {
  const dates = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const results = [];
  for (let i = 0; i < dates.length; i += CONCURRENCY) {
    if (i > 0) await delay(BATCH_DELAY_MS, signal);
    const batch = dates.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((d) => fetchDay(lat, lon, d, signal)),
    );
    results.push(...batchResults);
  }

  return results.filter(Boolean);
}
