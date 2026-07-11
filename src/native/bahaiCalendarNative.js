import { registerPlugin } from '@capacitor/core';

/**
 * BahaiCalendarNative — in-house Capacitor plugin replacing
 * `@ebarooni/capacitor-calendar`. Exposes device calendar (iOS EventKit /
 * Android CalendarContract) read+write access, plus iOS Reminders.
 *
 * Native implementations:
 *  - iOS: ios/App/App/BahaiCalendarNativePlugin.swift (EventKit)
 *  - Android: android/app/src/main/java/com/bahaicalendar/app/BahaiCalendarNativePlugin.kt
 *    (CalendarContract — Reminders are iOS-only, not implemented on Android)
 */
export const CapacitorCalendar = registerPlugin('BahaiCalendarNative', {
  web: () =>
    import('./bahaiCalendarNative.web').then(
      (m) => new m.BahaiCalendarNativeWeb(),
    ),
});

export const EventSpan = {
  THIS_EVENT: 'thisEvent',
  THIS_AND_FUTURE_EVENTS: 'thisAndFutureEvents',
};

export const EventAvailability = {
  BUSY: 'busy',
  FREE: 'free',
  TENTATIVE: 'tentative',
};
