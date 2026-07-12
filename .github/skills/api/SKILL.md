# API Integration

> **Stack-specific skill** (native `fetch` + service modules in `src/services/`). This app has **no custom backend** — it consumes public third-party APIs. Badí' calendar data is computed locally in `src/lib/badiCalendar.js` (no network call). Fetch stays out of components.

Best practices for data access in this project.

## Architecture

All network calls live in **service modules** under `src/services/` (native `fetch`). Components and contexts call service functions; they never call `fetch` directly.

| Service               | Purpose                                                     |
| --------------------- | ----------------------------------------------------------- |
| `badiApi.js`          | Bahá'í calendar / holy day data (local compute, no network) |
| `sunTimesApi.js`      | Sunrise / sunset times (for sunset-based day boundaries)    |
| `geocodingApi.js`     | Location lookup / geocoding                                 |
| `calendarSync.js`     | Device calendar sync (Capacitor calendar plugin)            |
| `personalCalendar.js` | Personal event storage helpers                              |

## Rules

1. **Never call `fetch` directly in components or JSX** — add or use a function in the relevant `src/services/*.js` module.
2. **One service module per external concern** — keep a service focused on a single API/domain.
3. **Handle errors in the service** — return a typed/normalized result or throw a clear error; don't leak raw `fetch`/network errors to the UI. Surface user-facing failures via UI state, not silent catches.
4. **No hardcoded secrets** — none are needed for the public APIs; never embed keys in source.
5. **Respect offline** — use `useOnlineStatus` before network-dependent actions where relevant.

## Adding a New Service Call — Checklist

1. Pick the correct service module (or create `src/services/<name>.js` for a new external concern).
2. Implement the call with the native `fetch` API, keeping the base URL and params inside the module.
3. Normalize the response into the shape the app expects before returning.
4. Handle network/HTTP errors explicitly; return a predictable value or throw.
5. Call the service from a context action or a hook — not from a component render path.
6. Guard for offline / missing geolocation permission where applicable.

## Example

```js
// src/services/sunTimesApi.js
export async function getSunTimes({ lat, lng, date }) {
  try {
    const res = await fetch(
      `https://api.sunrisesunset.io/json?lat=${lat}&lng=${lng}&date=${date}`,
    );
    const data = await res.json();
    return { sunrise: data.results.sunrise, sunset: data.results.sunset };
  } catch (err) {
    throw new Error('Failed to fetch sun times');
  }
}
```

```jsx
// consumed from a hook / context action, not inline in JSX
const times = await getSunTimes({ lat, lng, date });
```

## Anti-Patterns — Do NOT

- Call `fetch` directly inside components or effects scattered across the UI.
- Duplicate the same request in multiple places — put it in a service and reuse.
- Swallow errors silently — always surface or rethrow.
- Hardcode environment/base URLs in components.
