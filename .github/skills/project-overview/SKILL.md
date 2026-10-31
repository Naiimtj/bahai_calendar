# Project Overview

Living map for Bahai Calendar, a React 19 + Vite 6 SPA.

## Stack

- JavaScript/JSX, React 19, Vite 6
- TailwindCSS v4 in `src/index.css`
- React Context in `src/context/`
- i18next/react-i18next with `en`, `es`, `ar`, `de`, `fa`, `fr`
- Vitest 4 tests under `src/**/*.test.js`
- Native `fetch` services under `src/services/`
- Capacitor 8 shells under `ios/` and `android/` (read-only unless explicitly requested)

## Structure

- `src/App.jsx`: shell and state-driven navigation.
- `src/components/`: calendar views (month grids share the swipeable `MonthPager`), modals, pages, base primitives, and platform capability regression coverage in `remindersVisibility.test.js`.
- `src/context/`: Settings, Badíʿ year, navigation, and personal-event state.
- `src/hooks/`: month swipe pager (`useMonthPager`, with focused gesture tests), online status, fasting alarms, event notifications (with focused notification tests), keyboard behavior, and native widget sync (`useWidgetSync`).
- `src/i18n/locales/`: six locale JSON files.
- `src/lib/`: Badíʿ calendar engine and date helpers.
- `src/services/`: sun times, geocoding, calendar sync, personal-calendar access, event notification scheduling (with focused tests), and the native widget snapshot (`widgetSnapshot.js`).
- `ios/App/BahaiCalendarWidgets/`: WidgetKit extension (Badí' and Gregorian date/month, four weeks, and full Gregorian and Badí' months) that renders the snapshot shared through the App Group.
- `android/app/src/main/java/com/bahaicalendar/app/BahaiWidgetProvider.java`: seven Android Home Screen variants that render the same snapshot stored by `BahaiCalendarNativePlugin` in private app storage; layouts and metadata live under `android/app/src/main/res/`.
- `src/utils/`: pure event, time, size, and week helpers.

## Navigation

There is no router dependency. `src/App.jsx` owns page state and calendar view switching.

## State

Each context owns one domain. Consumers use the exported hooks and mutate state through provider actions. Do not create duplicate state owners.

## Design System

Use `src/components/base/`, `BaseIcon`, `src/index.css`, `styling/SKILL.md`, `company-styling/SKILL.md`, and the animation skills under this directory.

## Commands

- `pnpm dev`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

When files are created, deleted, or renamed, update this map and run the relevant validation.
