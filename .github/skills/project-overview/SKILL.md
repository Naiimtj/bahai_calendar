# Project Overview

> **Generated, project-specific skill** — refresh with `/refresh-overview` when the structure changes. A living map of the **Bahá'í Calendar** (`bahai-calendar`) project.

## What Is This

Bahá'í Calendar is a web app for displaying and navigating the Badíʿ (Bahá'í) calendar alongside the Gregorian calendar. Users switch between calendar views (Gregorian, Badíʿ, Mixed, Compact), view upcoming holy days and events, track fasting periods, and customize display settings (density, dark mode, language, week start). Packaged as an iOS app via Capacitor.

## Tech Stack

| Layer     | Technology                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------- |
| Framework | React 19 + Vite 6 (SPA, no SSR)                                                                   |
| Language  | JavaScript / JSX (TS available as devDep; source is `.jsx`/`.js`)                                 |
| Styling   | TailwindCSS v4 (`@tailwindcss/vite`), `@theme` tokens in `src/index.css`                          |
| State     | React Context API — `SettingsContext`, `BadiYearContext`, `PersonalEventsContext`                 |
| i18n      | i18next + react-i18next + browser-languagedetector — `src/i18n/locales/` (en, es, ar, de, fa, fr) |
| Testing   | None configured                                                                                   |
| HTTP      | axios + custom services in `src/services/`                                                        |
| Icons     | Custom `BaseIcon` + SVG registry (`src/components/base/icons/`)                                   |
| Mobile    | Capacitor 8 (iOS shell in `ios/`)                                                                 |
| Package   | pnpm (workspace-aware); dev server on port 4100                                                   |
| Dev tools | @locator/runtime (click-to-source in dev mode)                                                    |

## Folder Map

```
bahai_calendar/
├── index.html · package.json · pnpm-lock.yaml · pnpm-workspace.yaml · vite.config.js
├── capacitor.config.ts       ← Capacitor (iOS native shell)
├── ios/                      ← Xcode project
├── public/                   ← static assets (static/icons, static/flags, manifest.json)
├── scripts/                  ← icon generation (extract-icon.cjs, gen-icons.cjs)
└── src/
    ├── App.jsx               ← app shell, view routing (page state), calendar view switcher
    ├── main.jsx · index.css  ← React 19 entry + Tailwind v4 entry (@theme)
    ├── components/           ← feature components + base/
    │   ├── {Badi,Compact,Gregorian,Mixed}Calendar.jsx · BadiYearView.jsx · YearView.jsx
    │   ├── CalendarBottomBar.jsx · CalendarHeader.jsx · CalendarViewSwitcher.jsx · DensitySwitcher.jsx
    │   ├── Header.jsx · Sidebar.jsx · Settings.jsx · Help.jsx · About.jsx · Privacy.jsx
    │   ├── Fasting.jsx · UpcomingEvents.jsx · SelectedDayEvents.jsx · CellEventDetails.jsx · MiniMonthGrid.jsx
    │   ├── AddEventModal.jsx · EventDetailModal.jsx · BadiEventDetailModal.jsx
    │   └── base/             ← reusable base components (Base*.jsx) + icons/ (SVG registry) + index.js barrel
    ├── context/              ← SettingsContext.jsx · BadiYearContext.jsx · PersonalEventsContext.jsx
    ├── hooks/                ← useSwipe.js · useOnlineStatus.js
    ├── i18n/                 ← index.js + locales/ (en, es, ar, de, fa, fr .json)
    ├── lib/                  ← badiDate.jsx (Badíʿ ↔ Gregorian conversion)
    ├── services/             ← badiApi.js · sunTimesApi.js · geocodingApi.js · calendarSync.js · personalCalendar.js
    └── utils/                ← searchEvents.js · sizeIcon.js · timeFormat.js · weekNumber.js
```

## App Structure & Routing

No router library. `src/main.jsx` mounts the app; `src/App.jsx` holds the shell, a `page` state for view routing, and the calendar view switcher. `CalendarHeader` is the shared header for calendar views; `Header` is only for non-calendar pages.

## Run Commands

```bash
pnpm install          # install dependencies
pnpm run dev          # dev server on port 4100
pnpm run network      # dev server on 0.0.0.0:4100 (LAN access)
pnpm run build        # production build
pnpm run preview      # preview production build
```

## Context / State

