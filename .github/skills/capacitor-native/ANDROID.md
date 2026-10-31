# Android (Capacitor 8)

<!-- absorbed from .github-old — verify still applies -->

- Require Node 22+, pnpm, Android Studio, SDK API 24+, and a bundled JDK.
- Declare calendar read/write permissions in `android/app/src/main/AndroidManifest.xml`; request runtime consent and degrade when denied.
- Keep `applicationId` aligned with `capacitor.config.ts`; use Java for native plugin code because Kotlin is not configured.
- Build then sync with `pnpm run build && npx cap sync android`; run through Android Studio or `npx cap run android`.
- Reminders are iOS-only. Optional hardware permissions need matching `uses-feature android:required="false"` entries.
- Use API 24+ emulator images to avoid stale WebView behavior.
