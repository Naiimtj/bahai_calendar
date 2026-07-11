---
name: capacitor-native
description: >
  Capacitor native shell guidance for this app (iOS + Android) on macOS. Covers
  adding/maintaining native platforms, syncing the web build, wiring plugin
  permissions, building/running in Xcode & Android Studio, and platform parity.
  Use when: adding Android support, touching `capacitor.config.ts`, `ios/` or
  `android/`, editing `Info.plist` / `AndroidManifest.xml`, wiring a Capacitor
  plugin, generating native icons/splash, or when the user mentions Capacitor,
  native build, iOS, Android, Xcode, Android Studio, `npx cap`, or a device build.
---

# Capacitor Native (iOS + Android)

This app is a **Vite + React SPA wrapped by Capacitor 8**. The web build in `dist/`
is copied into each native shell. Native folders are **generated** — treat them as
build output: edit config files by hand, never hand-edit generated boilerplate.

Platform deep-dives: **[ANDROID.md](ANDROID.md)** · **[IOS.md](IOS.md)**

## Golden rules

1. **Web-first.** Fix features in `src/`, then `pnpm run build` → `npx cap sync`.
   Never patch behaviour directly inside `ios/` or `android/`.
2. **Always `npx cap sync` after** a web build or after adding/updating a plugin —
   it copies `dist/` and re-installs native deps (pods / gradle).
3. **Config by hand, code generated.** Only edit intentional config: `capacitor.config.ts`,
   `Info.plist`, `AndroidManifest.xml`, `build.gradle`, `strings.xml`, `Package.swift`.
4. **Platform parity.** Every native capability must degrade gracefully where a
   platform lacks it (see matrix below). Guard with `Capacitor.getPlatform()` /
   feature probes exactly like `src/services/calendarSync.js` already does.
5. **Never commit secrets** (signing keys, keystores, provisioning profiles).

## Plugin capability matrix (in-house `BahaiCalendarNative` plugin)

Calendar sync is implemented by an in-house Capacitor plugin (no third-party
dependency): JS bridge `src/native/bahaiCalendarNative.js`, iOS native
`ios/App/App/BahaiCalendarNativePlugin.swift` (EventKit), Android native
`android/app/src/main/java/com/bahaicalendar/app/BahaiCalendarNativePlugin.java`
(CalendarContract).

| Feature                | iOS | Android | Notes                                            |
| ---------------------- | :-: | :-----: | ------------------------------------------------ |
| List calendars         | ✅  |   ✅    | Exposes iCloud/Google/Outlook accounts on device |
| Create / edit events   | ✅  |   ✅    | Writes into the selected device calendar         |
| Move event to calendar | ✅  |   ✅    | `modifyEvent` accepts a new `calendarId`         |
| Reminders (todo lists) | ✅  |   ❌    | iOS-only — must fall back on Android             |
| Contacts (guests)      | ❌  |   ❌    | Not implemented (unused in the UI)               |

> `src/services/calendarSync.js` already probes method names and falls back to web
> (`googleUrl`/`outlookUrl`/`.ics`). On Android, reminder paths MUST route to a
> graceful fallback (`supportsNativeReminders()` gates on iOS only).
> All-day events use an **exclusive end date** (`toNativeEndDate`/`fromNativeEndDate`
> in `src/services/personalCalendar.js`) — never send an inclusive last-day end
> straight to the native bridge, or the device calendar will show one extra day.

## Standard workflow

```
0. Verify env         → see ANDROID.md / IOS.md "Requirements"
1. pnpm run build     → produce dist/
2. npx cap sync       → copy web + install native deps
3. npx cap open ios   (or) npx cap open android
4. Run on simulator/emulator or device
5. Wire permissions   → Info.plist / AndroidManifest.xml (per plugin)
6. Test the feature on BOTH platforms; confirm graceful fallback
```

## Checklist before "done"

- [ ] `npx cap sync` run after the latest web build
- [ ] Required permissions/usage-descriptions present for every native API used
- [ ] iOS-only APIs (reminders, contacts) have an Android fallback
- [ ] App icon + splash generated for the target platform
- [ ] Builds and launches on a simulator/emulator (evidence, not assumption)
- [ ] No secrets or generated caches committed

## When something breaks

Use the `diagnose` skill loop. Most native issues are one of: stale `dist/` (forgot
`cap sync`), missing permission entry, wrong SDK/Xcode version, or an iOS-only API
called on Android. Check those four first.