| Context                 | Domain                                                 |
| ----------------------- | ------------------------------------------------------ |
| `SettingsContext`       | Settings, language, dark mode (localStorage-persisted) |
| `BadiYearContext`       | Badíʿ year data                                        |
| `PersonalEventsContext` | User personal events                                   |

## Hooks

| Hook              | Purpose                     |
| ----------------- | --------------------------- |
| `useSwipe`        | Swipe gesture detection     |
| `useOnlineStatus` | Online/offline connectivity |

## Services

| Service               | Purpose                    |
| --------------------- | -------------------------- |
| `badiApi.js`          | Badíʿ calendar API calls   |
| `sunTimesApi.js`      | Sunrise/sunset times       |
| `geocodingApi.js`     | Location geocoding         |
| `calendarSync.js`     | Device calendar sync       |
| `personalCalendar.js` | Personal calendar / events |

## Utilities & lib

| File                    | Purpose                           |
| ----------------------- | --------------------------------- |
| `utils/weekNumber.js`   | ISO week number helpers           |
| `utils/sizeIcon.js`     | Icon sizing helper                |
| `utils/timeFormat.js`   | Time formatting                   |
| `utils/searchEvents.js` | Event search                      |
| `lib/badiDate.jsx`      | Badíʿ ↔ Gregorian date conversion |

## Component Hierarchy

- **Base** (`src/components/base/Base*.jsx`) — reusable UI primitives, imported from the `../base` barrel (`index.js`).
- **Feature** (`src/components/*.jsx`) — calendar views, headers, switchers, modals, page components.

### Base Components (`src/components/base/`)

`BaseAnchor` · `BaseAutocompleteInput` · `BaseBoxSelector` · `BaseButton` · `BaseCheckbox` · `BaseCopyButton` · `BaseDropFile/` · `BaseExpandableSection` · `BaseForm` · `BaseFormDateField` · `BaseIcon` · `BaseLabel` · `BaseModal` · `BaseMultiSelectInput` · `BaseNumberInput` · `BaseSearchBar` · `BaseSegmentedControl` · `BaseSelect` · `BaseSelectInput` · `BaseSpinner` · `BaseTag` · `BaseTextInput` · `BaseTextarea` · `BaseToastNotification` · `BaseToggle` · `BaseToggleSwitch` · `BaseTooltip` · `BaseWheelPicker`

Icons: SVG registry in `src/components/base/icons/` (~53 icons registered in `icons/index.js`) — always rendered via `<BaseIcon icon="..." />`.

### Component Notes

- `CalendarHeader` = shared header for calendar views (search, nav arrows, mobile menu icon via `onMenuClick`).
- `Header` = only for non-calendar pages (settings, help, about); hidden when `page === 'today'`.
- `CalendarViewSwitcher` = 3-option segmented pill (gregorian/mixed/badi); lives in `CalendarBottomBar`.
- **Cross-calendar rule**: features must be mirrored across all four calendar views.

## Settings (persisted to localStorage via SettingsContext)

| Setting           | Key               | Values                            |
| ----------------- | ----------------- | --------------------------------- |
| Language          | `language`        | `system` / `en` / `es` / `ar` / … |
| Secondary format  | `secondaryFormat` | `numbers` / `name`                |
| Week start        | `weekStart`       | `jalal` / `sunday` / `monday`     |
| Calendar view     | `calendarView`    | `gregorian` / `badi` / `mixed`    |
| Calendar density  | `calendarDensity` | `compacta` / `detalles` / `lista` |
| Show week numbers | `showWeekNumbers` | `true` / `false`                  |
| Dark mode         | `darkMode`        | `system` / `dark` / `light`       |

## Quick Lookup — "Where does X live?"

| I need to…                        | Look in…                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| Change calendar rendering         | `src/components/{Badi,Compact,Gregorian,Mixed}Calendar.jsx` (apply to ALL — cross-calendar rule) |
| Create a base/primitive component | `src/components/base/` (export from `index.js`)                                                  |
| Add an icon                       | `src/components/base/icons/` + register in `icons/index.js`, render via `<BaseIcon>`             |
| Add global state                  | `src/context/` — new `*Context.jsx`                                                              |
| Add reactive logic                | `src/hooks/` — new `use*.js`                                                                     |
| Add a pure helper                 | `src/utils/`                                                                                     |
| Add an API/service call           | `src/services/`                                                                                  |
| Badíʿ date conversion             | `src/lib/badiDate.jsx`                                                                           |
| Add a translation                 | `src/i18n/locales/*.json` (ALL 6 locale files)                                                   |
