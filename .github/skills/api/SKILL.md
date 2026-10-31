# Fetch Services

This project has no custom backend. Network access uses native `fetch` in `src/services/`; Badíʿ calendar calculations are local in `src/lib/`.

## Service Boundaries

- Keep HTTP access in `src/services/`.
- Reuse the existing service modules and response handling before adding a new helper.
- Do not invent endpoints, base URLs, authentication, or response shapes.
- Validate response status and shape before consuming data.
- Handle offline mode, aborts, timeouts, and user-visible failures consistently with neighboring services.
- Keep calendar calculations out of network services.

Current external integrations are evidenced in the repository as sunrise/sunset, geocoding, calendar sync, and personal-calendar helpers. Confirm the exact URL and payload in the existing service before changing one.

## Safe Fetch Pattern

```js
export async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}
```

Use the project-specific service implementation rather than copying this helper when an existing equivalent is present.

## Review Checklist

- Endpoint and payload are evidenced by existing code or official project documentation.
- No credentials or environment-specific URLs are hardcoded.
- Errors and offline behavior are handled.
- External data is validated before use.
- Focused tests cover mapping and failure paths.
