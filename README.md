# Bahá'í Calendar

Multilingual **Badí' (Bahá'í) calendar** with holy days, 19-day feasts, and the fasting period. Built as a mobile-first SPA with React 19 + Vite and packaged for **iOS** with Capacitor (**Android support coming soon**). Installable as a PWA and fully usable offline.

---

## Features

- **Multiple calendar views** — Gregorian, Badí' (Bahá'í), Mixed, and a Compact month grid.
- **Holy days & 19-day feasts** — Feast of each month, work-suspended holy days, and Ayyám-i-Há intercalary days.
- **The Fast** — dedicated section with sunrise/sunset times for the month of 'Alá', based on your location.
- **Upcoming events** — filterable list of Bahá'í holy days and feasts.
- **Personal events** — create events and reminders with repeat rules, alerts, and priority.
- **Calendar sync** — subscribe to public iCal/ICS URLs and read device calendars on iOS.
- **Localization** — 6 languages: English, Spanish, Arabic, German, Persian, French (RTL for `ar`/`fa`).
- **Appearance** — light / dark / system theme.
- **Configurable** — day begins at sunset or midnight, week start day, week numbers, 12/24h time, secondary date display.
- **Offline-first** — online status detection with an offline banner; PWA installable.

## Tech Stack

| Area            | Choice                                              |
| --------------- | --------------------------------------------------- |
| Framework       | React 19 (SPA, no SSR)                              |
| Build tool      | Vite 6                                              |
| Styling         | TailwindCSS v4 (`@theme` tokens in `src/index.css`) |
| State           | React Context API                                   |
| i18n            | i18next + react-i18next                             |
| HTTP            | fetch                                               |
| Native shell    | Capacitor 8 (iOS — Android planned)                 |
| Package manager | pnpm                                                |

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/)

### Install

```bash
pnpm install
```

### Develop

```bash
pnpm dev
```

The dev server runs on [http://localhost:4100](http://localhost:4100). To expose it on your local network:

```bash
pnpm network
```

### Build & preview

```bash
pnpm build     # production build to dist/
pnpm preview   # preview the production build
```

## Configuration

Badí' calendar data (Naw-Rúz, holy days, feast months) is computed locally in the
browser — no backend or API key is required.

Other data sources (no configuration needed):

- **Sun times** — [sunrise-sunset.org](https://sunrise-sunset.org)
- **Geocoding** — [Open-Meteo](https://open-meteo.com)
- **Event place search** — Apple MapKit on iOS, otherwise [Photon](https://photon.komoot.io) (OpenStreetMap)

## Native (Capacitor)

The native **iOS** shell lives in `ios/`. **Android support is coming soon** and will use the same Capacitor workflow. After building the web assets:

```bash
pnpm build
npx cap sync ios   # copy web build + plugins into the native project
npx cap open ios   # open in Xcode
npx cap run ios    # build & run on a simulator/device
```

> Once the Android platform is added (`npx cap add android`), the same commands apply with `android` in place of `ios`.

## Project Structure

```
src/
├── components/        # Feature components (calendar views, modals, pages)
│   └── base/          # Reusable UI primitives (BaseButton, BaseIcon, …)
├── context/           # Global state (Settings, BadiYear, PersonalEvents)
├── hooks/             # Reusable reactive logic (useMonthPager, useOnlineStatus)
├── services/          # Data access (badiApi, sunTimesApi, geocodingApi, …)
├── lib/               # Badí' calendar engine + date helpers (badiCalendar.js, badiDate.jsx)
├── utils/             # Pure helpers
├── i18n/              # i18next config + locale files (en, es, ar, de, fa, fr)
└── index.css          # Tailwind entry + @theme tokens
```

## Internationalization

All user-facing text is translated. Locale files live in `src/i18n/locales/` (`en`, `es`, `ar`, `de`, `fa`, `fr`). When adding a label, add the key to **all six** locale files.

## About the Bahá'í Calendar

The Badí' calendar consists of **19 months of 19 days** (361 days), plus 4–5 intercalary days (Ayyám-i-Há) before the last month. The year begins on **Naw-Rúz**, coinciding with the vernal equinox (around March 20). Each day begins at sunset.
