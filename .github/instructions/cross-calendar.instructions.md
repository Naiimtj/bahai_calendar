---
description: Cross-calendar consistency rule for calendar views
applyTo: src/components/{BadiCalendar,CompactCalendar,GregorianCalendar,MixedCalendar,CalendarBottomBar,CalendarHeader,CalendarViewSwitcher,DensitySwitcher}.jsx
---

<!-- absorbed from .github-old — verify still applies -->

# Cross-Calendar Feature Parity

Every user-facing feature, setting, visual option, interaction, or information panel added to a calendar view must be implemented in all four: `GregorianCalendar`, `CompactCalendar`, `MixedCalendar`, and `BadiCalendar`.

Design shared logic first, implement the primary view, propagate to the remaining three, and run the build with all views rendering. Shared settings belong in `SettingsContext`; shared controls belong in `CalendarHeader`, `CalendarBottomBar`, or `CalendarViewSwitcher` where appropriate.
