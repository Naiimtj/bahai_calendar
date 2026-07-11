---
description: Cross-calendar consistency rule. Use when adding or changing any visual feature, interaction, or setting that affects calendar views.
applyTo: 'src/components/{BadiCalendar,CompactCalendar,GregorianCalendar,MixedCalendar,CalendarBottomBar,CalendarHeader,CalendarViewSwitcher,DensitySwitcher}.jsx'
---

<!-- absorbed from .github_old — verify still applies -->

# Cross-Calendar Feature Parity (mandatory)

> **Hard rule.** Every user-facing feature, visual option, or interaction
> added to **any** calendar view **MUST** be implemented in **all** calendar
> views: `GregorianCalendar`, `CompactCalendar`, `MixedCalendar`, and
> `BadiCalendar`.

## What counts

- New settings (e.g. density, week numbers, color themes).
- New UI controls (e.g. switchers, bottom-bar buttons).
- New cell rendering modes (e.g. dots, detail text).
- New interaction patterns (e.g. swipe, long-press, selection behavior).
- New info panels (e.g. event lists, selected-day summaries).

## Workflow

1. Design the feature generically — use shared helpers or a shared component
   when the logic is identical across views.
2. Implement in the primary calendar first (usually `CompactCalendar`).
3. **Before declaring done**, propagate to the remaining three calendars.
4. Verify build passes with all four views rendering correctly.

## Shared infrastructure

| Concern        | File                                      |
| -------------- | ----------------------------------------- |
| Settings       | `src/context/SettingsContext.jsx`         |
| Bottom bar     | `src/components/CalendarBottomBar.jsx`    |
| Header         | `src/components/CalendarHeader.jsx`       |
| View switcher  | `src/components/CalendarViewSwitcher.jsx` |
| Density switch | `src/components/DensitySwitcher.jsx`      |

When a feature can be expressed as a shared component or hook, prefer that
over duplicating logic in each calendar file.
