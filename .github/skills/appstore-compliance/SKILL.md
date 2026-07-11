---
name: appstore-compliance
description: >
  Apple App Store compliance checker for web-based apps distributed via App Store
  (PWA/Capacitor/WebView). Validates UI, privacy, performance, and content rules
  against Apple Human Interface Guidelines and App Store Review Guidelines.
  Use when: adding new features, changing UI, handling user data, modifying
  permissions, preparing a release, or when user mentions "App Store", "Apple",
  "iOS compliance", "HIG", or "review guidelines".
---

<!-- absorbed from .github_old — verify still applies -->

# App Store Compliance

Enforce Apple App Store Review Guidelines and Human Interface Guidelines (HIG)
for a web app targeting iOS distribution. **Check every change against this list.**

## 1 — UI / Human Interface Guidelines

### 1.1 Touch targets

- Minimum 44×44pt tap targets for all interactive elements.
- Sufficient spacing between adjacent targets to prevent mis-taps.

### 1.2 Safe areas

- Content must respect `env(safe-area-inset-*)` on notched/Dynamic Island devices.
- No interactive elements hidden behind home indicator or status bar.

### 1.3 Typography & readability

- Minimum body text: 11pt (≈15px). Prefer 17pt (≈16px) for primary content.
- Sufficient color contrast (WCAG AA minimum: 4.5:1 for text, 3:1 for large text).
- Support Dynamic Type / system font scaling when possible.

### 1.4 Input zoom prevention

- All `<input>`, `<select>`, `<textarea>` must use `font-size >= 16px` on mobile
  to prevent iOS Safari auto-zoom.

### 1.5 Dark mode

- App must support both light and dark appearances.
- All custom colors must have dark mode variants.
- No hard-coded white/black backgrounds without dark mode alternative.

### 1.6 Orientation & layout

- Support portrait at minimum. If landscape supported, layout must adapt.
- Responsive layout for all iPhone screen sizes (SE to Pro Max).

### 1.7 Gestures

- Don't override system gestures (swipe-back, swipe-to-home).
- Custom gestures must feel native and not conflict with iOS conventions.

### 1.8 No web-browser chrome

- App must look and feel native. No visible URL bars, browser navigation, or
  "web page" feel. Use standalone display mode for PWA.

## 2 — Performance

### 2.1 Launch time

- App must be interactive within 3 seconds on a reasonable connection.
- Show loading state immediately (no blank white screen).

### 2.2 Responsiveness

- Animations at 60fps. No jank on scroll or transitions.
- No blocking operations on main thread.

### 2.3 Offline behavior

- App must handle offline/poor connectivity gracefully.
- Show meaningful error state, not a blank page or browser error.

### 2.4 Memory & battery

- No memory leaks (unsubscribed listeners, detached DOM nodes).
- No unnecessary background activity draining battery.

## 3 — Privacy & Data (Guidelines 5.1)

### 3.1 Data collection transparency

- If collecting any user data: privacy policy required and accessible in-app.
- App Privacy "nutrition label" must match actual data practices.

### 3.2 Permissions

- Only request permissions when needed (camera, location, notifications).
- Explain purpose clearly before requesting (purpose string).
- App must function (degraded OK) if user denies permission.

### 3.3 Tracking & analytics

- Must comply with App Tracking Transparency (ATT) if tracking across apps.
- No fingerprinting.

### 3.4 Data storage

- Sensitive data must not be stored in localStorage/cookies without encryption
  consideration.
- No credentials stored in plain text on device.

## 4 — Content & Legal (Guidelines 1.x, 3.x)

### 4.1 Minimum functionality

- App must provide value beyond a simple website. Not a "thin wrapper."
- Must have sufficient features to justify App Store presence.

### 4.2 Completeness

- No placeholder content, "coming soon" sections, or test data in production.
- All links must work. No dead ends.

### 4.3 Metadata accuracy

- App description, screenshots, and previews must accurately reflect app behavior.
- No misleading claims.

### 4.4 Age rating

- Content must match declared age rating.
- User-generated content requires moderation tools if applicable.

### 4.5 Legal

- Must include terms of service and privacy policy if applicable.
- Must respect copyright and intellectual property.

## 5 — Technical Requirements

### 5.1 WebView / Capacitor specifics

- Use WKWebView (UIWebView is rejected).
- Handle `viewport-fit=cover` for full-screen experiences.
- `<meta name="viewport">` must include `viewport-fit=cover, user-scalable=no`
  only if zoom is handled in-app.

### 5.2 Status bar

- Style status bar to match app header (`apple-mobile-web-app-status-bar-style`).
- Content must not collide with status bar area.

### 5.3 Splash / launch screen

- Provide proper launch screen / splash that matches app branding.
- No blank screen on launch.

### 5.4 Icons

- Provide all required icon sizes for App Store and home screen.
- No transparency in icons (iOS fills transparent areas with black).

### 5.5 Navigation

- Back navigation must work predictably (hardware & software).
- No dead-end screens without a way to navigate back.

## Checklist — Run Before Every Release

```
[ ] All tap targets ≥ 44×44pt
[ ] Safe area insets respected
[ ] Input font-size ≥ 16px on mobile (no auto-zoom)
[ ] Dark mode fully supported
[ ] Contrast ratios meet WCAG AA
[ ] App loads < 3s, no white flash
[ ] Offline state handled gracefully
[ ] No placeholder content or dead links
[ ] Privacy policy accessible (if collecting data)
[ ] Status bar styled correctly
[ ] Launch screen present
[ ] All icon sizes provided
[ ] Back navigation works on all screens
[ ] No system gesture conflicts
```

## How to Apply

When reviewing or writing code, scan for violations of the above rules.
Flag violations inline with: `⚠️ App Store: [rule number] — [brief description]`.
Suggest the fix immediately. Do not proceed past a violation without resolving it.
