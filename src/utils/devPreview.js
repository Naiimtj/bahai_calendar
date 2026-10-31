function parseBooleanEnv(value) {
  if (value == null) return null;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return null;
}

/**
 * Whether native-only Settings sections (device calendar, reminders, haptics,
 * fasting alarms) should render in a non-native browser session so they can be
 * previewed during local development. Purely a visibility switch — it never
 * bypasses the real native-capability checks a feature makes before calling a
 * native API, so previewed controls remain inert off-device.
 * Override with `VITE_SHOW_NATIVE_SETTINGS=false` (or `true`) in `.env.local`.
 */
export function shouldPreviewNativeSettings() {
  const forced = parseBooleanEnv(import.meta.env.VITE_SHOW_NATIVE_SETTINGS);
  if (forced != null) return forced;
  return import.meta.env.DEV && import.meta.env.MODE !== 'test';
}
