---
name: appstore-compliance
description: Apple App Store and HIG checks for this Capacitor/WebView app. Use for iOS UI, privacy, permissions, performance, content, or release work.
---

<!-- absorbed from .github-old — verify still applies -->

# App Store Compliance

Check every iOS-facing change against these rules:

- Interactive targets are at least 44x44pt and respect safe-area insets.
- Mobile inputs use at least 16px computed text to avoid focus zoom; browser zoom remains enabled.
- Light and dark appearances, WCAG AA contrast, portrait layouts, and responsive iPhone sizes work.
- Do not override system gestures; custom gestures need reduced-motion and touch-accessible equivalents.
- Show loading and offline states; avoid main-thread blocking, leaks, and unnecessary background work.
- Request only needed permissions, explain purpose, and degrade gracefully when denied.
- Keep privacy policy, metadata, links, launch screen, icons, status bar, and back navigation complete.
- Use WKWebView, `viewport-fit=cover`, and safe-area handling without disabling accessibility zoom.

Before release verify: tap targets, safe areas, input sizing, dark mode, contrast, launch performance, offline state, privacy policy, permissions, icons, status bar, navigation, and system gesture compatibility.
