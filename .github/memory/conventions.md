# Conventions

Verified project conventions not yet promoted to a `SKILL.md`. Inbox layer — promote stable entries to skills, then delete here. See `../MEMORY.md`.

## Naming

## File Organization

## Code Style

## Workflow

<!-- absorbed from .github_old — verify still applies. Project facts + conventions extracted from legacy copilot-instructions.md and i18n.agent.md. -->

## Absorbed from .github_old (Bahá'í Calendar — React/Vite)

### Frontend Conventions

- **Always use Tailwind CSS classes — never inline `style={{}}`.** No exceptions. Use arbitrary values (e.g. `pt-[max(0.75rem,env(safe-area-inset-top))]`) for values not covered by utilities. If a value isn't available as a utility, extend the theme in `index.css` via `@theme` or use Tailwind arbitrary-value syntax.
- **All icons go through `BaseIcon`** — see `.github/instructions/frontend-icons.instructions.md`. Never raw `<svg>` or `react-icons/*` in feature code.
- **Always use base components** (`src/components/base/`) for buttons/inputs/selects/modals/etc. — never raw HTML equivalents. See `.github/instructions/base-components.instructions.md`.
- **Cross-calendar parity is mandatory** — any calendar feature must land in ALL views (Gregorian, Badíʿ, Mixed, Compact). See `.github/instructions/cross-calendar.instructions.md`.
- **No lint suppression comments** — fix the root cause. See `.github/instructions/lint-discipline.instructions.md`.
- Settings are managed via `SettingsContext` with `localStorage` persistence.
- Badíʿ date conversions live in `src/lib/badiDate.jsx`.
- `CalendarHeader` = shared header for calendar views (search, nav, mobile menu via `onMenuClick`); `Header` = non-calendar pages only (hidden when `page === 'today'`).
- `CalendarViewSwitcher` = 3-option segmented pill in `CalendarBottomBar`.

### Run Commands

- `pnpm install` · `pnpm run dev` (port 4100) · `pnpm run network` (0.0.0.0:4100 LAN) · `pnpm run build` · `pnpm run preview`.

### Settings → localStorage keys

| Setting           | Key               | Values                                   |
| ----------------- | ----------------- | ---------------------------------------- |
| Language          | `language`        | `'system'` / `'en'` / `'ar'` / `'es'`    |
| Date shift        | `dateShift`       | `'sunset'` / `'clock'` (not implemented) |
| Secondary format  | `secondaryFormat` | `'numbers'` / `'name'`                   |
| Week start        | `weekStart`       | `'jalal'` / `'sunday'` / `'monday'`      |
| Calendar view     | `calendarView`    | `'gregorian'` / `'badi'` / `'mixed'`     |
| Calendar density  | `calendarDensity` | `'compacta'` / `'detalles'` / `'lista'`  |
| Show week numbers | `showWeekNumbers` | `true` / `false`                         |
| Dark mode         | `darkMode`        | `'system'` / `'dark'` / `'light'`        |

### i18n Conventions (react-i18next)

- **Library**: `react-i18next` + `i18next` + `i18next-browser-languagedetector`.
- **Locale files**: `src/i18n/locales/{lng}.json` — SIX locales: `en`, `es`, `ar`, `de`, `fa`, `fr`. Update ALL of them in a single operation; never leave one out.
- **Init**: `src/i18n/index.js`.
- **Hook**: `useTranslation()` → `const { t } = useTranslation();`. Labels use `t('key')`, not `$t()`.
- **Key style**: dot-nested **camelCase**, organized by feature (e.g. `calendar.monthNames.january`, `settings.display.densityLabel`).
- **Shared prefixes**: `btn.*` (buttons), `common.*` (shared labels), `validation.*` (rules).
- **Bahá'í domain terms**: `bahai.{category}.{key}` — e.g. `bahai.months.baha`, `bahai.holyDays.nawRuz`.
- Never delete existing translation keys without explicit confirmation. Verify JSON validity after edits (no trailing commas, correct nesting).
