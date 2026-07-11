# Component Creation & Hierarchy

> **Stack-specific skill** (React 19 function components + TailwindCSS v4). No UI library — the project has its own base components. See `.github/instructions/base-components.instructions.md`, `.github/instructions/frontend-icons.instructions.md`, and `.github/instructions/cross-calendar.instructions.md`.

## Hierarchy

```
src/components/
├── base/        ← reusable UI primitives (Base*.jsx) + icons/
│   └── icons/   ← SVG icon components + registry
└── *.jsx        ← feature components (calendar views, headers, modals, pages)
```

1. **Base components** (`src/components/base/`) — `BaseButton`, `BaseTextInput`, `BaseNumberInput`, `BaseSelect`, `BaseSelectInput`, `BaseMultiSelectInput`, `BaseCheckbox`, `BaseToggle`, `BaseToggleSwitch`, `BaseModal`, `BaseIcon`, `BaseSearchBar`, `BaseTag`, `BaseSpinner`, `BaseTooltip`, `BaseExpandableSection`, `BaseForm`, `BaseFormDateField`, `BaseLabel`, `BaseAnchor`, etc.
2. **Feature components** (`src/components/`) — calendar views (`GregorianCalendar`, `CompactCalendar`, `MixedCalendar`, `BadiCalendar`), `CalendarHeader`, `CalendarBottomBar`, switchers, modals, page components.

## Mandatory Rules

- **Always use a base component instead of a raw HTML element** when one exists (`<button>`, `<input>`, `<select>`, `<textarea>`, `<a>`, `<svg>` …). No raw primitives in `src/` outside `src/components/base/`.
- **Every icon goes through `BaseIcon`** — never inline `<svg>` or import `react-icons/*` in feature components. Clickable icon → pass `onClick` to `BaseIcon` (never wrap in `<button>`).
- **No inline `style={{}}`** — Tailwind classes only.
- **Import base components from the barrel**: `import { BaseButton, BaseSelect } from '../base'`.
- If a base component is missing → create `Base<Name>.jsx` in `src/components/base/`, export it from `src/components/base/index.js`, then use it.

## Cross-Calendar Parity (hard rule)

Any user-facing feature, option, or interaction added to one calendar view **must** be added to all four (`GregorianCalendar`, `CompactCalendar`, `MixedCalendar`, `BadiCalendar`). Prefer a shared component/hook over duplicating logic. See `.github/instructions/cross-calendar.instructions.md`.

## Component Conventions

```jsx
import { useTranslation } from 'react-i18next';
import { BaseButton } from './base';

export default function UpcomingEvents({ events, onSelect }) {
  const { t } = useTranslation();
  if (!events.length)
    return <p className="text-gray-500">{t('shared.noEvents')}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {events.map((e) => (
        <li key={e.id}>
          <BaseButton onClick={() => onSelect(e)}>{e.title}</BaseButton>
        </li>
      ))}
    </ul>
  );
}
```

- Function components, PascalCase `.jsx`, default export for feature components.
- Destructure props explicitly; keep components focused on rendering + interaction.
- Move data/logic into hooks (`src/hooks/`), contexts (`src/context/`), services (`src/services/`), or utils (`src/utils/`).
- Keys on lists must be stable and unique.

## Review Checklist

- [ ] Uses base components, never raw HTML primitives
- [ ] Every icon rendered via `BaseIcon`
- [ ] No inline `style={{}}`; Tailwind classes only
- [ ] Cross-calendar parity respected for calendar features
- [ ] All labels translated (`t()`), across six locales
- [ ] Logic extracted to hooks/context/services/utils; component stays focused
