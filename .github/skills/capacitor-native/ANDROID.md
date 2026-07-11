# Android (Capacitor 8)

Reference for adding and maintaining the Android shell of this app on macOS.

## Requirements

- **Node 22+** and **pnpm** (already used by this repo).
- **Android Studio** (Capacitor 8 needs a recent stable — 2025.2.1 or newer).
  The bundled **JDK is installed automatically** by Android Studio; do NOT install a
  separate JDK.
- **Android SDK** via Studio → _Tools → SDK Manager_: install SDK Platform **API 24+**
  (min supported) plus the latest stable platform, and the SDK build tools.
- Support floor: **API 24 (Android 7)**, WebView = Chrome 60+ (System WebView on
  Android 10+). Emulators must use an **API 24+ system image**.

## One-time platform setup

```bash
pnpm add -D @capacitor/android      # add the Android runtime
pnpm run build                      # produce dist/
npx cap add android                 # generates ./android (commit it)
npx cap open android                # opens Android Studio
```

`npx cap add android` scaffolds `android/` from `capacitor.config.ts` (`appId`,
`appName`). Commit the folder — it is the project's Android source of truth.

## Permissions — calendar plugin

Android is **explicit**: declare permissions in
`android/app/src/main/AndroidManifest.xml`, inside `<manifest>`:

```xml
<uses-permission android:name="android.permission.READ_CALENDAR" />
<uses-permission android:name="android.permission.WRITE_CALENDAR" />
```

The plugin still requests **runtime** consent; the manifest entry only makes the
permission requestable. No reminders/contacts permissions are needed — those APIs
are iOS-only and must fall back on Android.

## App identity, name, gradle

- **Application ID**: `applicationId` in `android/app/build.gradle` — keep it equal to
  `appId` in `capacitor.config.ts` (`com.bahaicalendar.app`).
- **Display name**: `app_name` in `android/app/src/main/res/values/strings.xml`.
- **URL scheme / deeplinks**: `custom_url_scheme` in the same `strings.xml`.

## Icons & splash

Generate Android launcher icons + adaptive icon and the splash from the source art.
The repo already has `scripts/gen-icons.cjs` / `scripts/extract-icon.cjs` for iOS
assets — extend or add an Android target rather than hand-placing files in
`android/app/src/main/res/mipmap-*`. The `@capacitor/assets` generator is the
standard tool if a dependency is acceptable.

## Build & run

```bash
pnpm run build && npx cap sync android   # after every web change
npx cap run android                      # pick device/emulator, or
npx cap open android                     # then Run ▶ in Android Studio
```

Prefer the **Run** button (not Debug) unless stepping through Java/Kotlin.

## Android gotchas

- **Reminders are iOS-only** in the calendar plugin. On Android,
  `createNativeReminder` flows in `src/services/calendarSync.js` must route
  to a graceful fallback — never call the missing native method (already gated by
  `supportsNativeReminders()`).
- **No Kotlin toolchain configured** in this project (`android.builtInKotlin=false`,
  no `kotlin-android` gradle plugin). Write native Android plugin code in **Java**,
  not Kotlin, unless the Kotlin plugin is deliberately added first.
- **Forgot `cap sync`** → the app runs stale `dist/`. Always build then sync.
- **Emulator shows a blank/old WebView** → use an **API 24+** image; System WebView
  does not auto-update on emulators.
- **Permission denied at runtime** → manifest entry present but the runtime request
  was denied; keep the app functional (degraded) when the user says no.
- Keep `android/` out of ad-hoc edits — regenerating is expensive; change config, not
  generated code.
