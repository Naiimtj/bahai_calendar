---
name: capacitor-native
description: Capacitor 8 native-shell guidance for the iOS and Android targets. Use for capacitor.config.ts, ios/, android/, permissions, plugins, icons, splash, npx cap, Xcode, Android Studio, or device builds.
---

<!-- absorbed from .github-old — verify still applies -->

# Capacitor Native

The Vite + React web build in `dist/` is copied into both native shells. Fix behavior in `src/`, then run `pnpm run build` and `npx cap sync`; edit only intentional native configuration, not generated boilerplate.

Calendar sync uses the in-house `BahaiCalendarNative` bridge. iOS and Android support calendar listing and event create/edit/move; reminders are iOS-only and contacts are not implemented. All-day native events use exclusive end dates. Guard platform gaps with feature probes and retain web URL/ICS fallbacks.

Checklist: build and sync after changes; verify permissions and usage descriptions; test both platforms; verify icons and splash; confirm simulator/emulator evidence; keep secrets and generated caches out of source.

Platform references: see `ANDROID.md` and `IOS.md` in this directory.
